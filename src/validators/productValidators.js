import { body } from "express-validator";

export const createProductValidator = [
  body("name").notEmpty().withMessage("Name is required"),
  body("price").isFloat({ min: 0 }).withMessage("Price must be a positive number"),
  body("quantity").isInt({ min: 0 }).withMessage("Quantity must be a positive integer"),
  body("category").isIn(["fruits", "vegetables", "milk", "eggs", "other"]).withMessage("Category must be valid"),
  body("harvestDate").notEmpty().withMessage("Harvest date is required"),
];

export const updateProductValidator = [
  body("name").optional().notEmpty().withMessage("Name cannot be empty"),
  body("price").optional().isFloat({ min: 0 }).withMessage("Price must be a positive number"),
  body("quantity").optional().isInt({ min: 0 }).withMessage("Quantity must be a positive integer"),
  body("category").optional().isIn(["fruits", "vegetables", "milk", "eggs", "other"]).withMessage("Category must be valid"),
  body("harvestDate").optional().notEmpty().withMessage("Harvest date cannot be empty"),
];
