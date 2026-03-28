import Dispute from "../models/Dispute.js";
import Order from "../models/Order.js";
import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/AppError.js";
import { createNotification } from "./notificationController.js";

/* Count unique buyers who raised disputes against a farmer. If >= 3, suspend. */
const checkAndSuspendFarmer = async (farmerId) => {
  const uniqueBuyers = await Dispute.distinct("raisedBy", { against: farmerId });
  if (uniqueBuyers.length >= 3) {
    const farmer = await User.findById(farmerId);
    if (farmer && !farmer.blocked) {
      farmer.blocked = true;
      await farmer.save();
      await createNotification({
        recipient: farmerId,
        type: "dispute_update",
        title: "Account Suspended 🚫",
        message: "Your seller account has been suspended because 3 or more buyers raised disputes against you. Please contact support to appeal.",
      });
    }
  }
};

/* ================= CREATE DISPUTE ================= */
export const createDispute = asyncHandler(async (req, res) => {
  const { orderId, againstUserId, reason, description } = req.body;

  if (!orderId || !againstUserId || !reason || !description) {
    throw new AppError("orderId, againstUserId, reason, and description are required", 400);
  }

  const order = await Order.findById(orderId);
  if (!order) throw new AppError("Order not found", 404);
  if (order.buyer.toString() !== req.user.id) throw new AppError("Not authorized to dispute this order", 403);

  const existing = await Dispute.findOne({ order: orderId, status: { $in: ["open", "under_review"] } });
  if (existing) throw new AppError("An active dispute already exists for this order", 400);

  if (order.status === "delivered") {
    order.status = "disputed";
    order.statusHistory.push({ status: "disputed", actor: req.user.id, note: `Dispute raised: ${reason}`, timestamp: new Date() });
    await order.save();
  }

  const dispute = await Dispute.create({
    order: orderId,
    raisedBy: req.user.id,
    against: againstUserId,
    reason,
    description,
    messages: [{ sender: req.user.id, message: description, timestamp: new Date() }],
  });

  await createNotification({
    recipient: againstUserId,
    type: "dispute_update",
    title: "Dispute Raised ⚠️",
    message: `A dispute has been raised for order #${String(orderId).slice(-6).toUpperCase()}: ${reason}`,
    relatedOrder: orderId,
  });

  await checkAndSuspendFarmer(againstUserId);

  res.status(201).json({ message: "Dispute created", dispute });
});

/* ================= GET MY DISPUTES ================= */
export const getMyDisputes = asyncHandler(async (req, res) => {
  const disputes = await Dispute.find({ $or: [{ raisedBy: req.user.id }, { against: req.user.id }] })
    .populate("order", "totalAmount status")
    .populate("raisedBy", "name")
    .populate("against", "name")
    .sort({ createdAt: -1 });
  res.json(disputes);
});

/* ================= ADD MESSAGE TO DISPUTE ================= */
export const addDisputeMessage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { message } = req.body;

  if (!message || typeof message !== "string" || !message.trim()) {
    throw new AppError("Message text is required", 400);
  }

  const dispute = await Dispute.findById(id);
  if (!dispute) throw new AppError("Dispute not found", 404);

  const isParty = dispute.raisedBy.toString() === req.user.id || dispute.against.toString() === req.user.id || req.user.role === "admin";
  if (!isParty) throw new AppError("Not authorized", 403);
  if (["resolved", "closed"].includes(dispute.status)) throw new AppError("Dispute is already closed", 400);

  dispute.messages.push({ sender: req.user.id, message: message.trim(), timestamp: new Date() });
  await dispute.save();

  res.json({ message: "Message added", dispute });
});

/* ================= RESOLVE DISPUTE (ADMIN) ================= */
export const resolveDispute = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { resolution, status } = req.body;

  if (!resolution) throw new AppError("Resolution text is required", 400);

  const validStatuses = ["resolved", "closed"];
  const targetStatus = validStatuses.includes(status) ? status : "resolved";

  const dispute = await Dispute.findById(id);
  if (!dispute) throw new AppError("Dispute not found", 404);

  dispute.status = targetStatus;
  dispute.resolution = resolution;
  dispute.messages.push({ sender: req.user.id, message: `[RESOLUTION] ${resolution}`, timestamp: new Date() });
  await dispute.save();

  for (const userId of [dispute.raisedBy, dispute.against]) {
    await createNotification({
      recipient: userId,
      type: "dispute_update",
      title: "Dispute Resolved ⚖️",
      message: `Your dispute has been ${targetStatus}. Resolution: ${resolution}`,
      relatedOrder: dispute.order,
    });
  }

  res.json({ message: `Dispute ${targetStatus}`, dispute });
});
