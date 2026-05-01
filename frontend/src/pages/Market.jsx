import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useStock } from "../context/StockContext";
import { stockAPI } from "../services/api";
import MiniChart from "../components/MiniChart";
import TradeModal from "../components/TradeModal";
import { toast } from "react-toastify";
import {
  MdSearch,
  MdTrendingUp,
  MdTrendingDown,
  MdClose,
  MdStar,
  MdStarBorder,
  MdNotificationsActive,
  MdDeleteOutline,
} from "react-icons/md";

const Market = () => {
  const navigate = useNavigate();
  const { prices, getPriceDirection } = useStock();
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [sector, setSector] = useState("All");
  const [selectedStock, setSelectedStock] = useState(null);
  const [tradeMode, setTradeMode] = useState("BUY");
  const [flashMap, setFlashMap] = useState({});
  const [watchlist, setWatchlist] = useState(() => {
    const saved = localStorage.getItem("watchlistSymbols");
    return saved ? JSON.parse(saved) : [];
  });
  const [showWatchlistOnly, setShowWatchlistOnly] = useState(false);
  const [alerts, setAlerts] = useState(() => {
    const saved = localStorage.getItem("priceAlerts");
    return saved ? JSON.parse(saved) : [];
  });
  const [alertForm, setAlertForm] = useState({ symbol: "", target: "", direction: "above" });
  const prevPricesRef = useRef({});
  const searchTimeoutRef = useRef(null);

  const stocks = Object.values(prices);

  // Global search logic
  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (search.length < 2) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const { data } = await stockAPI.search(search);
        if (data.success) {
          setSearchResults(data.results);
        }
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setSearching(false);
      }
    }, 500);

    return () => clearTimeout(searchTimeoutRef.current);
  }, [search]);

  // Flash animation on price change
  useEffect(() => {
    const newFlash = {};
    stocks.forEach((s) => {
      const prev = prevPricesRef.current[s.symbol];
      const nextPrice = s.price;
      if (prev && prev !== s.price) {
        newFlash[s.symbol] = s.price > prev ? "up" : "down";
      }

      alerts.forEach((alert) => {
        if (!alert.active || alert.symbol !== s.symbol || alert.triggered) return;
        const target = Number(alert.target);
        const crossedAbove = alert.direction === "above" && prev < target && nextPrice >= target;
        const crossedBelow = alert.direction === "below" && prev > target && nextPrice <= target;
        if (prev && (crossedAbove || crossedBelow)) {
          toast.info(
            `Alert: ${s.symbol} is ${alert.direction === "above" ? "above" : "below"} ₹${target.toFixed(2)} (now ₹${nextPrice.toFixed(2)})`,
            { theme: "dark" }
          );
          setAlerts((current) => {
            const nextAlerts = current.map((item) =>
              item.id === alert.id ? { ...item, triggered: true, active: false } : item
            );
            localStorage.setItem("priceAlerts", JSON.stringify(nextAlerts));
            return nextAlerts;
          });
        }
      });
    });
    if (Object.keys(newFlash).length > 0) {
      setFlashMap(newFlash);
      const timer = setTimeout(() => setFlashMap({}), 600);
      stocks.forEach((s) => {
        prevPricesRef.current[s.symbol] = s.price;
      });
      return () => clearTimeout(timer);
    }
    stocks.forEach((s) => {
      prevPricesRef.current[s.symbol] = s.price;
    });
  }, [prices]);

  const sectors = ["All", ...new Set(stocks.map((s) => s.sector))];

  const filtered = stocks.filter((s) => {
    const matchSearch =
      s.symbol.toLowerCase().includes(search.toLowerCase()) ||
      s.name.toLowerCase().includes(search.toLowerCase());
    const matchSector = sector === "All" || s.sector === sector;
    const matchWatchlist = !showWatchlistOnly || watchlist.includes(s.symbol);
    return matchSearch && matchSector && matchWatchlist;
  });

  const openTrade = (stock, mode) => {
    setSelectedStock(stock);
    setTradeMode(mode);
  };

  const toggleWatchlist = (symbol) => {
    setWatchlist((prev) => {
      const next = prev.includes(symbol)
        ? prev.filter((s) => s !== symbol)
        : [...prev, symbol];
      localStorage.setItem("watchlistSymbols", JSON.stringify(next));
      return next;
    });
  };

  const addAlert = () => {
    const target = Number(alertForm.target);
    if (!alertForm.symbol || !Number.isFinite(target) || target <= 0) {
      toast.error("Choose symbol and valid target price", { theme: "dark" });
      return;
    }
    const newAlert = {
      id: Date.now().toString(),
      symbol: alertForm.symbol,
      target,
      direction: alertForm.direction,
      active: true,
      triggered: false,
    };
    const nextAlerts = [newAlert, ...alerts];
    setAlerts(nextAlerts);
    localStorage.setItem("priceAlerts", JSON.stringify(nextAlerts));
    setAlertForm({ symbol: "", target: "", direction: "above" });
    toast.success("Price alert created", { theme: "dark" });
  };

  const removeAlert = (id) => {
    const nextAlerts = alerts.filter((a) => a.id !== id);
    setAlerts(nextAlerts);
    localStorage.setItem("priceAlerts", JSON.stringify(nextAlerts));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 animate-fade-in pb-32">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">
            Live <span className="neon-text">Market</span>
          </h1>
          <p className="text-slate-500 text-sm font-mono mt-0.5">
            {stocks.length} tracked stocks · Real-time feed active
          </p>
        </div>
      </div>

      <div className="glass rounded-2xl p-4 mb-6 border border-slate-800/50">
        <div className="flex items-center gap-2 mb-3">
          <MdNotificationsActive className="text-neon-blue text-lg" />
          <h3 className="text-sm font-semibold text-white">Price Alerts</h3>
        </div>
        <div className="grid md:grid-cols-4 gap-2 mb-3">
          <select
            value={alertForm.symbol}
            onChange={(e) => setAlertForm((p) => ({ ...p, symbol: e.target.value.toUpperCase() }))}
            className="bg-dark-700 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
          >
            <option value="">Select symbol</option>
            {stocks.slice(0, 40).map((s) => (
              <option key={s.symbol} value={s.symbol}>
                {s.symbol}
              </option>
            ))}
          </select>
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="Target price"
            value={alertForm.target}
            onChange={(e) => setAlertForm((p) => ({ ...p, target: e.target.value }))}
            className="bg-dark-700 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
          />
          <select
            value={alertForm.direction}
            onChange={(e) => setAlertForm((p) => ({ ...p, direction: e.target.value }))}
            className="bg-dark-700 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
          >
            <option value="above">Crosses Above</option>
            <option value="below">Crosses Below</option>
          </select>
          <button
            onClick={addAlert}
            className="bg-neon-blue/15 text-neon-blue border border-neon-blue/30 rounded-lg px-3 py-2 text-sm font-semibold hover:bg-neon-blue/25 transition-all"
          >
            Add Alert
          </button>
        </div>
        <div className="space-y-2">
          {alerts.length === 0 ? (
            <p className="text-xs text-slate-500 font-mono">No active alerts yet.</p>
          ) : (
            alerts.slice(0, 6).map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between bg-dark-800/70 rounded-lg px-3 py-2 text-xs"
              >
                <p className="text-slate-300 font-mono">
                  {a.symbol} {a.direction === "above" ? ">" : "<"} ₹{Number(a.target).toFixed(2)}{" "}
                  <span className={a.active ? "text-neon-green" : "text-slate-500"}>
                    ({a.active ? "active" : "triggered"})
                  </span>
                </p>
                <button
                  onClick={() => removeAlert(a.id)}
                  className="text-slate-500 hover:text-neon-red"
                  title="Remove alert"
                >
                  <MdDeleteOutline className="text-base" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Filters & Global Search */}
      <div className="flex flex-col gap-4 mb-8">
        <div className="relative z-50">
          <div className="relative group">
            <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-xl group-focus-within:text-neon-green transition-colors" />
            <input
              type="text"
              placeholder="Search ANY stock (e.g. Reliance, TCS, Apple, Zomato)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-dark-700/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl pl-12 pr-12 py-4 text-white text-base font-mono placeholder-slate-600 focus:outline-none focus:border-neon-green/50 focus:ring-4 focus:ring-neon-green/5 transition-all shadow-2xl"
            />
            {search && (
              <button 
                onClick={() => setSearch("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <MdClose className="text-xl" />
              </button>
            )}
          </div>

          {/* Global Search Results Dropdown */}
          {(searching || searchResults.length > 0) && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-dark-800 border border-slate-700 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden animate-slide-down max-h-[400px] overflow-y-auto z-50">
              {searching ? (
                <div className="p-8 text-center">
                  <div className="w-6 h-6 border-2 border-neon-green border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-slate-500 text-sm font-mono">Searching Global Markets...</p>
                </div>
              ) : (
                <div className="p-2">
                  <p className="px-4 py-2 text-[10px] text-slate-500 font-mono uppercase tracking-widest border-b border-slate-800 mb-2">Global Results</p>
                  {searchResults.map((result) => (
                    <div
                      key={result.symbol}
                      onClick={() => navigate(`/stock/${result.symbol}`)}
                      className="flex items-center justify-between p-4 hover:bg-slate-700/50 rounded-xl cursor-pointer transition-all group"
                    >
                      <div>
                        <p className="font-bold text-white font-mono group-hover:text-neon-green transition-colors">{result.symbol}</p>
                        <p className="text-xs text-slate-400 truncate max-w-[250px]">{result.name}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] bg-slate-700 px-2 py-1 rounded font-mono text-slate-300">{result.exchange}</span>
                        <p className="text-[10px] text-neon-blue mt-1 font-mono">View Details →</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-1 overflow-x-auto no-scrollbar py-1">
          <button
            onClick={() => setShowWatchlistOnly((prev) => !prev)}
            className={`px-4 py-2 rounded-full text-xs font-mono font-bold whitespace-nowrap transition-all border ${
              showWatchlistOnly
                ? "bg-yellow-400/15 text-yellow-300 border-yellow-300/40"
                : "bg-dark-700/50 text-slate-400 border-slate-700/50 hover:text-white"
            }`}
          >
            {showWatchlistOnly ? "Watchlist Only" : "All Stocks"}
          </button>
          {sectors.map((s) => (
            <button
              key={s}
              onClick={() => setSector(s)}
              className={`px-4 py-2 rounded-full text-xs font-mono font-bold whitespace-nowrap transition-all ${
                sector === s
                  ? "bg-neon-green text-dark-900 shadow-[0_0_20px_rgba(0,255,136,0.2)]"
                  : "bg-dark-700/50 text-slate-400 hover:text-white border border-slate-700/50"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Main Market List */}
      <div className="glass rounded-3xl overflow-hidden border border-slate-800/50">
        <div className="px-6 py-4 border-b border-slate-800/50 bg-white/5">
          <h3 className="text-sm font-bold text-white font-display uppercase tracking-wider">Top Tracked Stocks</h3>
        </div>
        
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-2 px-6 py-3 border-b border-slate-800 text-[10px] text-slate-500 font-mono uppercase tracking-widest bg-dark-900/50">
          <div className="col-span-4">Company</div>
          <div className="col-span-2 text-right">Live Price</div>
          <div className="col-span-2 text-right">Day Change</div>
          <div className="col-span-2 text-center">Trend</div>
          <div className="col-span-2 text-right">Action</div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-slate-800/30">
          {filtered.length === 0 ? (
            <div className="py-20 text-center">
              <MdSearch className="text-4xl text-slate-700 mx-auto mb-4" />
              <p className="text-slate-500 font-mono text-sm">
                No tracked stocks match your filters.<br/>
                <span className="text-xs text-slate-600 mt-2 block">Try searching for any stock in the bar above!</span>
              </p>
            </div>
          ) : (
            filtered.map((stock) => {
              const flash = flashMap[stock.symbol];
              return (
                <div
                  key={stock.symbol}
                  className={`grid grid-cols-12 gap-2 px-6 py-4 items-center hover:bg-white/[0.02] transition-all cursor-pointer group ${
                    flash === "up" ? "bg-green-500/5" : flash === "down" ? "bg-red-500/5" : ""
                  }`}
                  onClick={() => navigate(`/stock/${stock.symbol}`)}
                >
                  <div className="col-span-4">
                    <div className="flex items-center gap-1.5">
                      <p className="font-mono font-bold text-white text-sm group-hover:text-neon-green transition-colors">
                        {stock.symbol}
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleWatchlist(stock.symbol);
                        }}
                        className="text-yellow-300/90 hover:text-yellow-200"
                        title={watchlist.includes(stock.symbol) ? "Remove from watchlist" : "Add to watchlist"}
                      >
                        {watchlist.includes(stock.symbol) ? (
                          <MdStar className="text-sm" />
                        ) : (
                          <MdStarBorder className="text-sm" />
                        )}
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-500 truncate max-w-[150px]">{stock.name}</p>
                  </div>

                  <div className="col-span-2 text-right">
                    <p className={`font-mono font-bold text-sm ${
                      stock.changePct >= 0 ? "text-neon-green" : "text-neon-red"
                    }`}>
                      ₹{stock.price?.toFixed(2)}
                    </p>
                  </div>

                  <div className="col-span-2 text-right">
                    <div className={`inline-flex items-center gap-0.5 text-xs font-mono font-bold ${
                      stock.changePct >= 0 ? "text-neon-green" : "text-neon-red"
                    }`}>
                      {stock.changePct >= 0 ? "+" : ""}{stock.changePct?.toFixed(2)}%
                    </div>
                  </div>

                  <div className="col-span-2 flex justify-center">
                    <MiniChart
                      data={stock.history}
                      color={stock.changePct >= 0 ? "#00ff88" : "#ff3366"}
                      width={80}
                      height={28}
                    />
                  </div>

                  <div className="col-span-2 flex gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => openTrade(stock, "BUY")}
                      className="px-3 py-1.5 bg-neon-green text-dark-900 rounded-lg text-[10px] font-bold hover:scale-105 transition-all shadow-lg shadow-neon-green/10"
                    >
                      BUY
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {selectedStock && (
        <TradeModal
          stock={selectedStock}
          mode={tradeMode}
          onClose={() => setSelectedStock(null)}
          onSuccess={() => {}}
        />
      )}
    </div>
  );
};

export default Market;
