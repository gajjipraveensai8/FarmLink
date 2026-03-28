import mongoose from "mongoose";
import Order, { STATUS_TRANSITIONS } from "../models/Order.js";
import Product from "../models/Product.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/AppError.js";

const FARMER_ALLOWED = new Set(["accepted", "rejected", "packed", "out_for_delivery", "delivered", "cancelled"]);

export const getFarmerOrders = asyncHandler(async (req, res) => {
  const farmerId = new mongoose.Types.ObjectId(req.user.id);

  const farmerProductIds = (
    await Product.find({ farmer: farmerId }).select("_id").lean()
  ).map((p) => p._id);

  const orders = await Order.find({ "items.product": { $in: farmerProductIds } })
    .populate("buyer", "name email phone address")
    .populate("items.product", "name price")
    .populate("deliveryPartner", "name phone")
    .sort({ createdAt: -1 });

  res.json(orders);
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, note, farmerFulfillmentType, deliveryPartnerId } = req.body;

  if (!status || !FARMER_ALLOWED.has(status)) {
    throw new AppError(`Invalid status. Allowed: ${[...FARMER_ALLOWED].join(", ")}`, 400);
  }

  const order = await Order.findById(id).populate("items.product", "farmer");
  if (!order) throw new AppError("Order not found", 404);

  const ownsSomeProduct = order.items.some((i) => i.product?.farmer?.toString() === req.user.id);
  if (!ownsSomeProduct) throw new AppError("Not authorized", 403);
  if (order.status === status) throw new AppError("Order already in this status", 400);

  const allowedNextStatuses = STATUS_TRANSITIONS[order.status];
  if (!allowedNextStatuses || !allowedNextStatuses.has(status)) {
    throw new AppError(`Cannot transition from '${order.status}' to '${status}'`, 400);
  }

  /* ── When accepting, record fulfilment type & auto-populate addresses ── */
  if (status === "accepted" && farmerFulfillmentType) {
    const VALID_TYPES = ["buyer_pickup", "farmer_deliver", "agent_deliver"];
    if (!VALID_TYPES.includes(farmerFulfillmentType)) {
      throw new AppError(`farmerFulfillmentType must be one of: ${VALID_TYPES.join(", ")}`, 400);
    }
    order.farmerFulfillmentType = farmerFulfillmentType;

    if (farmerFulfillmentType === "agent_deliver") {
      if (!deliveryPartnerId) throw new AppError("deliveryPartnerId is required for agent_deliver", 400);
      const User = (await import("../models/User.js")).default;
      const agent = await User.findById(deliveryPartnerId);
      if (!agent || agent.role !== "delivery_partner") {
        throw new AppError("Invalid delivery partner", 400);
      }
      order.deliveryPartner = deliveryPartnerId;
      order.deliveryType = "delivery";
      order.deliveryAcceptedByFarmer = true;

      /* Auto-populate addresses from User profiles */
      const [buyer, farmer] = await Promise.all([
        User.findById(order.buyer).select("address"),
        User.findById(req.user.id).select("address"),
      ]);
      if (buyer?.address) order.deliveryAddress = buyer.address;
      if (farmer?.address) order.pickupAddress = farmer.address;

    } else if (farmerFulfillmentType === "farmer_deliver") {
      order.deliveryType = "delivery";
      order.deliveryAcceptedByFarmer = true;

      /* Auto-populate buyer's delivery address */
      const User = (await import("../models/User.js")).default;
      const buyer = await User.findById(order.buyer).select("address");
      if (buyer?.address) order.deliveryAddress = buyer.address;

    } else {
      // buyer_pickup
      order.deliveryType = "pickup";
    }
  }

  if (status === "rejected") order.rejectionReason = note || "Rejected by farmer";
  if (status === "cancelled") {
    order.cancellationReason = note || "Cancelled by farmer";
    order.cancelledBy = req.user.id;
  }

  order.status = status;
  order.statusHistory.push({ status, actor: req.user.id, note: note || "", timestamp: new Date() });

  const updated = await order.save();
  await updated.populate("deliveryPartner", "name phone");
  res.json({ message: "Order status updated", order: updated });
});

export const getFarmerAnalytics = asyncHandler(async (req, res) => {
  const farmerId = new mongoose.Types.ObjectId(req.user.id);

  const [summary] = await Order.aggregate([
    { $unwind: "$items" },
    { $lookup: { from: "products", localField: "items.product", foreignField: "_id", as: "_product" } },
    { $unwind: "$_product" },
    { $match: { "_product.farmer": farmerId } },
    {
      $group: {
        _id: null,
        orderIds: { $addToSet: "$_id" },
        totalRevenue: { $sum: { $multiply: ["$items.quantity", "$items.priceAtPurchase"] } },
        totalProductsSold: { $sum: "$items.quantity" },
      },
    },
    { $project: { _id: 0, totalOrders: { $size: "$orderIds" }, totalRevenue: 1, totalProductsSold: 1 } },
  ]);

  res.json({
    totalOrders: summary?.totalOrders || 0,
    totalRevenue: summary?.totalRevenue || 0,
    totalProductsSold: summary?.totalProductsSold || 0,
  });
});
