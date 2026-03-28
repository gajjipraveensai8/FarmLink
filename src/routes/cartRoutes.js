import express from "express";
import { getCart, syncCart } from "../controllers/cartController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.route("/")
  .get(getCart)
  .post(syncCart); // Sync the full cart payload

export default router;
