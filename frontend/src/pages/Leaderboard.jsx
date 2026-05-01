import { useState, useEffect } from "react";
import { stockAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { MdEmojiEvents, MdTrendingUp, MdTrendingDown, MdRefresh } from "react-icons/md";

const MEDALS = ["🥇", "🥈", "🥉"];

const Leaderboard = () => {
  const { user } = useAuth();
  const [board, setBoard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const { data } = await stockAPI.leaderboard();
      if (data.success) setBoard(data.leaderboard);
    } catch {}
    setLoading(false);
  };

  const myRank = board.findIndex((p) => p.username === user?.username) + 1;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-white flex items-center gap-2">
            <MdEmojiEvents className="text-neon-gold" />
            Leader<span className="neon-text">board</span>
          </h1>
          <p className="text-slate-500 text-sm font-mono mt-0.5">
            Top traders by net worth · refreshes every 15s
          </p>
        </div>
        <button
          onClick={fetchLeaderboard}
          className="flex items-center gap-1.5 px-3 py-2 glass rounded-lg text-slate-400 hover:text-white text-sm font-mono transition-all"
        >
          <MdRefresh /> Refresh
        </button>
      </div>

      {/* My Rank Banner */}
      {myRank > 0 && (
        <div className="glass rounded-xl p-4 mb-6 border border-neon-green/20 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-mono">YOUR RANK</p>
            <p className="text-2xl font-bold font-mono neon-text">#{myRank}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500 font-mono">NET WORTH</p>
            <p className="text-lg font-bold font-mono text-white">
              ₹{board[myRank - 1]?.netWorth?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500 font-mono">TOTAL RETURN</p>
            <p
              className={`text-lg font-bold font-mono ${
                (board[myRank - 1]?.totalReturn || 0) >= 0
                  ? "text-neon-green"
                  : "text-neon-red"
              }`}
            >
              {(board[myRank - 1]?.returnPct || 0) >= 0 ? "+" : ""}
              {board[myRank - 1]?.returnPct?.toFixed(2)}%
            </p>
          </div>
        </div>
      )}

      {/* Top 3 Podium */}
      {board.length >= 3 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[board[1], board[0], board[2]].map((trader, i) => {
            const rank = i === 1 ? 1 : i === 0 ? 2 : 3;
            const heights = ["h-24", "h-32", "h-20"];
            return (
              <div
                key={trader.username}
                className={`glass rounded-xl flex flex-col items-center justify-end p-4 ${
                  rank === 1 ? "border border-neon-gold/30" : ""
                } ${heights[i]}`}
              >
                <span className="text-2xl mb-1">{MEDALS[rank - 1]}</span>
                <p
                  className={`font-mono font-bold text-sm ${
                    trader.username === user?.username
                      ? "neon-text"
                      : "text-white"
                  }`}
                >
                  {trader.username}
                </p>
                <p className="text-xs text-slate-400 font-mono">
                  ${(trader.netWorth / 1000).toFixed(1)}k
                </p>
                <p
                  className={`text-xs font-mono font-bold ${
                    trader.returnPct >= 0 ? "text-neon-green" : "text-neon-red"
                  }`}
                >
                  {trader.returnPct >= 0 ? "+" : ""}
                  {trader.returnPct?.toFixed(2)}%
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Full Table */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="grid grid-cols-12 px-4 py-2.5 text-xs text-slate-500 font-mono uppercase border-b border-slate-800">
          <div className="col-span-1">Rank</div>
          <div className="col-span-4">Trader</div>
          <div className="col-span-3 text-right">Net Worth</div>
          <div className="col-span-2 text-right">Return</div>
          <div className="col-span-2 text-right">P&L ₹</div>
        </div>

        {loading ? (
          <div className="py-12 text-center">
            <div className="w-8 h-8 border-2 border-neon-green border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          </div>
        ) : board.length === 0 ? (
          <div className="py-12 text-center text-slate-600 font-mono text-sm">
            No traders yet
          </div>
        ) : (
          <div className="divide-y divide-slate-800/50">
            {board.map((trader, i) => {
              const isMe = trader.username === user?.username;
              return (
                <div
                  key={trader.username}
                  className={`grid grid-cols-12 px-4 py-3 items-center transition-all ${
                    isMe
                      ? "bg-neon-green/5 border-l-2 border-neon-green"
                      : "hover:bg-slate-800/20"
                  }`}
                >
                  <div className="col-span-1">
                    {i < 3 ? (
                      <span className="text-lg">{MEDALS[i]}</span>
                    ) : (
                      <span className="text-slate-500 font-mono text-sm">
                        #{i + 1}
                      </span>
                    )}
                  </div>
                  <div className="col-span-4 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-neon-green to-neon-blue flex items-center justify-center text-dark-900 font-bold text-xs">
                      {trader.username[0].toUpperCase()}
                    </div>
                    <span
                      className={`font-mono font-semibold text-sm ${
                        isMe ? "neon-text" : "text-white"
                      }`}
                    >
                      {trader.username}
                      {isMe && (
                        <span className="ml-1 text-xs text-neon-green/60">
                          (you)
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="col-span-3 text-right font-mono text-sm text-white font-semibold">
                    ₹{trader.netWorth?.toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </div>
                  <div className="col-span-2 text-right">
                    <span
                      className={`inline-flex items-center gap-0.5 font-mono text-sm font-bold ${
                        trader.returnPct >= 0
                          ? "text-neon-green"
                          : "text-neon-red"
                      }`}
                    >
                      {trader.returnPct >= 0 ? (
                        <MdTrendingUp className="text-base" />
                      ) : (
                        <MdTrendingDown className="text-base" />
                      )}
                      {trader.returnPct >= 0 ? "+" : ""}
                      {trader.returnPct?.toFixed(2)}%
                    </span>
                  </div>
                  <div className="col-span-2 text-right">
                    <span
                      className={`font-mono text-sm ${
                        trader.totalReturn >= 0
                          ? "text-neon-green"
                          : "text-neon-red"
                      }`}
                    >
                      {trader.totalReturn >= 0 ? "+" : ""}₹
                      {Math.abs(trader.totalReturn)?.toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
