import express from "express";
import {
  createDispute,
  getMyDisputes,
  addDisputeMessage,
  resolveDispute,
} from "../controllers/disputeController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorizeRole } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post("/", protect, createDispute);
router.get("/my", protect, getMyDisputes);
router.post("/:id/message", protect, addDisputeMessage);
router.patch("/:id/resolve", protect, authorizeRole("admin"), resolveDispute);

export default router;
