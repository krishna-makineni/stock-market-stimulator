import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useStock } from "../context/StockContext";
import { stockAPI } from "../services/api";
import TradeModal from "../components/TradeModal";
import {
  ResponsiveContainer,
  AreaChart,
  BarChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ComposedChart,
  Bar,
  CartesianGrid,
  Brush,
  Cell,
} from "recharts";
import {
  MdArrowBack,
  MdKeyboardArrowDown,
  MdKeyboardArrowUp,
  MdShowChart,
  MdBarChart,
} from "react-icons/md";

const formatMoney = (value) => {
  if (!Number.isFinite(value)) return "--";
  return `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
};

const formatQty = (value) => {
  if (!Number.isFinite(value)) return "--";
  return value.toLocaleString("en-IN");
};

const formatCompactDate = (value) => {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
};

const timeframes = ["1D", "1W", "1M", "3M", "1Y", "ALL"];

const Candlestick = ({ x, y, width, height, payload }) => {
  if (!payload) return null;
  const open = Number(payload.open ?? payload.price ?? 0);
  const close = Number(payload.close ?? payload.price ?? 0);
  const high = Number(payload.high ?? Math.max(open, close));
  const low = Number(payload.low ?? Math.min(open, close));
  const isUp = close >= open;
  const color = isUp ? "#14c38e" : "#ff6a3d";
  const bodyTopPrice = Math.max(open, close);
  const bodyBottomPrice = Math.min(open, close);
  const bodyRange = Math.max(0.01, bodyTopPrice - bodyBottomPrice);
  const topWickPrice = Math.max(0, high - bodyTopPrice);
  const bottomWickPrice = Math.max(0, bodyBottomPrice - low);
  const ratio = Math.max(1, height / bodyRange);
  const wickX = x + width / 2;
  const bodyTopY = y;
  const bodyBottomY = y + Math.max(height, 2);
  const wickTopY = bodyTopY - topWickPrice * ratio;
  const wickBottomY = bodyBottomY + bottomWickPrice * ratio;
  const bodyWidth = Math.max(2, width * 0.78);
  const bodyX = x + (width - bodyWidth) / 2;

  return (
    <g>
      <line
        x1={wickX}
        x2={wickX}
        y1={wickTopY}
        y2={wickBottomY}
        stroke={color}
        strokeWidth={1}
      />
      <rect x={bodyX} y={y} width={bodyWidth} height={Math.max(height, 2)} fill={color} rx={1} />
    </g>
  );
};

const StockDetails = () => {
  const { symbol } = useParams();
  const navigate = useNavigate();
  const { prices } = useStock();

  const [fetchedStock, setFetchedStock] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loadingChart, setLoadingChart] = useState(false);
  const [range, setRange] = useState("1D");
  const [chartType, setChartType] = useState("line");
  const [selectedStock, setSelectedStock] = useState(null);
  const [tradeMode, setTradeMode] = useState("BUY");
  const [portfolio, setPortfolio] = useState(null);
  const [openSection, setOpenSection] = useState("fundamentals");

  const stock = useMemo(() => prices[symbol] || fetchedStock, [prices, symbol, fetchedStock]);

  useEffect(() => {
    fetchQuote();
    fetchChartData();
    fetchPortfolio();
  }, [symbol, range]);

  const fetchQuote = async () => {
    if (prices[symbol]) return;
    try {
      const { data } = await stockAPI.quote(symbol);
      if (data.success) setFetchedStock(data.quote);
    } catch (err) {
      console.error("Failed to fetch quote:", err);
    }
  };

  const fetchChartData = async () => {
    setLoadingChart(true);
    try {
      const { data } = await stockAPI.chart(symbol, range);
      if (data.success) setChartData(data.quotes || []);
    } catch (err) {
      console.error("Failed to fetch chart:", err);
    } finally {
      setLoadingChart(false);
    }
  };

  const fetchPortfolio = async () => {
    try {
      const { data } = await stockAPI.portfolio();
      if (data.success) setPortfolio(data);
    } catch {
      // ignore
    }
  };

  const holding = useMemo(
    () => portfolio?.portfolio?.find((h) => h.symbol === symbol),
    [portfolio, symbol]
  );

  const livePrice = stock?.price || holding?.currentPrice || 0;
  const changePct = stock?.changePct || 0;
  const changeAmt = stock?.change || 0;

  const isMarketOpen = useMemo(() => {
    const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    const day = now.getDay();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const time = hours * 60 + minutes;
    return day >= 1 && day <= 5 && time >= 555 && time <= 930;
  }, []);

  const previousClose = livePrice - changeAmt;
  const openPrice = chartData[0]?.open ?? previousClose;
  const highPrice = chartData.length
    ? Math.max(...chartData.map((d) => d.high || d.price || 0))
    : livePrice;
  const lowPrice = chartData.length
    ? Math.min(...chartData.map((d) => d.low || d.price || livePrice))
    : livePrice;
  const volume = chartData.reduce((sum, item) => sum + (item.volume || 0), 0);
  const upperCircuit = previousClose * 1.2;
  const lowerCircuit = previousClose * 0.8;
  const investedValue = holding ? holding.avgBuyPrice * holding.quantity : 0;
  const totalReturn = holding ? holding.currentValue - investedValue : 0;
  const totalReturnPct =
    investedValue > 0 ? (totalReturn / investedValue) * 100 : 0;

  const recentlyViewed = (portfolio?.portfolio || [])
    .filter((item) => item.symbol !== symbol)
    .slice(0, 4);

  const openTrade = (mode) => {
    if (!isMarketOpen) return;
    setSelectedStock({
      symbol,
      name: stock?.name || holding?.name || symbol,
      price: livePrice,
    });
    setTradeMode(mode);
  };

  const sections = [
    {
      id: "fundamentals",
      title: "Fundamentals",
      rows: [
        { label: "Expense ratio", value: "--" },
        { label: "Tracking error", value: "--" },
        { label: "AUM", value: "--" },
        { label: "Avg vol (1M)", value: formatQty(volume) },
      ],
    },
    {
      id: "returns-calculator",
      title: "Returns calculator",
      rows: [
        { label: "Invested", value: formatMoney(investedValue) },
        { label: "Current value", value: formatMoney(holding?.currentValue || 0) },
        { label: "Total return", value: formatMoney(totalReturn) },
        { label: "Return %", value: `${totalReturnPct.toFixed(2)}%` },
      ],
    },
    {
      id: "category-returns",
      title: "Category returns",
      rows: [
        { label: "1D", value: `${changePct.toFixed(2)}%` },
        { label: "52W High", value: formatMoney(highPrice) },
        { label: "52W Low", value: formatMoney(lowPrice) },
        { label: "Status", value: isMarketOpen ? "Market Open" : "Market Closed" },
      ],
    },
    {
      id: "about",
      title: "About",
      rows: [{ label: "Sector", value: stock?.sector || "N/A" }],
    },
    { id: "similar-etfs", title: "Similar ETFs", rows: [] },
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;
    const point = payload[0]?.payload;
    if (!point) return null;
    return (
      <div className="bg-dark-900 border border-slate-700 p-2 rounded-lg text-xs">
        <p className="text-slate-400 mb-1">
          {new Date(label).toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
        {chartType === "candle" ? (
          <div className="space-y-0.5">
            <p>O: {formatMoney(point.open || 0)}</p>
            <p>H: {formatMoney(point.high || 0)}</p>
            <p>L: {formatMoney(point.low || 0)}</p>
            <p>C: {formatMoney(point.close || point.price || 0)}</p>
          </div>
        ) : (
          <p className="font-semibold">Price: {formatMoney(Number(payload[0].value || 0))}</p>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto min-h-screen bg-dark-950 text-white px-4 lg:px-8 pb-36">
      <div className="pt-4 border border-slate-800/80 rounded-2xl bg-dark-900/40 overflow-hidden">
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-full text-slate-300 hover:bg-slate-800"
          >
            <MdArrowBack className="text-2xl" />
          </button>
          <div>
            <h1 className="text-xl font-semibold">{symbol}</h1>
            <p className="text-sm font-mono text-slate-200">
              {formatMoney(livePrice)}{" "}
              <span className={changePct >= 0 ? "text-neon-green" : "text-neon-red"}>
                {changePct >= 0 ? "+" : ""}
                {changeAmt.toFixed(2)} ({Math.abs(changePct).toFixed(2)}%)
              </span>
            </p>
          </div>
        </div>

        <div className="py-3 border-t border-slate-800/70 px-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
            <div className="flex gap-1 flex-wrap">
              {timeframes.map((tf) => (
                <button
                  key={tf}
                  onClick={() => setRange(tf)}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    range === tf ? "bg-neon-green text-dark-900" : "bg-slate-800 text-slate-300"
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
            <div className="flex gap-1 bg-slate-900 border border-slate-800 rounded-lg p-1">
              <button
                onClick={() => setChartType("line")}
                className={`p-1 rounded ${
                  chartType === "line" ? "bg-slate-700 text-neon-green" : "text-slate-400"
                }`}
                title="Line chart"
              >
                <MdShowChart className="text-lg" />
              </button>
              <button
                onClick={() => setChartType("candle")}
                className={`p-1 rounded ${
                  chartType === "candle" ? "bg-slate-700 text-neon-green" : "text-slate-400"
                }`}
                title="Candlestick chart"
              >
                <MdBarChart className="text-lg" />
              </button>
            </div>
          </div>

          <div className="h-56 lg:h-80 w-full">
            {loadingChart ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                Loading chart...
              </div>
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                {chartType === "line" ? (
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="stockLineFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#14c38e" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#14c38e" stopOpacity={0.03} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: "#94a3b8", fontSize: 10 }}
                      tickFormatter={formatCompactDate}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis hide domain={["dataMin", "dataMax"]} />
                    <Tooltip
                      content={<CustomTooltip />}
                      cursor={{ stroke: "#94a3b8", strokeDasharray: "4 4", strokeWidth: 1 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="price"
                      stroke={changePct >= 0 ? "#14c38e" : "#ff6a3d"}
                      fill="url(#stockLineFill)"
                      strokeWidth={2}
                      isAnimationActive={false}
                    />
                  </AreaChart>
                ) : (
                  <div className="h-full flex flex-col gap-1">
                    <div className="flex-1">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart
                          data={chartData}
                          syncId="candleView"
                          margin={{ top: 10, right: 8, left: 0, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                          <XAxis dataKey="date" hide />
                          <YAxis yAxisId="price" hide domain={["dataMin", "dataMax"]} />
                          <Tooltip
                            content={<CustomTooltip />}
                            cursor={{ stroke: "#94a3b8", strokeDasharray: "4 4", strokeWidth: 1 }}
                          />
                          <Bar
                            yAxisId="price"
                            dataKey={(d) => [d.open, d.close]}
                            shape={<Candlestick />}
                            barSize={Math.max(3, 190 / Math.max(1, chartData.length))}
                            isAnimationActive={false}
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="h-14">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} syncId="candleView" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                          <XAxis
                            dataKey="date"
                            tick={{ fill: "#94a3b8", fontSize: 10 }}
                            tickFormatter={formatCompactDate}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis hide domain={[0, "dataMax"]} />
                          <Bar dataKey="volume" barSize={Math.max(1, 160 / Math.max(1, chartData.length))} opacity={0.34}>
                            {chartData.map((entry, index) => (
                              <Cell
                                key={`vol-${index}`}
                                fill={(entry.close ?? entry.price ?? 0) >= (entry.open ?? entry.price ?? 0) ? "#14c38e" : "#ff6a3d"}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                No chart data available
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-y-4 gap-x-4 px-4 pb-5 text-sm">
          <div>
            <p className="text-slate-500 text-xs">Open price</p>
            <p className="font-semibold">{formatMoney(openPrice)}</p>
          </div>
          <div>
            <p className="text-slate-500 text-xs">Previous close</p>
            <p className="font-semibold">{formatMoney(previousClose)}</p>
          </div>
          <div>
            <p className="text-slate-500 text-xs">Live volume</p>
            <p className="font-semibold">{formatQty(volume)}</p>
          </div>
          <div>
            <p className="text-slate-500 text-xs">Lower circuit</p>
            <p className="font-semibold">{formatMoney(lowerCircuit)}</p>
          </div>
          <div>
            <p className="text-slate-500 text-xs">Upper circuit</p>
            <p className="font-semibold">{formatMoney(upperCircuit)}</p>
          </div>
          <div>
            <p className="text-slate-500 text-xs">NAV</p>
            <p className="font-semibold">{formatMoney(livePrice)}</p>
          </div>
          <div>
            <p className="text-slate-500 text-xs">Day low</p>
            <p className="font-semibold">{formatMoney(lowPrice)}</p>
          </div>
          <div>
            <p className="text-slate-500 text-xs">Day high</p>
            <p className="font-semibold">{formatMoney(highPrice)}</p>
          </div>
          <div>
            <p className="text-slate-500 text-xs">Market</p>
            <p className={`font-semibold ${isMarketOpen ? "text-neon-green" : "text-neon-red"}`}>
              {isMarketOpen ? "Open" : "Closed"}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid lg:grid-cols-2 gap-6">
        <div className="border border-slate-800/80 rounded-2xl bg-dark-900/30 px-4">
          {sections.map((section) => {
            const isOpen = openSection === section.id;
            return (
              <div key={section.id} className="border-b border-slate-800/80 last:border-b-0">
                <button
                  className="w-full py-4 flex items-center justify-between text-left"
                  onClick={() => setOpenSection(isOpen ? "" : section.id)}
                >
                  <span className="text-xl font-semibold text-slate-100">{section.title}</span>
                  {isOpen ? (
                    <MdKeyboardArrowUp className="text-2xl text-slate-400" />
                  ) : (
                    <MdKeyboardArrowDown className="text-2xl text-slate-400" />
                  )}
                </button>
                {isOpen && section.rows.length > 0 && (
                  <div className="grid grid-cols-2 gap-4 pb-4">
                    {section.rows.map((row) => (
                      <div key={row.label}>
                        <p className="text-slate-500 text-sm">{row.label}</p>
                        <p className="text-lg font-semibold text-slate-100">{row.value}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="border border-slate-800/80 rounded-2xl bg-dark-900/30 p-4 h-fit">
          <p className="text-xl font-semibold text-slate-100 mb-3">Recently viewed</p>
          <div className="flex gap-4 flex-wrap">
            {recentlyViewed.length > 0 ? (
              recentlyViewed.map((item) => (
                <button
                  key={item.symbol}
                  onClick={() => navigate(`/stock/${item.symbol}`)}
                  className="w-12 h-12 rounded-full bg-slate-800 text-xs font-bold uppercase"
                  title={item.symbol}
                >
                  {item.symbol.slice(0, 2)}
                </button>
              ))
            ) : (
              <p className="text-slate-500 text-sm">No recently viewed stocks yet.</p>
            )}
          </div>
        </div>
      </div>

      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-3xl px-4 py-3 bg-dark-950/95 backdrop-blur border border-slate-800 rounded-2xl flex gap-2 z-40">
        <button className="w-20 py-3 rounded-xl border border-slate-700 text-slate-100 font-semibold">
          SIP
        </button>
        <button
          onClick={() => openTrade("SELL")}
          disabled={!holding || !isMarketOpen}
          className="flex-1 py-3 rounded-xl font-bold bg-[#ff6a3d] text-white disabled:opacity-40"
        >
          Sell
        </button>
        <button
          onClick={() => openTrade("BUY")}
          disabled={!isMarketOpen}
          className="flex-1 py-3 rounded-xl font-bold bg-[#14c38e] text-white disabled:opacity-40"
        >
          Buy
        </button>
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

export default StockDetails;
