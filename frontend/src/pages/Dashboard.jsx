import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useStock } from "../context/StockContext";
import { stockAPI } from "../services/api";
import MiniChart from "../components/MiniChart";
import {
  MdTrendingUp,
  MdTrendingDown,
  MdAccountBalanceWallet,
  MdShowChart,
  MdArrowForward,
} from "react-icons/md";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const StatCard = ({ label, value, sub, color = "green", icon: Icon }) => (
  <div className="glass glass-hover rounded-xl p-4">
    <div className="flex items-start justify-between mb-2">
      <span className="text-xs text-slate-500 font-mono uppercase tracking-wider">
        {label}
      </span>
      {Icon && (
        <Icon
          className={`text-lg ${
            color === "green" ? "text-neon-green" : color === "red" ? "text-neon-red" : "text-neon-blue"
          }`}
        />
      )}
    </div>
    <p className={`text-xl font-bold font-mono ${
      color === "green" ? "text-neon-green" : color === "red" ? "text-neon-red" : "text-white"
    }`}>
      {value}
    </p>
    {sub && <p className="text-xs text-slate-500 mt-0.5 font-mono">{sub}</p>}
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const { prices } = useStock();
  const [portfolio, setPortfolio] = useState(null);
  const [netWorthHistory, setNetWorthHistory] = useState([]);

  useEffect(() => {
    fetchPortfolio();
  }, []);

  // Track net worth changes over time

  useEffect(() => {
    if (portfolio) {
      const portfolioValue = portfolio.portfolio?.reduce((sum, h) => {
        const cur = prices[h.symbol]?.price || h.currentPrice;
        return sum + cur * h.quantity;
      }, 0) || 0;
      const nw = (portfolio.balance || 0) + portfolioValue;
      setNetWorthHistory((prev) => {
        const now = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
        const next = [...prev, { time: now, value: parseFloat(nw.toFixed(2)) }];
        return next.slice(-20);
      });
    }
  }, [prices, portfolio]);

  const fetchPortfolio = async () => {
    try {
      const { data } = await stockAPI.portfolio();
      if (data.success) setPortfolio(data);
    } catch {}
  };

  // Get top movers from live prices
  const topMovers = Object.values(prices)
    .sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct))
    .slice(0, 5);

  const netWorth = portfolio?.netWorth || user?.balance || 0;
  const totalPnL = portfolio?.totalPnL || 0;
  const pnlPct = portfolio?.totalPnLPct || 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 animate-fade-in">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-white">
          Welcome back,{" "}
          <span className="neon-text">{user?.username}</span>
        </h1>
        <p className="text-slate-500 text-sm font-mono mt-0.5">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard
          label="Net Worth"
          value={`₹${netWorth.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
          icon={MdAccountBalanceWallet}
          color="blue"
        />
        <StatCard
          label="Cash Balance"
          value={`₹${(portfolio?.balance || user?.balance || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
          sub="Available to trade"
          icon={MdAccountBalanceWallet}
          color="green"
        />
        <StatCard
          label="Total P&L"
          value={`${totalPnL >= 0 ? "+" : ""}₹${Math.abs(totalPnL).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`}
          sub={`${pnlPct >= 0 ? "+" : ""}${pnlPct}% all time`}
          color={totalPnL >= 0 ? "green" : "red"}
          icon={totalPnL >= 0 ? MdTrendingUp : MdTrendingDown}
        />
        <StatCard
          label="Holdings"
          value={portfolio?.portfolio?.length || 0}
          sub="Active positions"
          icon={MdShowChart}
          color="blue"
        />
      </div>

      <div className="grid md:grid-cols-3 gap-4">
       {/* Net Worth Chart */}
<div className="md:col-span-2 glass rounded-xl p-4">
  <div className="flex items-center justify-between mb-4">
    <h2 className="font-display font-semibold text-white text-sm">
      Net Worth Over Time
    </h2>
    <span className="text-xs text-slate-500 font-mono">LIVE</span>
  </div>

  {netWorthHistory.length > 1 ? (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={netWorthHistory}>
        <defs>
          <linearGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#00ff88" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#00ff88" stopOpacity={0} />
          </linearGradient>
        </defs>

        <XAxis
          dataKey="time"
          tick={{
            fill: "#475569",
            fontSize: 10,
            fontFamily: "JetBrains Mono",
          }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />

        <YAxis
          tick={{
            fill: "#475569",
            fontSize: 10,
            fontFamily: "JetBrains Mono",
          }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) =>
            `₹${Number(v).toLocaleString("en-IN")}`
          }
          width={80}
        />

        <Tooltip
          contentStyle={{
            background: "#0f172a",
            border: "1px solid rgba(0,255,136,0.2)",
            borderRadius: "8px",
            fontFamily: "JetBrains Mono",
            fontSize: "12px",
          }}
          formatter={(v) => [
            `₹${Number(v).toLocaleString("en-IN")}`,
            "Net Worth",
          ]}
          labelStyle={{ color: "#94a3b8" }}
        />

        <Area
          type="monotone"
          dataKey="value"
          stroke="#00ff88"
          strokeWidth={2}
          fill="url(#nwGrad)"
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  ) : (
    <div className="h-44 flex items-center justify-center text-slate-600 text-sm font-mono">
      Collecting data...
    </div>
  )}
</div>

        {/* Top Movers */}
        <div className="glass rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-white text-sm">
              Top Movers
            </h2>
            <Link
              to="/market"
              className="text-xs text-neon-green hover:underline font-mono flex items-center gap-1"
            >
              All <MdArrowForward />
            </Link>
          </div>
          <div className="space-y-2">
            {topMovers.map((stock) => (
              <div
                key={stock.symbol}
                className="flex items-center justify-between py-1.5"
              >
                <div className="flex items-center gap-2">
                  <MiniChart
                    data={stock.history}
                    color={stock.changePct >= 0 ? "#00ff88" : "#ff3366"}
                    width={50}
                    height={24}
                  />
                  <div>
                    <p className="text-xs font-mono font-semibold text-white">
                      {stock.symbol}
                    </p>
                    <p className="text-xs text-slate-500">₹{stock.price?.toLocaleString("en-IN")}</p>
                  </div>
                </div>
                <span
                  className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded ${
                    stock.changePct >= 0
                      ? "text-neon-green bg-neon-green/10"
                      : "text-neon-red bg-neon-red/10"
                  }`}
                >
                  {stock.changePct >= 0 ? "+" : ""}
                  {stock.changePct?.toFixed(2)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
        {[
          { to: "/market", label: "Browse Market", color: "green" },
          { to: "/portfolio", label: "View Portfolio", color: "blue" },
          { to: "/transactions", label: "Trade History", color: "slate" },
          { to: "/leaderboard", label: "Leaderboard", color: "gold" },
        ].map(({ to, label, color }) => (
          <Link
            key={to}
            to={to}
            className="glass glass-hover rounded-xl p-3 text-center text-sm font-display font-medium text-slate-300 hover:text-white transition-all flex items-center justify-center gap-2"
          >
            {label} <MdArrowForward className="text-sm" />
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
