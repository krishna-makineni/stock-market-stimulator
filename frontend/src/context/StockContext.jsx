import { createContext, useContext, useState, useEffect, useRef } from "react";
import { useAuth } from "./AuthContext";

const StockContext = createContext();

export const StockProvider = ({ children }) => {
  const { token } = useAuth();
  const [prices, setPrices] = useState({});
  const [prevPrices, setPrevPrices] = useState({});
  const [connected, setConnected] = useState(false);
  const esRef = useRef(null);

  useEffect(() => {
    if (!token) return;

    // Open SSE connection for live prices
    const es = new EventSource("/api/stocks/live");
    esRef.current = es;

    es.onopen = () => setConnected(true);

    es.onmessage = (e) => {
      const data = JSON.parse(e.data);
      setPrevPrices((prev) => {
        const updated = { ...prev };
        Object.keys(data).forEach((sym) => {
          updated[sym] = prev[sym] || data[sym].price;
        });
        return updated;
      });
      setPrices(data);
    };

    es.onerror = () => {
      setConnected(false);
      es.close();
      // Reconnect after 3s
      setTimeout(() => {
        if (token) {
          const newEs = new EventSource("/api/stocks/live");
          esRef.current = newEs;
        }
      }, 3000);
    };

    return () => {
      es.close();
      setConnected(false);
    };
  }, [token]);

  const getPriceDirection = (symbol) => {
    const cur = prices[symbol]?.price;
    const prev = prevPrices[symbol];
    if (!cur || !prev || cur === prev) return "neutral";
    return cur > prev ? "up" : "down";
  };

  return (
    <StockContext.Provider value={{ prices, connected, getPriceDirection }}>
      {children}
    </StockContext.Provider>
  );
};

export const useStock = () => {
  const ctx = useContext(StockContext);
  if (!ctx) throw new Error("useStock must be used within StockProvider");
  return ctx;
};
