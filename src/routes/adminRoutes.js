// src/routes/adminRoutes.js
import express from "express";
import adminMiddleware from "../middleware/adminMiddleware.js";
import {
  getAllUsers,
  blockUser,
  unblockUser,
  approveFarmer,
  rejectFarmer,
  getAllOrders,
  getAllDisputes,
  resolveDispute
} from "../controllers/adminController.js";

const router = express.Router();

router.use(adminMiddleware);

// User management
router.get("/users", getAllUsers);
router.patch("/users/:id/block", blockUser);
router.patch("/users/:id/unblock", unblockUser);

// Farmer approval
router.patch("/farmers/:id/approve", approveFarmer);
router.patch("/farmers/:id/reject", rejectFarmer);

// Orders
router.get("/orders", getAllOrders);

// Disputes
router.get("/disputes", getAllDisputes);
router.patch("/disputes/:id/resolve", resolveDispute);

export default router;
