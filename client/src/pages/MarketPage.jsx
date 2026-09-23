import { useOutletContext } from "react-router-dom";

const money = (n) => n == null ? "-" : "$" + Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const cls = (n) => (n > 0 ? "up" : n < 0 ? "down" : "muted");
const arrow = (n) => (n > 0 ? "▲" : n < 0 ? "▼" : "•");

export default function MarketPage() {
  const { stocks, flash, symbol, setSymbol, quantity, setQuantity, trade, message, reset } = useOutletContext();
  const selected = stocks.find((s) => s.symbol === symbol);

  return (
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
  );
}