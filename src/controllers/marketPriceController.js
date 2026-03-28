import MARKET_PRICES from "../data/marketPrices.js";
import Product from "../models/Product.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/AppError.js";

const getMarketPrice = (category, productName) => {
  const cat = (category || "other").toLowerCase();
  const name = (productName || "").toLowerCase().trim();
  const bucket = MARKET_PRICES[cat] || MARKET_PRICES.other;
  return bucket[name] ?? bucket.default ?? 50;
};

const deviation = (actual, market) =>
  market > 0 ? Math.round(((actual - market) / market) * 100) : 0;

/* ================= GET MARKET PRICES ================= */
export const getMarketPrices = (_req, res) => {
  res.json(MARKET_PRICES);
};

/* ================= PRICE CHECK FOR A SINGLE PRODUCT ================= */
export const priceCheck = (req, res) => {
  const { category, name, price } = req.query;
  if (!price || !name) throw new AppError("name and price query params are required", 400);

  const actual = Number(price);
  if (!Number.isFinite(actual)) throw new AppError("Invalid price value", 400);

  const marketPrice = getMarketPrice(category, name);
  const dev = deviation(actual, marketPrice);

  res.json({
    productName: name,
    category: category || "other",
    yourPrice: actual,
    marketPrice,
    deviationPercent: dev,
    flag: Math.abs(dev) > 50 ? "high_deviation" : Math.abs(dev) > 25 ? "moderate_deviation" : "normal",
  });
};

/* ================= FLAGGED PRODUCTS (high deviation) ================= */
export const getFlaggedProducts = asyncHandler(async (req, res) => {
  const threshold = Number(req.query.threshold) || 50;

  const products = await Product.find({ isExpired: false, isSoldOut: false })
    .select("name price category farmer")
    .populate("farmer", "name")
    .lean();

  const flagged = products
    .map((p) => {
      const mp = getMarketPrice(p.category, p.name);
      const dev = deviation(p.price, mp);
      return { _id: p._id, name: p.name, price: p.price, category: p.category, farmer: p.farmer, marketPrice: mp, deviationPercent: dev };
    })
    .filter((p) => Math.abs(p.deviationPercent) >= threshold)
    .sort((a, b) => Math.abs(b.deviationPercent) - Math.abs(a.deviationPercent));

  res.json({ threshold, flaggedCount: flagged.length, products: flagged });
});
