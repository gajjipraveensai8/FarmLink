import express from "express";
import {
  createOrder,
  getBuyerOrders,
  getOrderById,
  cancelOrder,
  removeItemFromOrder,
  acceptDelivery,
} from "../controllers/orderController.js";
import {
  getFarmerOrders,
  updateOrderStatus,
} from "../controllers/farmerOrderController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRole } from "../middleware/roleMiddleware.js";
import { validateOrder } from "../middleware/fraudGuards.js";

const router = express.Router();

/* ── Buyer routes ── */
router.post("/", protect, authorizeRole("buyer"), validateOrder, createOrder);
router.get("/my", protect, authorizeRole("buyer"), getBuyerOrders);
router.patch("/:id/cancel", protect, authorizeRole("buyer"), cancelOrder);
router.patch("/:id/accept-delivery", protect, authorizeRole("farmer"), acceptDelivery);
router.delete("/:id/items/:productId", protect, authorizeRole("buyer"), removeItemFromOrder);

/* ── Farmer routes ── */
router.get("/farmer", protect, authorizeRole("farmer"), getFarmerOrders);
router.patch(
  "/:id/status",
  protect,
  authorizeRole("farmer"),
  updateOrderStatus
);

/* ── Shared (buyer / farmer / delivery partner) ── */
router.get("/:id", protect, getOrderById);

export default router;