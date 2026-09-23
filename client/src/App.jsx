import { useEffect, useState, useCallback, useRef } from "react";
import "./App.css";

async function api(url, options) {
  const res = await fetch(url, options);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Something went wrong");
  return data;
}

const money = (n) =>
  n == null ? "-" : "$" + Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const day = (iso) => iso.slice(0, 10);
const time = (iso) => iso.slice(11, 16);
const cls = (n) => (n > 0 ? "up" : n < 0 ? "down" : "muted");
const arrow = (n) => (n > 0 ? "▲" : n < 0 ? "▼" : "•");

export default function App() {
  const [timestamps, setTimestamps] = useState([]);
  const [at, setAt] = useState("");
  const [stocks, setStocks] = useState([]);
  const [portfolio, setPortfolio] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [symbol, setSymbol] = useState("AAPL");
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState(null);
  const [flash, setFlash] = useState({});
  const prevPrices = useRef({});

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

  // Flash price cells green/red for a moment when the price changes
  useEffect(() => {
    const changed = {};
    stocks.forEach((s) => {
      const prev = prevPrices.current[s.symbol];
      if (prev != null && s.price != null && prev !== s.price) {
        changed[s.symbol] = s.price > prev ? "up" : "down";
      }
      prevPrices.current[s.symbol] = s.price;
    });
    if (Object.keys(changed).length) {
      setFlash(changed);
      const t = setTimeout(() => setFlash({}), 750);
      return () => clearTimeout(t);
    }
  }, [stocks]);

  async function trade(type) {
    try {
      await api("/api/trade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol, type, quantity, at }),
      });
      setMessage({ ok: true, text: `${type} ${quantity} ${symbol} executed` });
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

  if (!at || !portfolio) return <p style={{ color: "#6B7686", padding: 20 }}>Loading market data...</p>;

  const dates = [...new Set(timestamps.map(day))];
  const timesForDay = timestamps.filter((t) => day(t) === day(at));
  const idx = timestamps.indexOf(at);
  const selected = stocks.find((s) => s.symbol === symbol);

  return (
    <div className="app">
      {/* Scrolling ticker tape */}
      <div className="ticker-wrap">
        <div className="ticker-track">
          {[...stocks, ...stocks].map((s, i) => (
            <span key={i} className="ticker-item">
              <b>{s.symbol}</b>
              <span className={cls(s.change)}>{money(s.price)} {arrow(s.change)} {Math.abs(s.changePct ?? 0)}%</span>
            </span>
          ))}
        </div>
      </div>

      {/* Header */}
      <div className="header">
        <div className="brand">
          <h1>PAPER EXCHANGE</h1>
          <span className="sub">virtual trading desk</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span className="live-badge"><span className="live-dot" /> SIMULATED FEED</span>
          <span className="account-chip">DEMO ACCOUNT · <b>{money(portfolio.balance)}</b> cash</span>
        </div>
      </div>

      {/* Market clock */}
      <div className="panel clock">
        <div className="field">
          <span>DATE</span>
          <select value={day(at)} onChange={(e) => setAt(timestamps.find((t) => day(t) === e.target.value))}>
            {dates.map((d) => <option key={d}>{d}</option>)}
          </select>
        </div>
        <div className="field">
          <span>TIME</span>
          <select value={at} onChange={(e) => setAt(e.target.value)}>
            {timesForDay.map((t) => <option key={t} value={t}>{time(t)}</option>)}
          </select>
        </div>
        <div className="divider" />
        <button disabled={idx === 0} onClick={() => setAt(timestamps[idx - 1])}>◂ PREV</button>
        <button disabled={idx === timestamps.length - 1} onClick={() => setAt(timestamps[idx + 1])}>NEXT ▸</button>
        <span className="now">{day(at)} · {time(at)}</span>
      </div>

      {/* Summary strip */}
      <div className="summary">
        <div className="stat"><span>CASH</span><b>{money(portfolio.balance)}</b></div>
        <div className="stat"><span>HOLDINGS VALUE</span><b>{money(portfolio.holdingsValue)}</b></div>
        <div className="stat"><span>NET WORTH</span><b>{money(portfolio.netWorth)}</b></div>
        <div className="stat"><span>REALIZED P/L</span><b className={cls(portfolio.realizedPnl)}>{money(portfolio.realizedPnl)}</b></div>
        <div className="stat"><span>UNREALIZED P/L</span><b className={cls(portfolio.unrealizedPnl)}>{money(portfolio.unrealizedPnl)}</b></div>
        <div className="stat"><span>TOTAL P/L</span><b className={cls(portfolio.totalPnl)}>{money(portfolio.totalPnl)}</b></div>
      </div>

      {/* Market + trade ticket */}
      <div className="row">
        <div className="panel">
          <h2>MARKET</h2>
          <table>
            <thead><tr><th>SYMBOL</th><th>NAME</th><th className="r">PRICE</th><th className="r">CHANGE</th></tr></thead>
            <tbody>
              {stocks.map((s) => (
                <tr key={s.symbol} className={`market-row ${s.symbol === symbol ? "picked" : ""}`} onClick={() => setSymbol(s.symbol)}>
                  <td className="ticker-cell">{s.symbol}</td>
                  <td className="muted">{s.name}</td>
                  <td className={`r price-cell ${flash[s.symbol] ? "flash-" + flash[s.symbol] : ""}`}>{money(s.price)}</td>
                  <td className={`r num ${cls(s.change)}`}>{arrow(s.change)} {s.change} ({s.changePct}%)</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="panel trade-panel">
          <h2>ORDER TICKET</h2>
          <div className="selected-sym">{symbol}</div>
          <div className="row-line"><span>Market price</span><b>{selected ? money(selected.price) : "-"}</b></div>
          <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          <div className="row-line"><span>Est. total</span><b>{selected ? money(selected.price * quantity) : "-"}</b></div>
          <div className="trade-actions">
            <button className="buy" onClick={() => trade("BUY")}>BUY</button>
            <button className="sell" onClick={() => trade("SELL")}>SELL</button>
          </div>
          {message && <div className={`toast ${message.ok ? "ok" : "err"}`}>{message.text}</div>}
          <button className="reset-link" onClick={reset}>Reset account</button>
        </div>
      </div>

      {/* Portfolio */}
      <div className="panel">
        <h2>PORTFOLIO</h2>
        {portfolio.holdings.length === 0 ? <p className="empty">No open positions.</p> : (
          <table>
            <thead><tr><th>SYMBOL</th><th className="r">QTY</th><th className="r">AVG BUY</th><th className="r">CURRENT</th><th className="r">VALUE</th><th className="r">P/L</th></tr></thead>
            <tbody>
              {portfolio.holdings.map((h) => (
                <tr key={h.symbol}>
                  <td className="ticker-cell">{h.symbol}</td>
                  <td className="r num">{h.quantity}</td>
                  <td className="r num">{money(h.avgPrice)}</td>
                  <td className="r num">{money(h.currentPrice)}</td>
                  <td className="r num">{money(h.value)}</td>
                  <td className={`r num ${cls(h.pnl)}`}>{money(h.pnl)} ({h.pnlPct}%)</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Transaction log */}
      <div className="panel">
        <h2>TRANSACTION LOG</h2>
        {transactions.length === 0 ? <p className="empty">No trades yet.</p> : (
          <table>
            <thead><tr><th>MARKET TIME</th><th>TYPE</th><th>SYMBOL</th><th className="r">QTY</th><th className="r">PRICE</th><th className="r">TOTAL</th><th className="r">REALIZED P/L</th></tr></thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t._id}>
                  <td className="num muted">{day(t.simulatedTime)} {time(t.simulatedTime)}</td>
                  <td className={t.type === "BUY" ? "up" : "down"}>{t.type}</td>
                  <td className="ticker-cell">{t.symbol}</td>
                  <td className="r num">{t.quantity}</td>
                  <td className="r num">{money(t.price)}</td>
                  <td className="r num">{money(t.total)}</td>
                  <td className={`r num ${cls(t.realizedPnl)}`}>{t.type === "SELL" ? money(t.realizedPnl) : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}