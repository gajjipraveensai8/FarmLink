import productService from "../services/productService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const addProduct = asyncHandler(async (req, res) => {
  const product = await productService.addProduct(req.user.id, req.body);
  res.status(201).json({ success: true, message: "Product added successfully", product });
});

export const getProducts = asyncHandler(async (req, res) => {
  const products = await productService.getProducts(req.query);
  res.json(products);
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await productService.updateProduct(req.params.id, req.user.id, req.body);
  res.json({ success: true, product });
});

export const deleteProduct = asyncHandler(async (req, res) => {
  await productService.deleteProduct(req.params.id, req.user.id);
  res.json({ success: true, message: "Product deleted" });
});

export const getMyProducts = asyncHandler(async (req, res) => {
  const products = await productService.getMyProducts(req.user.id);
  res.json({ success: true, products });
});

export const getActiveFarmerCount = asyncHandler(async (req, res) => {
  const count = await productService.getActiveFarmerCount();
  res.json({ success: true, count });
});
