import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { Stock, Price, User, Holding, Transaction } from "./models.js";

const app = express();
app.use(cors());
app.use(express.json());

const round2 = (n) => Math.round(n * 100) / 100;

function parseAt(value) {
  const d = new Date(value);
  return isNaN(d) ? null : d;
}

// Latest price at or before the selected time
const getPriceAt = (symbol, at) =>
  Price.findOne({ symbol, timestamp: { $lte: at } }).sort({ timestamp: -1 });

// 1. All available time slots (for the date/time picker)
app.get("/api/timestamps", async (req, res) => {
  const ts = await Price.distinct("timestamp");
  ts.sort((a, b) => a - b);
  res.json(ts.map((d) => d.toISOString()));
});

// 2. All stocks with price at the selected time + change vs previous slot
app.get("/api/stocks", async (req, res) => {
  const at = parseAt(req.query.at);
  if (!at) return res.status(400).json({ error: "Invalid 'at' time" });

  const stocks = await Stock.find().sort({ symbol: 1 });
  const result = await Promise.all(
    stocks.map(async (s) => {
      const [latest, prev] = await Price.find({
        symbol: s.symbol,
        timestamp: { $lte: at },
      }).sort({ timestamp: -1 }).limit(2);

      if (!latest) return { symbol: s.symbol, name: s.name, price: null, change: 0, changePct: 0 };
      const change = prev ? latest.price - prev.price : 0;
      return {
        symbol: s.symbol,
        name: s.name,
        price: latest.price,
        change: round2(change),
        changePct: prev ? round2((change / prev.price) * 100) : 0,
      };
    })
  );
  res.json(result);
});

// 3. Portfolio with profit/loss at the selected time
app.get("/api/portfolio", async (req, res) => {
  const at = parseAt(req.query.at);
  if (!at) return res.status(400).json({ error: "Invalid 'at' time" });

  const user = await User.findOne();
  const holdings = await Holding.find().sort({ symbol: 1 });

  let currentValue = 0;
  let unrealizedPnl = 0;
  const rows = [];

  for (const h of holdings) {
    const p = await getPriceAt(h.symbol, at);
    const current = p ? p.price : h.avgPrice;
    const value = current * h.quantity;
    const pnl = (current - h.avgPrice) * h.quantity;
    currentValue += value;
    unrealizedPnl += pnl;
    rows.push({
      symbol: h.symbol,
      quantity: h.quantity,
      avgPrice: round2(h.avgPrice),
      currentPrice: current,
      value: round2(value),
      pnl: round2(pnl),
      pnlPct: round2(((current - h.avgPrice) / h.avgPrice) * 100),
    });
  }

  const netWorth = user.balance + currentValue;
  res.json({
    balance: round2(user.balance),
    holdingsValue: round2(currentValue),
    netWorth: round2(netWorth),
    realizedPnl: round2(user.realizedPnl),
    unrealizedPnl: round2(unrealizedPnl),
    totalPnl: round2(netWorth - user.startingBalance),
    holdings: rows,
  });
});

// 4. Buy or sell
app.post("/api/trade", async (req, res) => {
  const { symbol, type, quantity, at } = req.body;
  const qty = Number(quantity);
  const atDate = parseAt(at);

  if (!["BUY", "SELL"].includes(type)) return res.status(400).json({ error: "Type must be BUY or SELL" });
  if (!Number.isInteger(qty) || qty <= 0) return res.status(400).json({ error: "Quantity must be a positive whole number" });
  if (!atDate) return res.status(400).json({ error: "Invalid time" });

  const stock = await Stock.findOne({ symbol });
  if (!stock) return res.status(404).json({ error: "Stock not found" });

  const priceRow = await getPriceAt(symbol, atDate);
  if (!priceRow) return res.status(400).json({ error: "No market data at this time" });

  const price = priceRow.price;
  const total = round2(price * qty);
  const user = await User.findOne();
  const holding = await Holding.findOne({ symbol });
  let realizedPnl = 0;

  if (type === "BUY") {
    if (user.balance < total) return res.status(400).json({ error: "Insufficient virtual balance" });

    if (holding) {
      const newQty = holding.quantity + qty;
      holding.avgPrice = (holding.avgPrice * holding.quantity + total) / newQty;
      holding.quantity = newQty;
      await holding.save();
    } else {
      await Holding.create({ symbol, quantity: qty, avgPrice: price });
    }
    user.balance = round2(user.balance - total);
  } else {
    if (!holding || holding.quantity < qty) return res.status(400).json({ error: "Not enough shares to sell" });

    realizedPnl = round2((price - holding.avgPrice) * qty);
    holding.quantity -= qty;
    if (holding.quantity === 0) await holding.deleteOne();
    else await holding.save();

    user.balance = round2(user.balance + total);
    user.realizedPnl = round2(user.realizedPnl + realizedPnl);
  }

  await user.save();
  const tx = await Transaction.create({
    symbol, type, quantity: qty, price, total, realizedPnl, simulatedTime: priceRow.timestamp,
  });
  res.json(tx);
});

// 5. Transaction history (newest first)
app.get("/api/transactions", async (req, res) => {
  res.json(await Transaction.find().sort({ createdAt: -1 }));
});

// 6. Reset the account (handy for testing and demos)
app.post("/api/reset", async (req, res) => {
  await Holding.deleteMany({});
  await Transaction.deleteMany({});
  const user = await User.findOne();
  user.balance = user.startingBalance;
  user.realizedPnl = 0;
  await user.save();
  res.json({ ok: true });
});

await mongoose.connect(process.env.MONGO_URI);
app.listen(process.env.PORT || 5000, () =>
  console.log(`API running on http://localhost:${process.env.PORT || 5000}`)
);