# 📈 StockSim — Real-Time Stock Market Simulator

## 📂 Project Drive Link
https://drive.google.com/drive/folders/1Ab7ROdHtavVOLxhHn00F_uH9miTkL-3E?usp=sharing

A full-stack MERN application where users trade virtual money in simulated markets with live price updates, portfolio tracking, P&L analytics, and a competitive leaderboard.

---

# 🚀 Features

- Live Stock Prices using Server-Sent Events (SSE)
- 15 Simulated Stocks (AAPL, TSLA, NVDA, GOOGL, META, AMZN, etc.)
- Buy / Sell Stocks with balance validation
- Portfolio Tracking with live P&L
- Trade History & Transaction Logs
- Leaderboard based on Net Worth
- JWT Authentication & Protected Routes
- Responsive Dark-Themed UI
- Real-Time Scrolling Stock Ticker

---

# 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Recharts |
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose |
| Authentication | JWT + bcryptjs |
| Real-Time | Server-Sent Events (SSE) |
| State Management | React Context API |
| Notifications | react-toastify |

---

# 📁 Project Structure

```bash
stocksim/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── server.js
│   └── package.json
│
└── frontend/
    ├── src/
    ├── components/
    ├── context/
    ├── pages/
    ├── routes/
    ├── services/
    ├── App.jsx
    ├── main.jsx
    └── index.css
```

---

# ⚙️ Installation & Setup

## Prerequisites
- Node.js v18+
- MongoDB

---

## Backend Setup

```bash
cd backend
npm install
```

Create `.env` file:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/stocksim
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d
```

Run backend:

```bash
npm run dev
```

---

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on:
```bash
http://localhost:5173
```

Backend runs on:
```bash
http://localhost:5000
```

---

# 🔌 API Endpoints

## Auth APIs

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register User |
| POST | `/api/auth/login` | Login User |
| GET | `/api/auth/me` | Current User |

---

## Stock APIs

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/stocks` | Get Stocks |
| GET | `/api/stocks/live` | Live SSE Prices |
| POST | `/api/stocks/buy` | Buy Stocks |
| POST | `/api/stocks/sell` | Sell Stocks |
| GET | `/api/stocks/portfolio` | Portfolio Data |
| GET | `/api/stocks/transactions` | Transaction History |
| GET | `/api/stocks/leaderboard` | Top Traders |

---

# 🎮 Application Workflow

1. Register/Login
2. Receive ₹100,000 Virtual Cash
3. Browse Live Stocks
4. Buy & Sell Shares
5. Track Portfolio Performance
6. Compete on Leaderboard

---

# 📊 Stock Price Simulation

The application uses:
- Random Walk Algorithm
- Mean Reversion Logic
- Configurable Volatility

Prices update every 2 seconds using SSE.

---

# 🔒 Security Features

- JWT Authentication
- bcrypt Password Hashing
- Protected API Routes
- Environment Variables with dotenv
- Input Validation

---

# 🚀 Deployment

## Frontend
Deploy using:
- Vercel
- Netlify

## Backend
Deploy using:
- Render
- Railway

## Database
- MongoDB Atlas

---

# 📦 NPM Packages

## Backend Packages

```bash
express
mongoose
jsonwebtoken
bcryptjs
cors
dotenv
nodemon
express-validator
```

---

## Frontend Packages

```bash
react
react-dom
react-router-dom
axios
recharts
react-toastify
react-icons
tailwindcss
```

---

# 👨‍💻 Author

Krishna Makineni
