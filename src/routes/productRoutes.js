import express from "express";

import {
  addProduct,
  getProducts,
  updateProduct,
  deleteProduct,
  getMyProducts,
  getActiveFarmerCount,
} from "../controllers/productController.js";
import { createProductValidator, updateProductValidator } from "../validators/productValidators.js";
import { validationResult } from "express-validator";

import { protect } from "../middleware/authMiddleware.js";
import { authorizeRole } from "../middleware/roleMiddleware.js";
import { validateProduct } from "../middleware/fraudGuards.js";

const router = express.Router();

/* ================= PUBLIC / BUYER ================= */

// View products (with geo search, freshness, distance)
router.get("/", getProducts);

// GET /api/products/count — active farmer count for marketplace stats
router.get("/count", getActiveFarmerCount);

// GET /api/products/my (Farmer only)
router.get("/my", protect, authorizeRole("farmer"), getMyProducts);

/* ================= FARMER ONLY ================= */

// Validation error handler
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array(),
    });
  }
  next();
};

// Suspension guard — blocks writes if farmer is suspended
const checkFarmerSuspended = (req, res, next) => {
  if (req.user?.blocked) {
    return res.status(403).json({
      success: false,
      message:
        "Your account is suspended due to multiple buyer disputes. You cannot list or modify products. Please contact support.",
    });
  }
  next();
};

// Add product
router.post(
  "/",
  protect,
  authorizeRole("farmer"),
  checkFarmerSuspended,
  createProductValidator,
  handleValidation,
  validateProduct,
  addProduct
);

// Update own product
router.put(
  "/:id",
  protect,
  authorizeRole("farmer"),
  checkFarmerSuspended,
  updateProductValidator,
  handleValidation,
  validateProduct,
  updateProduct
);

// Delete own product
router.delete("/:id", protect, authorizeRole("farmer"), checkFarmerSuspended, deleteProduct);

export default router;