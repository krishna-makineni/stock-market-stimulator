import axios from "axios";

const api = axios.create({ baseURL: "/api" });

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const authAPI = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  me: () => api.get("/auth/me"),
};

// Stocks
export const stockAPI = {
  getAll: () => api.get("/stocks"),
  buy: (symbol, quantity) => api.post("/stocks/buy", { symbol, quantity }),
  sell: (symbol, quantity) => api.post("/stocks/sell", { symbol, quantity }),
  portfolio: () => api.get("/stocks/portfolio"),
  transactions: () => api.get("/stocks/transactions"),
  leaderboard: () => api.get("/stocks/leaderboard"),
  chart: (symbol, range) => api.get(`/stocks/${symbol}/chart?range=${range}`),
  search: (q) => api.get(`/stocks/search?q=${q}`),
  quote: (symbol) => api.get(`/stocks/${symbol}/quote`),
};

export default api;
