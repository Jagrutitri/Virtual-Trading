import "dotenv/config";
import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import { Stock, Price, User, Holding, Transaction } from "../src/models.js";

await mongoose.connect(process.env.MONGO_URI);

await Promise.all([
  Stock.deleteMany({}), Price.deleteMany({}), User.deleteMany({}),
  Holding.deleteMany({}), Transaction.deleteMany({}),
]);

const dataDir = path.resolve("data");
const files = fs.readdirSync(dataDir).filter((f) => f.endsWith(".csv"));

const stocks = new Map();
const prices = [];

for (const file of files) {
  const lines = fs.readFileSync(path.join(dataDir, file), "utf8").trim().split(/\r?\n/);
  lines.shift(); // remove header row
  for (const line of lines) {
    const [symbol, name, timestamp, price] = line.split(",");
    stocks.set(symbol, name);
    prices.push({ symbol, timestamp: new Date(timestamp), price: Number(price) });
  }
}

await Stock.insertMany([...stocks].map(([symbol, name]) => ({ symbol, name })));
await Price.insertMany(prices);
await User.create({ name: "Demo User", balance: 100000, startingBalance: 100000 });

console.log(`Loaded ${stocks.size} stocks and ${prices.length} price rows`);
await mongoose.disconnect();