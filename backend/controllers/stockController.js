const User = require("../models/User");
const Transaction = require("../models/Transaction");
const { getCurrentPrices, getStockList } = require("../config/stockEngine");
const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance();

// @GET /api/stocks/search
const searchStocks = async (req, res) => {
  const { q } = req.query;
  if (!q) return res.json({ success: true, results: [] });

  try {
    const results = await yahooFinance.search(q);
    // Filter for stocks and map to a clean format
    const filtered = results.quotes
      .filter(quote => quote.quoteType === "EQUITY")
      .map(quote => ({
        symbol: quote.symbol,
        name: quote.shortname || quote.longname || quote.symbol,
        exchange: quote.exchange,
      }));
    res.json({ success: true, results: filtered });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ success: false, message: "Search failed" });
  }
};

// @GET /api/stocks/:symbol/quote
const getStockQuote = async (req, res) => {
  const { symbol } = req.params;
  try {
    const quote = await yahooFinance.quote(symbol);
    res.json({
      success: true,
      quote: {
        symbol: quote.symbol,
        name: quote.shortName || quote.longName || quote.symbol,
        price: quote.regularMarketPrice,
        change: quote.regularMarketChange,
        changePct: quote.regularMarketChangePercent,
        sector: quote.sector || "N/A",
      },
    });
  } catch (error) {
    console.error("Quote error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch quote" });
  }
};

// @GET /api/stocks
const getStocks = async (req, res) => {
  try {
    const stocks = getStockList();
    res.json({ success: true, stocks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const isMarketOpen = () => {
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  const day = now.getDay(); 
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const time = hours * 60 + minutes;

  // Monday to Friday (1-5)
  if (day === 0 || day === 6) return false;

  // 9:15 AM (555 mins) to 3:30 PM (930 mins)
  if (time < 555 || time > 930) return false;

  return true;
};

// @POST /api/stocks/buy
const buyStock = async (req, res) => {
  const { symbol, quantity } = req.body;

  if (!isMarketOpen()) {
    return res.status(400).json({ 
      success: false, 
      message: "Market is closed. Trading hours: Mon-Fri, 9:15 AM - 3:30 PM IST." 
    });
  }

  if (!symbol || !quantity || quantity < 1) {
    return res
      .status(400)
      .json({ success: false, message: "Symbol and quantity (min 1) required" });
  }

  try {
    const prices = getCurrentPrices();
    const price = prices[symbol];
    if (!price) {
      return res
        .status(404)
        .json({ success: false, message: "Stock not found" });
    }

    const user = await User.findById(req.user._id);
    const total = parseFloat((price * quantity).toFixed(2));

    if (user.balance < total) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. Need ₹${total.toLocaleString()}, have ₹${user.balance.toLocaleString()}`,
      });
    }

    // Deduct balance
    user.balance = parseFloat((user.balance - total).toFixed(2));

    // Update portfolio
    const stockList = getStockList();
    const stockInfo = stockList.find((s) => s.symbol === symbol);
    const existing = user.portfolio.find((h) => h.symbol === symbol);

    if (existing) {
      const newTotal = existing.totalInvested + total;
      const newQty = existing.quantity + quantity;
      existing.avgBuyPrice = parseFloat((newTotal / newQty).toFixed(2));
      existing.quantity = newQty;
      existing.totalInvested = parseFloat(newTotal.toFixed(2));
    } else {
      user.portfolio.push({
        symbol,
        name: stockInfo?.name || symbol,
        quantity,
        avgBuyPrice: price,
        totalInvested: total,
      });
    }

    await user.save();

    // Record transaction
    await Transaction.create({
      user: user._id,
      type: "BUY",
      symbol,
      name: stockInfo?.name || symbol,
      quantity,
      price,
      total,
    });

    res.json({
      success: true,
      message: `Bought ${quantity} shares of ${symbol} at ₹${price}`,
      balance: user.balance,
      portfolio: user.portfolio,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @POST /api/stocks/sell
const sellStock = async (req, res) => {
  const { symbol, quantity } = req.body;

  if (!isMarketOpen()) {
    return res.status(400).json({ 
      success: false, 
      message: "Market is closed. Trading hours: Mon-Fri, 9:15 AM - 3:30 PM IST." 
    });
  }

  if (!symbol || !quantity || quantity < 1) {
    return res
      .status(400)
      .json({ success: false, message: "Symbol and quantity required" });
  }

  try {
    const prices = getCurrentPrices();
    const price = prices[symbol];
    if (!price) {
      return res
        .status(404)
        .json({ success: false, message: "Stock not found" });
    }

    const user = await User.findById(req.user._id);
    const holding = user.portfolio.find((h) => h.symbol === symbol);

    if (!holding || holding.quantity < quantity) {
      return res.status(400).json({
        success: false,
        message: `Insufficient shares. You own ${holding?.quantity || 0} shares.`,
      });
    }

    const total = parseFloat((price * quantity).toFixed(2));
    const costBasis = parseFloat((holding.avgBuyPrice * quantity).toFixed(2));
    const profitLoss = parseFloat((total - costBasis).toFixed(2));

    // Update balance
    user.balance = parseFloat((user.balance + total).toFixed(2));

    // Update portfolio
    holding.quantity -= quantity;
    holding.totalInvested = parseFloat(
      (holding.totalInvested - costBasis).toFixed(2)
    );
    if (holding.quantity === 0) {
      user.portfolio = user.portfolio.filter((h) => h.symbol !== symbol);
    }

    await user.save();

    // Record transaction
    await Transaction.create({
      user: user._id,
      type: "SELL",
      symbol,
      name: holding.name,
      quantity,
      price,
      total,
      profitLoss,
    });

    res.json({
      success: true,
      message: `Sold ${quantity} shares of ${symbol} at ₹${price}. P&L: ₹${profitLoss}`,
      balance: user.balance,
      portfolio: user.portfolio,
      profitLoss,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @GET /api/stocks/portfolio
const getPortfolio = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    const prices = getCurrentPrices();

    const portfolioWithPnL = user.portfolio.map((holding) => {
      const currentPrice = prices[holding.symbol] || holding.avgBuyPrice;
      const currentValue = parseFloat(
        (currentPrice * holding.quantity).toFixed(2)
      );
      const profitLoss = parseFloat(
        (currentValue - holding.totalInvested).toFixed(2)
      );
      const profitLossPct = parseFloat(
        ((profitLoss / holding.totalInvested) * 100).toFixed(2)
      );
      return {
        ...holding.toObject(),
        currentPrice,
        currentValue,
        profitLoss,
        profitLossPct,
      };
    });

    const totalPortfolioValue = portfolioWithPnL.reduce(
      (sum, h) => sum + h.currentValue,
      0
    );
    const totalInvested = portfolioWithPnL.reduce(
      (sum, h) => sum + h.totalInvested,
      0
    );
    const netWorth = parseFloat(
      (user.balance + totalPortfolioValue).toFixed(2)
    );
    const totalPnL = parseFloat(
      (netWorth - user.totalDeposited).toFixed(2)
    );

    res.json({
      success: true,
      balance: user.balance,
      portfolio: portfolioWithPnL,
      totalPortfolioValue: parseFloat(totalPortfolioValue.toFixed(2)),
      totalInvested: parseFloat(totalInvested.toFixed(2)),
      netWorth,
      totalPnL,
      totalPnLPct: parseFloat(
        ((totalPnL / user.totalDeposited) * 100).toFixed(2)
      ),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @GET /api/stocks/transactions
const getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ success: true, transactions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @GET /api/stocks/leaderboard
const getLeaderboard = async (req, res) => {
  try {
    const users = await User.find({ role: "user" }).select(
      "username balance portfolio totalDeposited"
    );
    const prices = getCurrentPrices();

    const leaderboard = users
      .map((user) => {
        const portfolioValue = user.portfolio.reduce((sum, h) => {
          return sum + (prices[h.symbol] || h.avgBuyPrice) * h.quantity;
        }, 0);
        const netWorth = parseFloat(
          (user.balance + portfolioValue).toFixed(2)
        );
        const totalReturn = parseFloat(
          (netWorth - user.totalDeposited).toFixed(2)
        );
        const returnPct = parseFloat(
          ((totalReturn / user.totalDeposited) * 100).toFixed(2)
        );
        return {
          username: user.username,
          netWorth,
          totalReturn,
          returnPct,
        };
      })
      .sort((a, b) => b.netWorth - a.netWorth)
      .slice(0, 20);

    res.json({ success: true, leaderboard });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @GET /api/stocks/:symbol/chart
const getStockChart = async (req, res) => {
  const { symbol } = req.params;
  const { range = "1M" } = req.query; // 1D, 1W, 1M, 3M, 1Y, ALL
  
  // Use timestamps (seconds) for Yahoo Finance API
  const now = Math.floor(Date.now() / 1000);
  let period1 = now - (30 * 24 * 60 * 60); // Default 1 month
  let interval = "1d";
  
  try {
    switch (range.toUpperCase()) {
      case "1D": {
        // Calculate 9:15 AM IST today or most recent weekday
        let d = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
        // If it's weekend, go back to Friday
        if (d.getDay() === 0) d.setDate(d.getDate() - 2); // Sunday -> Friday
        else if (d.getDay() === 6) d.setDate(d.getDate() - 1); // Saturday -> Friday
        
        d.setHours(9, 15, 0, 0);
        period1 = Math.floor(d.getTime() / 1000);
        
        // If it's currently before 9:15 AM on a weekday, go back another day
        if (now < period1) {
          d.setDate(d.getDate() - 1);
          if (d.getDay() === 0) d.setDate(d.getDate() - 2);
          period1 = Math.floor(d.getTime() / 1000);
        }
        interval = "5m";
        break;
      }
      case "1W":
        period1 = now - (8 * 24 * 60 * 60);
        interval = "15m";
        break;
      case "1M":
        period1 = now - (31 * 24 * 60 * 60);
        interval = "1d";
        break;
      case "3M":
        period1 = now - (92 * 24 * 60 * 60);
        interval = "1d";
        break;
      case "1Y":
        period1 = now - (366 * 24 * 60 * 60);
        interval = "1wk";
        break;
      case "ALL":
        period1 = now - (5 * 366 * 24 * 60 * 60);
        interval = "1mo";
        break;
    }

    console.log(`[Chart Request] Symbol: ${symbol}, Range: ${range}, Interval: ${interval}, Start: ${new Date(period1 * 1000).toISOString()}`);

    let chartData;
    try {
      chartData = await yahooFinance.chart(symbol, { period1, interval });
    } catch (e) {
      console.warn(`[Chart API Error] ${symbol}: ${e.message}. Trying historical fallback...`);
    }
    
    let quotes = [];
    if (chartData && chartData.quotes && chartData.quotes.length > 0) {
      quotes = chartData.quotes
        .map(q => ({
          date: q.date instanceof Date ? q.date.toISOString() : new Date(q.date).toISOString(),
          price: q.close ? parseFloat(q.close.toFixed(2)) : (q.adjclose ? parseFloat(q.adjclose.toFixed(2)) : null),
          open: q.open ? parseFloat(q.open.toFixed(2)) : null,
          high: q.high ? parseFloat(q.high.toFixed(2)) : null,
          low: q.low ? parseFloat(q.low.toFixed(2)) : null,
          close: q.close ? parseFloat(q.close.toFixed(2)) : null
        }))
        .filter(q => q.price !== null && q.price > 0);
    }

    // Fallback for daily data if chart fails or is empty
    if (quotes.length === 0 && (interval === "1d" || interval === "1wk" || interval === "1mo")) {
      console.log(`[Chart] Falling back to historical for ${symbol}`);
      const histData = await yahooFinance.historical(symbol, { period1: new Date(period1 * 1000), interval: interval === "1wk" ? "1wk" : (interval === "1mo" ? "1mo" : "1d") });
      quotes = histData
        .map(q => ({
          date: q.date instanceof Date ? q.date.toISOString() : new Date(q.date).toISOString(),
          price: q.close ? parseFloat(q.close.toFixed(2)) : (q.adjclose ? parseFloat(q.adjclose.toFixed(2)) : null),
          open: q.open ? parseFloat(q.open.toFixed(2)) : null,
          high: q.high ? parseFloat(q.high.toFixed(2)) : null,
          low: q.low ? parseFloat(q.low.toFixed(2)) : null,
          close: q.close ? parseFloat(q.close.toFixed(2)) : null
        }))
        .filter(q => q.price !== null && q.price > 0);
    }

    console.log(`[Chart] Success: Returned ${quotes.length} quotes for ${symbol}`);
    res.json({ success: true, quotes });
  } catch (error) {
    console.error(`[Chart Error] ${symbol}:`, error.message);
    res.status(500).json({ success: false, message: "Failed to fetch chart data" });
  }
};

module.exports = {
  getStocks,
  buyStock,
  sellStock,
  getPortfolio,
  getTransactions,
  getLeaderboard,
  getStockChart,
  searchStocks,
  getStockQuote,
};
