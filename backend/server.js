require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const { getLatestPrices } = require("./config/stockEngine");

const app = express();

// Connect DB
connectDB();

// Middleware
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/stocks", require("./routes/stockRoutes"));

// Root
app.get("/", (req, res) => {
  res.json({ message: "📈 StockSim API is running!" });
});

// ─────────────────────────────────────────────────────────
// REAL-TIME: Server-Sent Events (SSE) for live price feed
// ─────────────────────────────────────────────────────────
const clients = new Set();

app.get("/api/stocks/live", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
  res.flushHeaders();

  // Send initial prices immediately
  const initial = getLatestPrices();
  if (Object.keys(initial).length > 0) {
    res.write(`data: ${JSON.stringify(initial)}\n\n`);
  }

  clients.add(res);

  req.on("close", () => {
    clients.delete(res);
  });
});

// Broadcast price updates every 2 seconds
setInterval(() => {
  if (clients.size === 0) return;
  const prices = getLatestPrices();
  if (Object.keys(prices).length === 0) return;
  const data = `data: ${JSON.stringify(prices)}\n\n`;
  clients.forEach((client) => {
    try {
      client.write(data);
    } catch (e) {
      clients.delete(client);
    }
  });
}, 2000);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: "Internal Server Error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
