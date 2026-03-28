import { useState, useEffect, useRef } from "react";
import api from "../api";

/**
 * Inline market-price comparison widget.
 * Give it a product name/category/price and it will call the
 * backend comparison endpoint and show a deviation warning.
 */
export default function MarketPriceWarning({ name, category, price }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef(null);
  const lastQueryRef = useRef("");

  useEffect(() => {
    const key = `${name}|${category}|${price}`;

    /* clear stale result when required inputs are removed */
    if (!name || !price) {
      setResult(null);
      lastQueryRef.current = "";
      return;
    }

    if (key === lastQueryRef.current) return;

    /* clear stale result immediately while debouncing */
    setResult(null);

    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      lastQueryRef.current = key;
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (name) params.set("name", name);
        if (category) params.set("category", category);
        if (price) params.set("price", price);
        const { data } = await api.get(`/api/market-prices/check?${params}`);
        setResult(data);
      } catch {
        setResult(null);
      } finally {
        setLoading(false);
      }
    }, 800);

    return () => clearTimeout(timerRef.current);
  }, [name, category, price]);

  if (loading) {
    return (
      <div className="rounded-xl bg-gray-50 px-4 py-2.5 text-xs text-gray-400 animate-pulse ring-1 ring-gray-100">
        Checking market prices…
      </div>
    );
  }

  if (!result || !result.marketPrice) return null;

  const pct = result.deviationPercent ?? 0;
  const isHigh = pct > 15;
  const isLow  = pct < -15;

  if (!isHigh && !isLow) {
    return (
      <div className="rounded-xl bg-green-50 px-4 py-2.5 text-xs text-green-700 ring-1 ring-green-200">
        ✅ Price is within market range (₹{result.marketPrice} avg)
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl px-4 py-2.5 text-xs ring-1 ${
        isHigh
          ? "bg-amber-50 text-amber-700 ring-amber-200"
          : "bg-blue-50 text-blue-700 ring-blue-200"
      }`}
    >
      {isHigh
        ? `⚠️ Your price is ${pct.toFixed(0)}% above market avg (₹${result.marketPrice}). Consider adjusting.`
        : `💡 Your price is ${Math.abs(pct).toFixed(0)}% below market avg (₹${result.marketPrice}). You might earn more.`}
    </div>
  );
}
