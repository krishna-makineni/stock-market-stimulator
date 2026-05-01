import { useState } from "react";
import { toast } from "react-toastify";
import { stockAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { MdClose, MdTrendingUp, MdTrendingDown } from "react-icons/md";
import MiniChart from "./MiniChart";

const TradeModal = ({ stock, mode = "BUY", onClose, onSuccess }) => {
  const { user, updateBalance } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);

  const price = stock?.price || 0;
  const total = (price * quantity).toFixed(2);
  const canAfford = mode === "BUY" ? user?.balance >= total : true;
  const maxBuy = Math.floor(user?.balance / price) || 0;

  const handleTrade = async () => {
    if (quantity < 1) return toast.error("Quantity must be at least 1");
    setLoading(true);
    try {
      const fn = mode === "BUY" ? stockAPI.buy : stockAPI.sell;
      const { data } = await fn(stock.symbol, Number(quantity));
      if (data.success) {
        toast.success(data.message, { theme: "dark" });
        updateBalance(data.balance);
        onSuccess?.();
        onClose();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Trade failed", { theme: "dark" });
    } finally {
      setLoading(false);
    }
  };

  const isBuy = mode === "BUY";
  const accentColor = isBuy ? "neon-green" : "neon-red";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Modal */}
      <div className="relative glass neon-border rounded-xl p-6 w-full max-w-sm animate-slide-up">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="flex items-center gap-2">
              {isBuy ? (
                <MdTrendingUp className="text-neon-green text-xl" />
              ) : (
                <MdTrendingDown className="text-neon-red text-xl" />
              )}
              <h2
                className={`text-lg font-bold font-display ${
                  isBuy ? "neon-text" : "neon-text-red"
                }`}
              >
                {isBuy ? "Buy" : "Sell"} {stock?.symbol}
              </h2>
            </div>
            <p className="text-slate-400 text-sm mt-0.5">{stock?.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white p-1 rounded hover:bg-slate-800 transition-all"
          >
            <MdClose className="text-xl" />
          </button>
        </div>

        {/* Price Info */}
        <div className="bg-dark-700 rounded-lg p-3 mb-4 flex items-center justify-between">
          <span className="text-slate-400 text-sm font-mono">Market Price</span>
          <span className="text-white font-mono font-bold text-lg">
            ₹{price.toFixed(2)}
          </span>
        </div>

        {/* Graph */}
        <div className="bg-dark-800 rounded-lg p-4 mb-4 flex justify-center w-full overflow-hidden">
          <MiniChart
            data={stock?.history || []}
            color={(stock?.changePct || 0) >= 0 ? "#00ff88" : "#ff3366"}
            width={300}
            height={80}
          />
        </div>

        {/* Quantity Input */}
        <div className="mb-4">
          <label className="block text-xs text-slate-400 font-mono mb-1.5 uppercase tracking-wider">
            Quantity
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="w-10 h-10 rounded-lg bg-dark-700 text-white font-bold hover:bg-slate-700 transition-all text-lg"
            >
              −
            </button>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) =>
                setQuantity(Math.max(1, parseInt(e.target.value) || 1))
              }
              className="flex-1 h-10 bg-dark-700 border border-slate-700 rounded-lg text-center text-white font-mono font-bold focus:outline-none focus:border-neon-green transition-all"
            />
            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="w-10 h-10 rounded-lg bg-dark-700 text-white font-bold hover:bg-slate-700 transition-all text-lg"
            >
              +
            </button>
          </div>
          {isBuy && (
            <button
              onClick={() => setQuantity(maxBuy)}
              className="mt-1.5 text-xs text-neon-blue hover:underline font-mono"
            >
              Max: {maxBuy} shares
            </button>
          )}
        </div>

        {/* Total */}
        <div className="bg-dark-700 rounded-lg p-3 mb-5">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-slate-400 font-mono">Total Cost</span>
            <span className="text-white font-mono font-bold">
              ₹{Number(total).toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </div>
          {isBuy && (
            <div className="flex justify-between text-xs">
              <span className="text-slate-500 font-mono">Available Balance</span>
              <span
                className={`font-mono ${
                  canAfford ? "text-neon-green" : "text-neon-red"
                }`}
              >
                ₹{user?.balance?.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}
        </div>

        {/* CTA */}
        <button
          onClick={handleTrade}
          disabled={loading || (isBuy && !canAfford)}
          className={`w-full py-3 rounded-lg font-bold font-display text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
            isBuy
              ? "bg-neon-green text-dark-900 hover:bg-green-400 shadow-[0_0_20px_rgba(0,255,136,0.3)]"
              : "bg-neon-red text-white hover:bg-red-500 shadow-[0_0_20px_rgba(255,51,102,0.3)]"
          }`}
        >
          {loading
            ? "Processing..."
            : isBuy
            ? `Buy ${quantity} Share${quantity > 1 ? "s" : ""}`
            : `Sell ${quantity} Share${quantity > 1 ? "s" : ""}`}
        </button>

        {isBuy && !canAfford && (
          <p className="text-center text-neon-red text-xs font-mono mt-2">
            Insufficient balance
          </p>
        )}
      </div>
    </div>
  );
};

export default TradeModal;
