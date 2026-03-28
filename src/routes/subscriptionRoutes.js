import express from "express";
import {
  createSubscription,
  getMySubscriptions,
  updateSubscription,
  changeSubscriptionStatus,
} from "../controllers/subscriptionController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRole } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post("/", protect, authorizeRole("buyer"), createSubscription);
router.get("/my", protect, authorizeRole("buyer"), getMySubscriptions);
router.put("/:id", protect, authorizeRole("buyer"), updateSubscription);
router.patch("/:id/status", protect, authorizeRole("buyer"), changeSubscriptionStatus);

export default router;
