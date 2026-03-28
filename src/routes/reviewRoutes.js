import express from "express";
import {
  createReview,
  getFarmerReviews,
  replyToReview,
} from "../controllers/reviewController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRole } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post("/", protect, authorizeRole("buyer"), createReview);
router.get("/farmer/:farmerId", getFarmerReviews);
router.patch("/:id/reply", protect, authorizeRole("farmer"), replyToReview);

export default router;
