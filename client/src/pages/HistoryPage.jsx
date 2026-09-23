import { useOutletContext } from "react-router-dom";

const money = (n) => n == null ? "-" : "$" + Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const cls = (n) => (n > 0 ? "up" : n < 0 ? "down" : "muted");
const day = (iso) => iso.slice(0, 10);
const time = (iso) => iso.slice(11, 16);

export default function HistoryPage() {
  const { transactions } = useOutletContext();

  return (
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
  );
}