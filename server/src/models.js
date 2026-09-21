import mongoose from "mongoose";
const { Schema, model } = mongoose;

export const Stock = model(
  "Stock",
  new Schema({ symbol: { type: String, unique: true }, name: String })
);

const priceSchema = new Schema({ symbol: String, timestamp: Date, price: Number });
// Index makes "latest price at or before time X" queries fast
priceSchema.index({ symbol: 1, timestamp: 1 }, { unique: true });
export const Price = model("Price", priceSchema);

export const User = model(
  "User",
  new Schema({
    name: String,
    balance: Number,          // cash available
    startingBalance: Number,  // used to calculate total profit/loss
    realizedPnl: { type: Number, default: 0 }, // profit locked in from sells
  })
);

// One user only, so symbol is unique
export const Holding = model(
  "Holding",
  new Schema({
    symbol: { type: String, unique: true },
    quantity: Number,
    avgPrice: Number, // average buy price
  })
);

export const Transaction = model(
  "Transaction",
  new Schema(
    {
      symbol: String,
      type: { type: String, enum: ["BUY", "SELL"] },
      quantity: Number,
      price: Number,
      total: Number,
      realizedPnl: { type: Number, default: 0 }, // only meaningful for SELL
      simulatedTime: Date, // the market time the trade happened at
    },
    { timestamps: true } // adds createdAt (real time)
  )
);