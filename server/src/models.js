import mongoose from "mongoose";
const { Schema, model } = mongoose;

export const Stock = model(
  "Stock",
  new Schema({ symbol: { type: String, unique: true }, name: String })
);

const priceSchema = new Schema({ symbol: String, timestamp: Date, price: Number });
priceSchema.index({ symbol: 1, timestamp: 1 }, { unique: true });
export const Price = model("Price", priceSchema);

export const User = model(
  "User",
  new Schema({
    name: String,
    balance: Number,          
    startingBalance: Number,  
    realizedPnl: { type: Number, default: 0 }, 
  })
);

export const Holding = model(
  "Holding",
  new Schema({
    symbol: { type: String, unique: true },
    quantity: Number,
    avgPrice: Number, 
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
      realizedPnl: { type: Number, default: 0 }, 
      simulatedTime: Date, 
    },
    { timestamps: true } 
  )
);