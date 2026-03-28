import express from "express";
import { getFarmerAnalytics } from "../controllers/farmerOrderController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRole } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get(
  "/analytics",
  protect,
  authorizeRole("farmer"),
  getFarmerAnalytics
);

export default router;
