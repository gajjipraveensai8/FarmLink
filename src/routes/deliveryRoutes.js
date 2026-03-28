import express from "express";
import {
  getMyDeliveries,
  updateDeliveryStatus,
  assignDeliveryPartner,
  getAvailableAgents,
} from "../controllers/deliveryController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRole } from "../middleware/roleMiddleware.js";

const router = express.Router();

/* ── Delivery partner ── */
router.get("/my", protect, authorizeRole("delivery_partner"), getMyDeliveries);
router.patch(
  "/:id/status",
  protect,
  authorizeRole("delivery_partner"),
  updateDeliveryStatus
);

/* ── Farmer assigns delivery partner to an order ── */
router.patch(
  "/:id/assign",
  protect,
  authorizeRole("farmer"),
  assignDeliveryPartner
);

/* ── Farmer fetches available delivery agents ── */
router.get(
  "/available-agents",
  protect,
  authorizeRole("farmer"),
  getAvailableAgents
);

export default router;
