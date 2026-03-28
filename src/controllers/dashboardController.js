import mongoose from "mongoose";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Review from "../models/Review.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/* ================= FARMER: ENHANCED ANALYTICS ================= */
export const getEnhancedFarmerAnalytics = asyncHandler(async (req, res) => {
  const farmerId = new mongoose.Types.ObjectId(req.user.id);

    /* ── top-selling products ── */
    const topProductsPipeline = Order.aggregate([
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "_product",
        },
      },
      { $unwind: "$_product" },
      { $match: { "_product.farmer": farmerId } },
      {
        $group: {
          _id: "$items.product",
          productName: { $first: "$_product.name" },
          totalSold: { $sum: "$items.quantity" },
          totalRevenue: {
            $sum: { $multiply: ["$items.quantity", "$items.priceAtPurchase"] },
          },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: 10 },
    ]);

    /* ── repeat buyers ── */
    const repeatBuyersPipeline = Order.aggregate([
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "_product",
        },
      },
      { $unwind: "$_product" },
      { $match: { "_product.farmer": farmerId } },
      {
        $group: {
          _id: "$buyer",
          orderCount: { $addToSet: "$_id" },
        },
      },
      {
        $project: {
          _id: 1,
          orderCount: { $size: "$orderCount" },
        },
      },
      { $match: { orderCount: { $gte: 2 } } },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "buyerInfo",
        },
      },
      { $unwind: "$buyerInfo" },
      {
        $project: {
          buyerName: "$buyerInfo.name",
          buyerEmail: "$buyerInfo.email",
          orderCount: 1,
        },
      },
      { $sort: { orderCount: -1 } },
      { $limit: 10 },
    ]);

    /* ── demand trends (last 30 days, grouped by day) ── */
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const demandTrendsPipeline = Order.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "_product",
        },
      },
      { $unwind: "$_product" },
      { $match: { "_product.farmer": farmerId } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          ordersCount: { $addToSet: "$_id" },
          revenue: {
            $sum: { $multiply: ["$items.quantity", "$items.priceAtPurchase"] },
          },
          unitsSold: { $sum: "$items.quantity" },
        },
      },
      {
        $project: {
          date: "$_id",
          orders: { $size: "$ordersCount" },
          revenue: 1,
          unitsSold: 1,
          _id: 0,
        },
      },
      { $sort: { date: 1 } },
    ]);

    /* ── category breakdown ── */
    const categoryBreakdownPipeline = Order.aggregate([
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "_product",
        },
      },
      { $unwind: "$_product" },
      { $match: { "_product.farmer": farmerId } },
      {
        $group: {
          _id: "$_product.category",
          totalSold: { $sum: "$items.quantity" },
          revenue: {
            $sum: { $multiply: ["$items.quantity", "$items.priceAtPurchase"] },
          },
        },
      },
      { $sort: { revenue: -1 } },
    ]);

    /* ── average rating ── */
    const ratingPipeline = Review.aggregate([
      { $match: { farmer: farmerId } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    /* ── run all 5 pipelines in parallel ── */
    const [topProducts, repeatBuyers, demandTrends, categoryBreakdown, ratingResult] =
      await Promise.all([
        topProductsPipeline,
        repeatBuyersPipeline,
        demandTrendsPipeline,
        categoryBreakdownPipeline,
        ratingPipeline,
      ]);

    const ratingInfo = ratingResult[0];

    res.json({
      topProducts,
      repeatBuyers,
      demandTrends,
      categoryBreakdown,
      rating: {
        average: ratingInfo ? Math.round(ratingInfo.avgRating * 10) / 10 : 0,
        total: ratingInfo?.totalReviews || 0,
      },
    });
});

/* ================= BUYER: INSIGHTS ================= */
export const getBuyerInsights = asyncHandler(async (req, res) => {
  const buyerId = new mongoose.Types.ObjectId(req.user.id);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    /* ── run all 3 pipelines in parallel ── */
    const [summaryResult, spendingTrend, favouriteCategories] = await Promise.all([
      Order.aggregate([
        { $match: { buyer: buyerId } },
        {
          $group: {
            _id: null,
            totalSpent: { $sum: "$totalAmount" },
            totalOrders: { $sum: 1 },
          },
        },
      ]),
      Order.aggregate([
        {
          $match: {
            buyer: buyerId,
            createdAt: { $gte: thirtyDaysAgo },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            spent: { $sum: "$totalAmount" },
            orders: { $sum: 1 },
          },
        },
        {
          $project: { date: "$_id", spent: 1, orders: 1, _id: 0 },
        },
        { $sort: { date: 1 } },
      ]),
      Order.aggregate([
        { $match: { buyer: buyerId } },
        { $unwind: "$items" },
        {
          $lookup: {
            from: "products",
            localField: "items.product",
            foreignField: "_id",
            as: "_product",
          },
        },
        { $unwind: "$_product" },
        {
          $group: {
            _id: "$_product.category",
            purchased: { $sum: "$items.quantity" },
          },
        },
        { $sort: { purchased: -1 } },
      ]),
    ]);

    const summary = summaryResult[0];

    res.json({
      totalSpent: summary?.totalSpent || 0,
      totalOrders: summary?.totalOrders || 0,
      spendingTrend,
      favouriteCategories,
    favouriteCategories,
  });
});
