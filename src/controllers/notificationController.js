import Notification from "../models/Notification.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/AppError.js";

/**
 * Create a notification (internal helper — not an HTTP handler).
 * Kept as a plain async — no asyncHandler needed since it's not a route handler.
 */
export const createNotification = async ({
  recipient,
  type,
  title,
  message,
  relatedOrder = null,
  relatedProduct = null,
  metadata = {},
}) => {
  try {
    return await Notification.create({
      recipient,
      type,
      title,
      message,
      relatedOrder,
      relatedProduct,
      metadata,
    });
  } catch (err) {
    console.error("Failed to create notification:", err.message);
    return null;
  }
};

/* ================= GET MY NOTIFICATIONS ================= */
export const getNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, unreadOnly } = req.query;
  const pageVal = Math.max(parseInt(page, 10) || 1, 1);
  const limitVal = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

  const filter = { recipient: req.user.id };
  if (unreadOnly === "true") filter.read = false;

  const [notifications, total] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageVal - 1) * limitVal)
      .limit(limitVal)
      .lean(),
    Notification.countDocuments(filter),
  ]);

  const unreadCount = await Notification.countDocuments({
    recipient: req.user.id,
    read: false,
  });

  res.json({ notifications, total, unreadCount, page: pageVal, limit: limitVal });
});

/* ================= MARK AS READ ================= */
export const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user.id },
    { read: true },
    { new: true }
  );

  if (!notification) throw new AppError("Notification not found", 404);

  res.json({ message: "Marked as read", notification });
});

/* ================= MARK ALL AS READ ================= */
export const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { recipient: req.user.id, read: false },
    { read: true }
  );
  res.json({ message: "All notifications marked as read" });
});
