import { useState, useEffect } from "react";
import { stockAPI } from "../services/api";
import { MdTrendingUp, MdTrendingDown, MdFilterList, MdDownload } from "react-icons/md";

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const { data } = await stockAPI.transactions();
      if (data.success) setTransactions(data.transactions);
    } catch {}
    setLoading(false);
  };

  const filtered =
    filter === "ALL"
      ? transactions
      : transactions.filter((t) => t.type === filter);

  const totalBought = transactions
    .filter((t) => t.type === "BUY")
    .reduce((s, t) => s + t.total, 0);

  const totalSold = transactions
    .filter((t) => t.type === "SELL")
    .reduce((s, t) => s + t.total, 0);

  const realizedPnL = transactions
    .filter((t) => t.type === "SELL")
    .reduce((s, t) => s + (t.profitLoss || 0), 0);

  const exportCsv = () => {
    const csvRows = [
      ["Date", "Type", "Symbol", "Name", "Quantity", "Price", "Total", "ProfitLoss"],
      ...filtered.map((tx) => [
        new Date(tx.createdAt).toISOString(),
        tx.type,
        tx.symbol,
        tx.name || "",
        tx.quantity,
        Number(tx.price || 0).toFixed(2),
        Number(tx.total || 0).toFixed(2),
        Number(tx.profitLoss || 0).toFixed(2),
      ]),
    ];

    const csv = csvRows
      .map((row) =>
        row
          .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `transactions-${filter.toLowerCase()}-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 animate-fade-in">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">
            Trade <span className="neon-text">History</span>
          </h1>
          <p className="text-slate-500 text-sm font-mono">{transactions.length} transactions</p>
        </div>
        <button
          onClick={exportCsv}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-neon-blue/10 text-neon-blue border border-neon-blue/30 text-xs font-mono hover:bg-neon-blue/20 transition-all"
        >
          <MdDownload className="text-sm" />
          Export CSV
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="glass rounded-xl p-4">
          <p className="text-xs text-slate-500 font-mono uppercase tracking-wider mb-1">Total Bought</p>
          <p className="text-lg font-bold font-mono text-white">
            ₹{totalBought.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="glass rounded-xl p-4">
          <p className="text-xs text-slate-500 font-mono uppercase tracking-wider mb-1">Total Sold</p>
          <p className="text-lg font-bold font-mono text-white">
            ₹{totalSold.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="glass rounded-xl p-4">
          <p className="text-xs text-slate-500 font-mono uppercase tracking-wider mb-1">Realized P&L</p>
          <p className={`text-lg font-bold font-mono ${realizedPnL >= 0 ? "text-neon-green" : "text-neon-red"}`}>
            {realizedPnL >= 0 ? "+" : ""}₹{Math.abs(realizedPnL).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 mb-4">
        <MdFilterList className="text-slate-500" />
        {["ALL", "BUY", "SELL"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
              filter === f
                ? f === "BUY"
                  ? "bg-neon-green/10 text-neon-green border border-neon-green/30"
                  : f === "SELL"
                  ? "bg-neon-red/10 text-neon-red border border-neon-red/30"
                  : "bg-slate-700 text-white border border-slate-600"
                : "bg-dark-700 text-slate-400 border border-slate-700 hover:text-white"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="grid grid-cols-12 px-4 py-2.5 text-xs text-slate-500 font-mono uppercase border-b border-slate-800">
          <div className="col-span-1">Type</div>
          <div className="col-span-2">Symbol</div>
          <div className="col-span-2 text-right">Qty</div>
          <div className="col-span-2 text-right">Price</div>
          <div className="col-span-2 text-right">Total</div>
          <div className="col-span-2 text-right hidden md:block">P&L</div>
          <div className="col-span-1 text-right hidden md:block">Date</div>
        </div>

        {loading ? (
          <div className="py-12 text-center">
            <div className="w-8 h-8 border-2 border-neon-green border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-slate-500 font-mono text-xs">Loading...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-slate-600 font-mono text-sm">
            No transactions yet
          </div>
        ) : (
          <div className="divide-y divide-slate-800/50">
            {filtered.map((tx) => (
              <div
                key={tx._id}
                className="grid grid-cols-12 px-4 py-3 items-center hover:bg-slate-800/20 transition-all"
              >
                <div className="col-span-1">
                  <span
                    className={`inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold ${
                      tx.type === "BUY"
                        ? "bg-neon-green/20 text-neon-green"
                        : "bg-neon-red/20 text-neon-red"
                    }`}
                  >
                    {tx.type === "BUY" ? (
                      <MdTrendingUp className="text-sm" />
                    ) : (
                      <MdTrendingDown className="text-sm" />
                    )}
                  </span>
                </div>
                <div className="col-span-2">
                  <p className="font-mono font-semibold text-white text-sm">
                    {tx.symbol}
                  </p>
                  <p className="text-xs text-slate-500 truncate hidden sm:block">
                    {tx.name}
                  </p>
                </div>
                <div className="col-span-2 text-right font-mono text-sm text-slate-300">
                  {tx.quantity}
                </div>
                <div className="col-span-2 text-right font-mono text-sm text-slate-300">
                  ₹{tx.price?.toFixed(2)}
                </div>
                <div className="col-span-2 text-right font-mono text-sm text-white font-semibold">
                  ₹{tx.total?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </div>
                <div className="col-span-2 text-right hidden md:block">
                  {tx.type === "SELL" ? (
                    <span
                      className={`font-mono text-sm font-bold ${
                        tx.profitLoss >= 0 ? "text-neon-green" : "text-neon-red"
                      }`}
                    >
                      {tx.profitLoss >= 0 ? "+" : ""}₹
                      {Math.abs(tx.profitLoss)?.toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-slate-600 text-sm font-mono">—</span>
                  )}
                </div>
                <div className="col-span-1 text-right hidden md:block">
                  <p className="text-xs text-slate-500 font-mono">
                    {new Date(tx.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                  <p className="text-xs text-slate-600 font-mono">
                    {new Date(tx.createdAt).toLocaleTimeString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Transactions;
