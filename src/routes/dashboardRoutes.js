import express from "express";
import {
  getEnhancedFarmerAnalytics,
  getBuyerInsights,
} from "../controllers/dashboardController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRole } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get(
  "/farmer/enhanced",
  protect,
  authorizeRole("farmer"),
  getEnhancedFarmerAnalytics
);

router.get(
  "/buyer/insights",
  protect,
  authorizeRole("buyer"),
  getBuyerInsights
);

export default router;
