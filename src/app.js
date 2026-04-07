import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { logger } from "./utils/logger.js";

const sanitizeObj = (obj) => {
  if (typeof obj === 'string') return obj.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) obj[i] = sanitizeObj(obj[i]);
    return obj;
  }
  if (obj !== null && typeof obj === 'object') {
    for (let key in obj) {
      obj[key] = sanitizeObj(obj[key]);
    }
  }
  return obj;
};

const simpleXss = (req, res, next) => {
  if (req.body) sanitizeObj(req.body);
  if (req.query) sanitizeObj(req.query);
  if (req.params) sanitizeObj(req.params);
  next();
};

import authRoutes from "./routes/authRoutes.js";
import rateLimit from "express-rate-limit";
import adminRoutes from "./routes/adminRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import farmerRoutes from "./routes/farmerRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import verificationRoutes from "./routes/verificationRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import disputeRoutes from "./routes/disputeRoutes.js";
import subscriptionRoutes from "./routes/subscriptionRoutes.js";
import deliveryRoutes from "./routes/deliveryRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import marketPriceRoutes from "./routes/marketPriceRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import { requestId } from "./middleware/requestId.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { rateLimiter } from "./middleware/rateLimiter.js";
import { errorHandler } from "./middleware/errorHandler.js";

const isProd = process.env.NODE_ENV === "production";

const app = express();

/* ── security ── */
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);

      const allowedOrigins = isProd
        ? (process.env.CORS_ORIGIN || "").split(",").map((o) => o.trim()).filter(Boolean)
        : ["http://localhost:5173", "http://127.0.0.1:5173"];

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS: Origin ${origin} not allowed`));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true, // Allow cookies
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(simpleXss);
app.use(cookieParser());

/* ── request tracking ── */
app.use(requestId);
if (!isProd) {
  app.use(requestLogger);
}


// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({ success: true, message: "Healthy", data: { status: "ok" } });
});

// Rate limit for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { success: false, message: "Too many requests, please try again later." },
});

// ROUTES
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/products", rateLimiter, productRoutes);
app.use("/api/orders", rateLimiter, orderRoutes);
app.use("/api/farmer", farmerRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/verification", verificationRoutes);
app.use("/api/reviews", rateLimiter, reviewRoutes);     // rate-limited to prevent spam
app.use("/api/disputes", rateLimiter, disputeRoutes);   // rate-limited to prevent abuse
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/delivery", deliveryRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/market-prices", marketPriceRoutes);
app.use("/api/cart", cartRoutes);

// 404 handler for unknown API routes
app.use("/api", (req, res, next) => {
  logger.warn(`API endpoint not found: ${req.originalUrl}`);
  res.status(404).json({ message: "API endpoint not found" });
});

app.use(errorHandler);

export default app;