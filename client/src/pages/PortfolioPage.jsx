import { useOutletContext } from "react-router-dom";

const money = (n) => n == null ? "-" : "$" + Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const cls = (n) => (n > 0 ? "up" : n < 0 ? "down" : "muted");

export default function PortfolioPage() {
  const { portfolio } = useOutletContext();

  return (
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
  );
}