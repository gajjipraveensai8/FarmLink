import express from "express";
import {
  getMarketPrices,
  priceCheck,
  getFlaggedProducts,
} from "../controllers/marketPriceController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRole } from "../middleware/roleMiddleware.js";

const router = express.Router();

/* public — anyone can check market prices */
router.get("/", getMarketPrices);
router.get("/check", priceCheck);

/* admin — flagged products with high deviation */
router.get("/flagged", protect, authorizeRole("admin"), getFlaggedProducts);

export default router;
