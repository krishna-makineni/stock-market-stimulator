import { useStock } from "../context/StockContext";

const TickerTape = () => {
  const { prices } = useStock();
  const stocks = Object.values(prices);

  if (stocks.length === 0) return null;

  const items = [...stocks, ...stocks]; // Duplicate for seamless loop

  return (
    <div className="bg-dark-800 border-b border-slate-800 py-1.5 overflow-hidden">
      <div className="ticker-content">
        {items.map((stock, i) => (
          <span key={i} className="inline-flex items-center gap-2 mx-6 text-xs font-mono">
            <span className="text-slate-300 font-semibold">{stock.symbol}</span>
            <span className="text-white">${stock.price?.toFixed(2)}</span>
            <span
              className={`${
                stock.changePct >= 0 ? "text-neon-green" : "text-neon-red"
              }`}
            >
              {stock.changePct >= 0 ? "▲" : "▼"}{" "}
              {Math.abs(stock.changePct).toFixed(2)}%
            </span>
          </span>
        ))}
      </div>
    </div>
  );
};

export default TickerTape;
