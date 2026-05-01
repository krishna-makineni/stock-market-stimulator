# 📈 StockSim — Real-Time Stock Market Simulator

A full-stack MERN application where users trade virtual money in simulated markets with live price updates, portfolio tracking, P&L analytics, and a competitive leaderboard.

---

## 🚀 Features

- **Live Stock Prices** — Server-Sent Events (SSE) push price updates every 2 seconds
- **15 Simulated Stocks** — AAPL, TSLA, NVDA, GOOGL, META, AMZN and more
- **Buy / Sell Stocks** — Full order execution with balance checks
- **Portfolio Tracking** — Live P&L per holding with allocation pie chart
- **Trade History** — Full transaction log with realized P&L
- **Leaderboard** — Compete against all traders by net worth
- **JWT Authentication** — Secure register/login with protected routes
- **Responsive UI** — Dark terminal-inspired design with Tailwind CSS
- **Ticker Tape** — Scrolling live prices at the top of every page

---

## 🏗️ Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Recharts, React Router v6 |
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcryptjs |
| Real-time | Server-Sent Events (SSE) |
| State | React Context API |
| Notifications | react-toastify |

---

## 📁 Project Structure

```
stocksim/
├── backend/
│   ├── config/
│   │   ├── db.js              # MongoDB connection
│   │   └── stockEngine.js     # Price simulation engine
│   ├── controllers/
│   │   ├── authController.js  # Register, Login, Me
│   │   └── stockController.js # Buy, Sell, Portfolio, Leaderboard
│   ├── middleware/
│   │   └── authMiddleware.js  # JWT protect + admin guard
│   ├── models/
│   │   ├── User.js            # User schema (portfolio embedded)
│   │   └── Transaction.js     # Trade history
│   ├── routes/
│   │   ├── authRoutes.js
│   │   └── stockRoutes.js
│   ├── server.js              # Express app + SSE endpoint
│   ├── .env.example
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.jsx     # Sticky nav with balance display
    │   │   ├── TickerTape.jsx # Scrolling live price ticker
    │   │   ├── MiniChart.jsx  # SVG sparkline charts
    │   │   └── TradeModal.jsx # Buy/sell dialog
    │   ├── context/
    │   │   ├── AuthContext.jsx # User auth state
    │   │   └── StockContext.jsx# SSE live price state
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   ├── Dashboard.jsx  # Overview + net worth chart
    │   │   ├── Market.jsx     # Live stock table + trade
    │   │   ├── Portfolio.jsx  # Holdings + allocation pie
    │   │   ├── Transactions.jsx
    │   │   └── Leaderboard.jsx
    │   ├── routes/
    │   │   └── ProtectedRoute.jsx
    │   ├── services/
    │   │   └── api.js         # Axios service layer
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── tailwind.config.js
    ├── vite.config.js
    └── package.json
```

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js v18+
- MongoDB (local or MongoDB Atlas)

### 1. Clone the repo
```bash
git clone <repo-url>
cd stocksim
```

### 2. Backend Setup
```bash
cd backend
npm install

# Create .env from example
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
```

**.env**
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/stocksim
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRES_IN=7d
```

```bash
npm run dev    # Development with nodemon
# or
npm start      # Production
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```

Frontend runs on: **http://localhost:5173**  
Backend runs on: **http://localhost:5000**

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |

### Stocks (Protected)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stocks` | Get all stocks |
| GET | `/api/stocks/live` | SSE stream for live prices |
| POST | `/api/stocks/buy` | Buy shares |
| POST | `/api/stocks/sell` | Sell shares |
| GET | `/api/stocks/portfolio` | Get portfolio + P&L |
| GET | `/api/stocks/transactions` | Trade history |
| GET | `/api/stocks/leaderboard` | Top 20 traders |

---

## 🎮 How It Works

1. **Register** → Get rs.100,000 virtual cash
2. **Market Page** → Browse 15 live stocks with real-time prices
3. **Buy/Sell** → Execute trades via the modal dialog
4. **Portfolio** → Track your holdings, P&L, and allocation
5. **Leaderboard** → See how you rank against other traders

### Price Simulation
The `stockEngine.js` uses a **random walk with mean reversion** algorithm:
- Each stock has a configurable volatility (1.5% – 7%)
- Prices update every 2 seconds via SSE broadcast
- A slight mean reversion force prevents prices from drifting too far

---

## 🔒 Security Features
- Passwords hashed with **bcrypt** (salt rounds: 12)
- JWT tokens with configurable expiry
- Protected routes via middleware
- Input validation with **express-validator**
- Environment variables via **dotenv**

---

## 🚀 Deployment

**Frontend** → Vercel  
```bash
cd frontend && npm run build
# Deploy /dist to Vercel
```

**Backend** → Render / Railway  
```bash
# Set environment variables in dashboard
# Entry point: server.js
```

**Database** → MongoDB Atlas (free tier)

---

## 📦 NPM Packages Used

### Backend
`express` `mongoose` `jsonwebtoken` `bcryptjs` `cors` `dotenv` `nodemon` `express-validator`

### Frontend
`react` `react-dom` `react-router-dom` `axios` `recharts` `react-toastify` `react-icons` `tailwindcss`
