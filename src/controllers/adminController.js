import User from "../models/User.js";
import Order from "../models/Order.js";
import Dispute from "../models/Dispute.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/AppError.js";

export const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find({}, "-password");
  res.json(users);
});

export const blockUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { blocked: true }, { new: true });
  if (!user) throw new AppError("User not found", 404);
  res.json({ message: "User blocked", user });
});

export const unblockUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { blocked: false }, { new: true });
  if (!user) throw new AppError("User not found", 404);
  res.json({ message: "User unblocked", user });
});

export const approveFarmer = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { verificationStatus: "verified", verifiedAt: new Date() },
    { new: true }
  );
  if (!user) throw new AppError("Farmer not found", 404);
  res.json({ message: "Farmer approved", user });
});

export const rejectFarmer = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { verificationStatus: "rejected", verificationNote: req.body.note || null },
    { new: true }
  );
  if (!user) throw new AppError("Farmer not found", 404);
  res.json({ message: "Farmer rejected", user });
});

export const getAllOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find().populate("buyer farmer deliveryPartner");
  res.json(orders);
});

export const getAllDisputes = asyncHandler(async (req, res) => {
  const disputes = await Dispute.find().populate("order raisedBy");
  res.json(disputes);
});

export const resolveDispute = asyncHandler(async (req, res) => {
  const dispute = await Dispute.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status, resolutionNote: req.body.note || null },
    { new: true }
  );
  if (!dispute) throw new AppError("Dispute not found", 404);
  res.json({ message: "Dispute updated", dispute });
});
