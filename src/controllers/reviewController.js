import Review from "../models/Review.js";
import Order from "../models/Order.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/AppError.js";
import { createNotification } from "./notificationController.js";

/* ================= CREATE REVIEW (BUYER) ================= */
export const createReview = asyncHandler(async (req, res) => {
  const { orderId, farmerId, productId, rating, comment } = req.body;

  if (!orderId || !farmerId) throw new AppError("orderId and farmerId are required", 400);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new AppError("Rating must be an integer between 1 and 5", 400);
  }

  const order = await Order.findById(orderId);
  if (!order) throw new AppError("Order not found", 404);
  if (order.buyer.toString() !== req.user.id) throw new AppError("Not your order", 403);
  if (order.status !== "delivered") throw new AppError("Can only review delivered orders", 400);

  const existing = await Review.findOne({ order: orderId, buyer: req.user.id });
  if (existing) throw new AppError("You already reviewed this order", 400);

  const review = await Review.create({
    order: orderId,
    buyer: req.user.id,
    farmer: farmerId,
    product: productId || null,
    rating,
    comment: comment || "",
  });

  await createNotification({
    recipient: farmerId,
    type: "new_review",
    title: "New Review ⭐",
    message: `You received a ${rating}-star review!`,
    relatedOrder: orderId,
  });

  res.status(201).json({ message: "Review submitted", review });
});

/* ================= GET REVIEWS FOR A FARMER ================= */
export const getFarmerReviews = asyncHandler(async (req, res) => {
  const { farmerId } = req.params;

  const reviews = await Review.find({ farmer: farmerId })
    .populate("buyer", "name")
    .populate("product", "name")
    .sort({ createdAt: -1 });

  const avg = reviews.length > 0
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;

  res.json({
    reviews,
    averageRating: Math.round(avg * 10) / 10,
    totalReviews: reviews.length,
  });
});

/* ================= FARMER REPLY TO REVIEW ================= */
export const replyToReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reply } = req.body;

  if (!reply || typeof reply !== "string" || reply.trim().length === 0) {
    throw new AppError("Reply text is required", 400);
  }

  const review = await Review.findById(id);
  if (!review) throw new AppError("Review not found", 404);
  if (review.farmer.toString() !== req.user.id) throw new AppError("Not your review to reply to", 403);
  if (review.farmerReply) throw new AppError("Already replied", 400);

  review.farmerReply = reply.trim();
  review.farmerRepliedAt = new Date();
  await review.save();

  res.json({ message: "Reply added", review });
});
