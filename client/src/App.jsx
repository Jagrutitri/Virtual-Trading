import { useEffect, useState, useCallback } from "react";
import "./App.css";

async function api(url, options) {
  const res = await fetch(url, options);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Something went wrong");
  return data;
}

const money = (n) =>
  "$" + Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const day = (iso) => iso.slice(0, 10);   
const time = (iso) => iso.slice(11, 16); 
const cls = (n) => (n > 0 ? "up" : n < 0 ? "down" : "");

export default function App() {
  const [timestamps, setTimestamps] = useState([]);
  const [at, setAt] = useState("");
  const [stocks, setStocks] = useState([]);
  const [portfolio, setPortfolio] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [symbol, setSymbol] = useState("AAPL");
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    api("/api/timestamps").then((ts) => {
      setTimestamps(ts);
      setAt(ts[0]);
    });
  }, []);

  const refresh = useCallback(async () => {
    if (!at) return;
    const [s, p, t] = await Promise.all([
      api(`/api/stocks?at=${at}`),
      api(`/api/portfolio?at=${at}`),
      api("/api/transactions"),
    ]);
    setStocks(s);
    setPortfolio(p);
    setTransactions(t);
  }, [at]);

  useEffect(() => { refresh(); }, [refresh]);

  async function trade(type) {
    try {
      await api("/api/trade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol, type, quantity, at }),
      });
      setMessage({ ok: true, text: `${type} ${quantity} ${symbol} successful` });
      refresh();
    } catch (e) {
      setMessage({ ok: false, text: e.message });
    }
  }

  async function reset() {
    await api("/api/reset", { method: "POST" });
    setMessage({ ok: true, text: "Account reset" });
    refresh();
  }

  if (!at || !portfolio) return <p>Loading...</p>;

  const dates = [...new Set(timestamps.map(day))];
  const timesForDay = timestamps.filter((t) => day(t) === day(at));
  const idx = timestamps.indexOf(at);
  const selected = stocks.find((s) => s.symbol === symbol);

  return (
    <div className="app">
      <h1>Virtual Stock Trading</h1>

      {/* Market clock */}
      <section className="card clock">
        <label>Date{" "}
          <select value={day(at)} onChange={(e) => setAt(timestamps.find((t) => day(t) === e.target.value))}>
            {dates.map((d) => <option key={d}>{d}</option>)}
          </select>
        </label>
        <label>Time{" "}
          <select value={at} onChange={(e) => setAt(e.target.value)}>
            {timesForDay.map((t) => <option key={t} value={t}>{time(t)}</option>)}
          </select>
        </label>
        <button disabled={idx === 0} onClick={() => setAt(timestamps[idx - 1])}>◀ Prev</button>
        <button disabled={idx === timestamps.length - 1} onClick={() => setAt(timestamps[idx + 1])}>Next ▶</button>
      </section>

      {/* Summary */}
      <section className="summary">
        <div className="card"><small>Cash</small><b>{money(portfolio.balance)}</b></div>
        <div className="card"><small>Holdings value</small><b>{money(portfolio.holdingsValue)}</b></div>
        <div className="card"><small>Net worth</small><b>{money(portfolio.netWorth)}</b></div>
        <div className="card"><small>Realized P/L</small><b className={cls(portfolio.realizedPnl)}>{money(portfolio.realizedPnl)}</b></div>
        <div className="card"><small>Unrealized P/L</small><b className={cls(portfolio.unrealizedPnl)}>{money(portfolio.unrealizedPnl)}</b></div>
        <div className="card"><small>Total P/L</small><b className={cls(portfolio.totalPnl)}>{money(portfolio.totalPnl)}</b></div>
      </section>

      {/* Stocks + trade panel */}
      <div className="row">
        <section className="card grow">
          <h2>Market</h2>
          <table>
            <thead><tr><th>Symbol</th><th>Name</th><th>Price</th><th>Change</th></tr></thead>
            <tbody>
              {stocks.map((s) => (
                <tr key={s.symbol} className={s.symbol === symbol ? "picked" : ""} onClick={() => setSymbol(s.symbol)}>
                  <td>{s.symbol}</td><td>{s.name}</td>
                  <td>{money(s.price)}</td>
                  <td className={cls(s.change)}>{s.change} ({s.changePct}%)</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="card trade">
          <h2>Trade</h2>
          <p>Selected: <b>{symbol}</b> at <b>{selected ? money(selected.price) : "-"}</b></p>
          <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          <p>Total: {selected ? money(selected.price * quantity) : "-"}</p>
          <button className="buy" onClick={() => trade("BUY")}>Buy</button>
          <button className="sell" onClick={() => trade("SELL")}>Sell</button>
          {message && <p className={message.ok ? "up" : "down"}>{message.text}</p>}
          <button className="link" onClick={reset}>Reset account</button>
        </section>
      </div>

      {/* Portfolio */}
      <section className="card">
        <h2>Portfolio</h2>
        {portfolio.holdings.length === 0 ? <p>No holdings yet.</p> : (
          <table>
            <thead><tr><th>Symbol</th><th>Qty</th><th>Avg buy</th><th>Current</th><th>Value</th><th>P/L</th></tr></thead>
            <tbody>
              {portfolio.holdings.map((h) => (
                <tr key={h.symbol}>
                  <td>{h.symbol}</td><td>{h.quantity}</td><td>{money(h.avgPrice)}</td>
                  <td>{money(h.currentPrice)}</td><td>{money(h.value)}</td>
                  <td className={cls(h.pnl)}>{money(h.pnl)} ({h.pnlPct}%)</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* History */}
      <section className="card">
        <h2>Transaction history</h2>
        {transactions.length === 0 ? <p>No transactions yet.</p> : (
          <table>
            <thead><tr><th>Market time</th><th>Type</th><th>Symbol</th><th>Qty</th><th>Price</th><th>Total</th><th>Realized P/L</th></tr></thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t._id}>
                  <td>{day(t.simulatedTime)} {time(t.simulatedTime)}</td>
                  <td className={t.type === "BUY" ? "up" : "down"}>{t.type}</td>
                  <td>{t.symbol}</td><td>{t.quantity}</td>
                  <td>{money(t.price)}</td><td>{money(t.total)}</td>
                  <td className={cls(t.realizedPnl)}>{t.type === "SELL" ? money(t.realizedPnl) : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}