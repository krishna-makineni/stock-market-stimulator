const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getStocks,
  buyStock,
  sellStock,
  getPortfolio,
  getTransactions,
  getLeaderboard,
  getStockChart,
  searchStocks,
  getStockQuote,
} = require("../controllers/stockController");

router.get("/", protect, getStocks);
router.get("/search", protect, searchStocks);
router.get("/:symbol/quote", protect, getStockQuote);
router.post("/buy", protect, buyStock);
router.post("/sell", protect, sellStock);
router.get("/portfolio", protect, getPortfolio);
router.get("/transactions", protect, getTransactions);
router.get("/leaderboard", protect, getLeaderboard);
router.get("/:symbol/chart", protect, getStockChart);

module.exports = router;
