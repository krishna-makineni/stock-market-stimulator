import { useState, useEffect } from "react";
import { useStock } from "../context/StockContext";
import { stockAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import TradeModal from "../components/TradeModal";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { MdTrendingUp, MdTrendingDown, MdRefresh } from "react-icons/md";

const COLORS = ["#00ff88", "#00d4ff", "#ffd700", "#ff6b35", "#a855f7", "#ec4899", "#14b8a6", "#f97316"];

const Portfolio = () => {
  const { user } = useAuth();
  const { prices } = useStock();
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedStock, setSelectedStock] = useState(null);
  const [tradeMode, setTradeMode] = useState("SELL");
  const [goalInput, setGoalInput] = useState(() => localStorage.getItem("netWorthGoal") || "200000");

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const fetchPortfolio = async () => {
    setLoading(true);
    try {
      const { data } = await stockAPI.portfolio();
      if (data.success) setPortfolio(data);
    } catch {}
    setLoading(false);
  };

  // Compute live values from SSE prices
  const liveHoldings = (portfolio?.portfolio || []).map((h) => {
    const livePrice = prices[h.symbol]?.price || h.currentPrice || h.avgBuyPrice;
    const currentValue = livePrice * h.quantity;
    const profitLoss = currentValue - h.totalInvested;
    const profitLossPct = (profitLoss / h.totalInvested) * 100;
    return { ...h, currentPrice: livePrice, currentValue, profitLoss, profitLossPct };
  });

  const totalPortfolioValue = liveHoldings.reduce((s, h) => s + h.currentValue, 0);
  const balance = portfolio?.balance || user?.balance || 0;
  const netWorth = balance + totalPortfolioValue;
  const totalDeposited = 100000;
  const totalPnL = netWorth - totalDeposited;
  const totalPnLPct = (totalPnL / totalDeposited) * 100;
  const goalValue = Math.max(1, Number(goalInput) || 0);
  const goalProgress = Math.min((netWorth / goalValue) * 100, 100);
  const remainingToGoal = Math.max(goalValue - netWorth, 0);
  const largestHoldingPct =
    totalPortfolioValue > 0
      ? Math.max(...liveHoldings.map((h) => (h.currentValue / totalPortfolioValue) * 100), 0)
      : 0;
  const concentrationTag =
    largestHoldingPct > 40 ? "High" : largestHoldingPct > 25 ? "Medium" : "Healthy";

  // Pie chart data
  const pieData = [
    { name: "Cash", value: parseFloat(balance.toFixed(2)) },
    ...liveHoldings.map((h) => ({
      name: h.symbol,
      value: parseFloat(h.currentValue.toFixed(2)),
    })),
  ];

  const openTrade = (holding, mode) => {
    const stockData = prices[holding.symbol]
      ? { ...prices[holding.symbol] }
      : { symbol: holding.symbol, name: holding.name, price: holding.currentPrice };
    setSelectedStock(stockData);
    setTradeMode(mode);
  };

  const saveGoal = () => {
    const next = Math.max(1, Number(goalInput) || 0);
    setGoalInput(String(next));
    localStorage.setItem("netWorthGoal", String(next));
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-neon-green border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-500 font-mono text-sm">Loading portfolio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">
            My <span className="neon-text">Portfolio</span>
          </h1>
          <p className="text-slate-500 text-sm font-mono">Live P&L tracking</p>
        </div>
        <button
          onClick={fetchPortfolio}
          className="flex items-center gap-1.5 px-3 py-2 glass rounded-lg text-slate-400 hover:text-white text-sm font-mono transition-all"
        >
          <MdRefresh className="text-base" /> Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {[
          {
            label: "Net Worth",
            value: `₹${netWorth.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
            color: "text-white",
          },
          {
            label: "Cash Balance",
            value: `₹${balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
            color: "text-neon-green",
          },
          {
            label: "Invested Value",
            value: `₹${totalPortfolioValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
            color: "text-neon-blue",
          },
          {
            label: "Total P&L",
            value: `${totalPnL >= 0 ? "+" : ""}₹${Math.abs(totalPnL).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
            sub: `${totalPnLPct >= 0 ? "+" : ""}${totalPnLPct.toFixed(2)}%`,
            color: totalPnL >= 0 ? "text-neon-green" : "text-neon-red",
          },
          {
            label: "Diversification",
            value: `${largestHoldingPct.toFixed(1)}% top holding`,
            sub: `${concentrationTag} concentration`,
            color:
              concentrationTag === "High"
                ? "text-neon-red"
                : concentrationTag === "Medium"
                ? "text-yellow-300"
                : "text-neon-green",
          },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className="glass rounded-xl p-4">
            <p className="text-xs text-slate-500 font-mono uppercase tracking-wider mb-1">
              {label}
            </p>
            <p className={`text-lg font-bold font-mono ${color}`}>{value}</p>
            {sub && <p className="text-xs text-slate-500 font-mono mt-0.5">{sub}</p>}
          </div>
        ))}
      </div>

      <div className="glass rounded-xl p-4 mb-6 border border-slate-800/70">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
          <div>
            <h2 className="text-sm font-semibold text-white">Net Worth Goal Tracker</h2>
            <p className="text-xs text-slate-500 font-mono">
              Goal: ₹{goalValue.toLocaleString("en-IN")} · Remaining: ₹
              {remainingToGoal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              min="1"
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              className="bg-dark-700 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white w-36"
            />
            <button
              onClick={saveGoal}
              className="px-3 py-1.5 rounded-lg bg-neon-blue/15 text-neon-blue border border-neon-blue/30 text-sm font-semibold hover:bg-neon-blue/25 transition-all"
            >
              Save Goal
            </button>
          </div>
        </div>
        <div className="w-full h-3 bg-dark-800 rounded-full overflow-hidden">
          <div
            className={`h-full ${goalProgress >= 100 ? "bg-neon-green" : "bg-neon-blue"}`}
            style={{ width: `${goalProgress}%` }}
          />
        </div>
        <div className="mt-2 text-right text-xs font-mono text-slate-400">
          Progress: {goalProgress.toFixed(1)}%
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {/* Holdings Table */}
        <div className="md:col-span-2">
          <div className="glass rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-800">
              <h2 className="font-display font-semibold text-white text-sm">
                Holdings ({liveHoldings.length})
              </h2>
            </div>

            {liveHoldings.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-slate-500 font-mono text-sm mb-2">
                  No holdings yet
                </p>
                <a href="/market" className="text-neon-green text-sm hover:underline font-mono">
                  Browse market →
                </a>
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-12 px-4 py-2 text-xs text-slate-500 font-mono uppercase border-b border-slate-800">
                  <div className="col-span-3">Symbol</div>
                  <div className="col-span-2 text-right">Qty</div>
                  <div className="col-span-2 text-right">Avg</div>
                  <div className="col-span-2 text-right">Current</div>
                  <div className="col-span-3 text-right">P&L</div>
                </div>
                {liveHoldings.map((h) => (
                  <div
                    key={h.symbol}
                    className="grid grid-cols-12 px-4 py-3 items-center border-b border-slate-800/50 hover:bg-slate-800/20 transition-all"
                  >
                    <div className="col-span-3">
                      <p className="font-mono font-semibold text-white text-sm">
                        {h.symbol}
                      </p>
                      <p className="text-xs text-slate-500 truncate">{h.name}</p>
                    </div>
                    <div className="col-span-2 text-right font-mono text-sm text-slate-300">
                      {h.quantity}
                    </div>
                    <div className="col-span-2 text-right font-mono text-xs text-slate-400">
                      ₹{h.avgBuyPrice?.toFixed(2)}
                    </div>
                    <div className="col-span-2 text-right font-mono text-sm text-white font-semibold">
                      ₹{h.currentPrice?.toFixed(2)}
                    </div>
                    <div className="col-span-3 text-right">
                      <div
                        className={`flex items-center justify-end gap-0.5 text-xs font-mono font-bold ${
                          h.profitLoss >= 0 ? "text-neon-green" : "text-neon-red"
                        }`}
                      >
                        {h.profitLoss >= 0 ? (
                          <MdTrendingUp />
                        ) : (
                          <MdTrendingDown />
                        )}
                        {h.profitLoss >= 0 ? "+" : ""}
                        {h.profitLossPct?.toFixed(1)}%
                      </div>
                      <p className="text-xs text-slate-500 font-mono">
                        {h.profitLoss >= 0 ? "+" : ""}₹{h.profitLoss?.toFixed(2)}
                      </p>
                      <div className="flex gap-1 mt-1 justify-end">
                        <button
                          onClick={() => openTrade(h, "BUY")}
                          className="px-1.5 py-0.5 text-xs bg-neon-green/10 text-neon-green rounded font-mono hover:bg-neon-green/20"
                        >
                          +
                        </button>
                        <button
                          onClick={() => openTrade(h, "SELL")}
                          className="px-1.5 py-0.5 text-xs bg-neon-red/10 text-neon-red rounded font-mono hover:bg-neon-red/20"
                        >
                          −
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Allocation Pie */}
        <div className="glass rounded-xl p-4">
          <h2 className="font-display font-semibold text-white text-sm mb-4">
            Allocation
          </h2>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "#0f172a",
                    border: "1px solid rgba(0,255,136,0.2)",
                    borderRadius: "8px",
                    fontSize: "11px",
                    fontFamily: "JetBrains Mono",
                  }}
                  formatter={(v) => [`₹${v.toLocaleString()}`, ""]}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => (
                    <span style={{ color: "#94a3b8", fontSize: "11px", fontFamily: "JetBrains Mono" }}>
                      {value}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-44 flex items-center justify-center text-slate-600 text-sm font-mono">
              No data
            </div>
          )}
        </div>
      </div>

      {selectedStock && (
        <TradeModal
          stock={selectedStock}
          mode={tradeMode}
          onClose={() => setSelectedStock(null)}
          onSuccess={fetchPortfolio}
        />
      )}
    </div>
  );
};

export default Portfolio;
