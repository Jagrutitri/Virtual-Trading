import fs from "fs";
import path from "path";

const stocks = [
  { symbol: "AAPL", name: "Apple Inc.", start: 185 },
  { symbol: "MSFT", name: "Microsoft Corp.", start: 410 },
  { symbol: "GOOGL", name: "Alphabet Inc.", start: 150 },
  { symbol: "AMZN", name: "Amazon.com Inc.", start: 175 },
  { symbol: "TSLA", name: "Tesla Inc.", start: 240 },
  { symbol: "META", name: "Meta Platforms", start: 480 },
  { symbol: "NVDA", name: "NVIDIA Corp.", start: 790 },
  { symbol: "NFLX", name: "Netflix Inc.", start: 600 },
  { symbol: "JPM", name: "JPMorgan Chase", start: 190 },
  { symbol: "KO", name: "Coca-Cola Co.", start: 60 },
];

const TRADING_DAYS = 10;
const START_DATE = new Date(Date.UTC(2025, 0, 6)); // Mon, 6 Jan 2025

const days = [];
let d = new Date(START_DATE);
while (days.length < TRADING_DAYS) {
  const dow = d.getUTCDay(); // 0 = Sunday, 6 = Saturday
  if (dow !== 0 && dow !== 6) days.push(new Date(d));
  d.setUTCDate(d.getUTCDate() + 1);
}

// 09:30, 10:00, upto 16:00 (14 slots per day)
const slots = [];
for (let minutes = 9 * 60 + 30; minutes <= 16 * 60; minutes += 30) {
  slots.push(minutes);
}

fs.mkdirSync("data", { recursive: true });

for (const stock of stocks) {
  let price = stock.start;
  const rows = ["symbol,name,timestamp,price"];

  for (const day of days) {
    for (const m of slots) {
      const ts = new Date(day);
      ts.setUTCHours(Math.floor(m / 60), m % 60, 0, 0);
      const change = (Math.random() - 0.5) * 0.01; // -0.5% to +0.5%
      price = Math.round(price * (1 + change) * 100) / 100;
      rows.push(`${stock.symbol},${stock.name},${ts.toISOString()},${price}`);
    }
  }

  fs.writeFileSync(path.join("data", `${stock.symbol}.csv`), rows.join("\n"));
}

console.log("CSV files created in /data");