import Order, { STATUS_TRANSITIONS } from "../models/Order.js";
import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/AppError.js";
import { createNotification } from "./notificationController.js";

/* ================= GET AVAILABLE DELIVERY AGENTS ================= */
export const getAvailableAgents = asyncHandler(async (req, res) => {
  const agents = await User.find(
    { role: "delivery_partner", blocked: false },
    "name phone email address"
  ).lean();
  res.json({ success: true, agents });
});

const DELIVERY_ALLOWED = new Set(["out_for_delivery", "delivered"]);

/* ================= GET ASSIGNED DELIVERIES ================= */
export const getMyDeliveries = asyncHandler(async (req, res) => {
  const deliveries = await Order.find({ deliveryPartner: req.user.id, deliveryType: "delivery" })
    .populate("buyer", "name phone address")
    .populate("items.product", "name price farmer")
    .sort({ createdAt: -1 });
  res.json(deliveries);
});

/* ================= UPDATE DELIVERY STATUS ================= */
export const updateDeliveryStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, note } = req.body;

  if (!status || !DELIVERY_ALLOWED.has(status)) {
    throw new AppError(`Delivery partner can set: ${[...DELIVERY_ALLOWED].join(", ")}`, 400);
  }

  const order = await Order.findById(id);
  if (!order) throw new AppError("Order not found", 404);
  if (!order.deliveryPartner || order.deliveryPartner.toString() !== req.user.id) {
    throw new AppError("Not assigned to this delivery", 403);
  }

  const allowed = STATUS_TRANSITIONS[order.status];
  if (!allowed || !allowed.has(status)) {
    throw new AppError(`Cannot transition from '${order.status}' to '${status}'`, 400);
  }

  order.status = status;
  order.statusHistory.push({ status, actor: req.user.id, note: note || `Delivery status: ${status}`, timestamp: new Date() });
  await order.save();

  await createNotification({
    recipient: order.buyer,
    type: `order_${status}`,
    title: status === "out_for_delivery" ? "Out for Delivery 🚚" : "Order Delivered ✅",
    message: status === "out_for_delivery" ? "Your order is on its way!" : "Your order has been delivered!",
    relatedOrder: order._id,
  });

  res.json({ message: "Delivery status updated", order });
});

/* ================= ASSIGN DELIVERY PARTNER (FARMER) ================= */
export const assignDeliveryPartner = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { deliveryPartnerId } = req.body;

  if (!deliveryPartnerId) throw new AppError("deliveryPartnerId is required", 400);

  const order = await Order.findById(id).populate("items.product", "farmer");
  if (!order) throw new AppError("Order not found", 404);

  const ownsSome = order.items.some((i) => i.product?.farmer?.toString() === req.user.id);
  if (!ownsSome) throw new AppError("Not authorized", 403);

  const partner = await User.findById(deliveryPartnerId);
  if (!partner || partner.role !== "delivery_partner") throw new AppError("Invalid delivery partner", 400);

  order.deliveryPartner = deliveryPartnerId;
  order.deliveryType = "delivery";
  await order.save();

  await createNotification({
    recipient: deliveryPartnerId,
    type: "general",
    title: "New Delivery Assigned 📦",
    message: `You have been assigned a new delivery (Order #${String(order._id).slice(-6).toUpperCase()}).`,
    relatedOrder: order._id,
  });

  res.json({ message: "Delivery partner assigned", order });
});
