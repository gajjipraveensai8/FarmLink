import express from "express";
import {
  submitVerification,
  getVerificationStatus,
  listPendingVerifications,
  reviewVerification,
} from "../controllers/verificationController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRole } from "../middleware/roleMiddleware.js";

const router = express.Router();

/* ── Farmer endpoints ── */
router.post("/submit", protect, authorizeRole("farmer"), submitVerification);
router.get("/status", protect, authorizeRole("farmer"), getVerificationStatus);

/* ── Admin endpoints ── */
router.get("/pending", protect, authorizeRole("admin"), listPendingVerifications);
router.patch("/:userId/review", protect, authorizeRole("admin"), reviewVerification);

export default router;
