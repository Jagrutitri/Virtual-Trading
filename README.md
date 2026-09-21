# Virtual Stock Trading Platform

A virtual stock trading app (no real money) built with MongoDB, Express, React and Node.
It simulates a market using CSV data for 10 stocks over 10 trading days at 30-minute intervals.

## Features
- View 10 stocks with prices at a selected date and time
- Move through time with date/time pickers and Prev/Next buttons
- Buy and sell using $100,000 of virtual money
- Portfolio with realized, unrealized and total profit/loss
- Transaction history

## Setup
1. Install Node.js (v18+) and MongoDB
2. `cd server`, then `npm install`
3. Copy `.env.example` to `.env`
4. `npm run generate` (creates the CSV files, already included in /data)
5. `npm run seed` (loads CSVs into MongoDB)
6. `npm run dev` (API on port 5000)
7. In a second terminal: `cd client`, `npm install`, `npm run dev`
8. Open http://localhost:5173

## Assumptions
- One predefined demo user, starting balance $100,000
- Trades execute at the price for the selected simulated time
- Whole shares only, no real money
- Price at a time = latest data point at or before that time

## Tech stack
React (Vite), Node.js, Express, MongoDB (Mongoose)
