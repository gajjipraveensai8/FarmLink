import Subscription from "../models/Subscription.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/AppError.js";

const VALID_FREQUENCIES = ["daily", "weekly", "biweekly", "monthly"];
const VALID_STATUSES = ["active", "paused", "cancelled"];

/* ================= CREATE SUBSCRIPTION ================= */
export const createSubscription = asyncHandler(async (req, res) => {
  const { items, frequency, deliveryDay, deliveryTimeSlot } = req.body;

  if (!Array.isArray(items) || items.length === 0) throw new AppError("Items array is required", 400);
  if (!frequency || !VALID_FREQUENCIES.includes(frequency)) {
    throw new AppError(`Frequency must be one of: ${VALID_FREQUENCIES.join(", ")}`, 400);
  }

  const now = new Date();
  const nextDeliveryDate = new Date(now);
  if (frequency === "daily") nextDeliveryDate.setDate(now.getDate() + 1);
  else if (frequency === "weekly") nextDeliveryDate.setDate(now.getDate() + 7);
  else if (frequency === "biweekly") nextDeliveryDate.setDate(now.getDate() + 14);
  else if (frequency === "monthly") nextDeliveryDate.setMonth(now.getMonth() + 1);

  const subscription = await Subscription.create({
    buyer: req.user.id,
    items,
    frequency,
    deliveryDay: deliveryDay || null,
    deliveryTimeSlot: deliveryTimeSlot || null,
    nextDeliveryDate,
  });

  res.status(201).json({ message: "Subscription created", subscription });
});

/* ================= GET MY SUBSCRIPTIONS ================= */
export const getMySubscriptions = asyncHandler(async (req, res) => {
  const subscriptions = await Subscription.find({ buyer: req.user.id })
    .populate("items.product", "name price category")
    .sort({ createdAt: -1 });
  res.json(subscriptions);
});

/* ================= UPDATE SUBSCRIPTION ================= */
export const updateSubscription = asyncHandler(async (req, res) => {
  const sub = await Subscription.findById(req.params.id);
  if (!sub) throw new AppError("Subscription not found", 404);
  if (sub.buyer.toString() !== req.user.id) throw new AppError("Not authorized", 403);

  const { items, frequency, deliveryDay, deliveryTimeSlot } = req.body;
  if (items) sub.items = items;
  if (frequency) sub.frequency = frequency;
  if (deliveryDay !== undefined) sub.deliveryDay = deliveryDay;
  if (deliveryTimeSlot !== undefined) sub.deliveryTimeSlot = deliveryTimeSlot;
  await sub.save();

  res.json({ message: "Subscription updated", subscription: sub });
});

/* ================= PAUSE / RESUME / CANCEL ================= */
export const changeSubscriptionStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!status || !VALID_STATUSES.includes(status)) {
    throw new AppError(`Status must be one of: ${VALID_STATUSES.join(", ")}`, 400);
  }

  const sub = await Subscription.findById(req.params.id);
  if (!sub) throw new AppError("Subscription not found", 404);
  if (sub.buyer.toString() !== req.user.id) throw new AppError("Not authorized", 403);
  if (sub.status === "cancelled") throw new AppError("Cannot modify a cancelled subscription", 400);

  sub.status = status;
  await sub.save();

  res.json({ message: `Subscription ${status}`, subscription: sub });
});
