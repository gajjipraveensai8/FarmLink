import mongoose from "mongoose";
import Order, { STATUS_TRANSITIONS } from "../models/Order.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import { getIO } from "../utils/socket.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/AppError.js";

export const createOrder = asyncHandler(async (req, res, next) => {
  // Input validation
  const { items, deliveryType, deliveryTimeSlot, deliveryNotes, deliveryAddress: bodyDeliveryAddress } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: "items array is required and must not be empty." });
  }
  if (items.length > 50) {
    return res.status(400).json({ success: false, message: "Maximum 50 items per order." });
  }
  for (const item of items) {
    if (!item.productId || typeof item.productId !== "string") {
      return res.status(400).json({ success: false, message: "Each item must have a valid productId." });
    }
    if (!Number.isInteger(item.quantity) || item.quantity < 1) {
      return res.status(400).json({ success: false, message: "Each item must have a positive integer quantity." });
    }
  }

  // Begin transaction
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const orderItems = [];

    // Check for existing 'placed' order to consolidate
    const existingOrder = await Order.findOne({
      buyer: req.user.id,
      status: "placed"
    }).session(session);

    if (existingOrder && (existingOrder.items.length + items.length) <= 50) {
      // SMART MERGE: Add new items to existing order
      for (const { productId, quantity } of items) {
        // Validate and decrement stock
        const updated = await Product.findOneAndUpdate(
          { _id: productId, quantity: { $gte: quantity }, isExpired: { $ne: true } },
          { $inc: { quantity: -quantity } },
          { new: true, session }
        );
        if (!updated) {
          const exists = await Product.findById(productId).select("name quantity isExpired").session(session);
          await session.abortTransaction();
          if (!exists) return res.status(404).json({ success: false, message: `Product not found: ${productId}` });
          if (exists.isExpired) return res.status(400).json({ success: false, message: `\"${exists.name}\" is no longer available` });
          return res.status(400).json({ success: false, message: `Insufficient stock for ${exists.name}` });
        }

        // Find if product already in existing order
        const existingItemIndex = existingOrder.items.findIndex(i => i.product.toString() === productId);
        if (existingItemIndex > -1) {
          existingOrder.items[existingItemIndex].quantity += quantity;
        } else {
          existingOrder.items.push({
            product: updated._id,
            quantity,
            priceAtPurchase: updated.price,
          });
        }
      }

      existingOrder.deliveryType = deliveryType || existingOrder.deliveryType;
      existingOrder.deliveryFee = req.body.deliveryFee !== undefined ? Number(req.body.deliveryFee) : existingOrder.deliveryFee;
      existingOrder.totalAmount = existingOrder.items.reduce((sum, i) => sum + i.quantity * i.priceAtPurchase, 0) + existingOrder.deliveryFee;

      /* Auto-capture buyer's delivery address — prefer body, fallback to profile */
      if (!existingOrder.deliveryAddress) {
        const buyerUser = await User.findById(req.user.id).select("address").lean();
        existingOrder.deliveryAddress = bodyDeliveryAddress?.trim() || buyerUser?.address || null;
      }

      existingOrder.statusHistory.push({
        status: "placed",
        actor: req.user.id,
        note: `Additional items merged into order. Delivery: ${existingOrder.deliveryType}`,
        timestamp: new Date(),
      });

      await existingOrder.save({ session });
      const populatedOrder = await Order.findById(existingOrder._id).populate("items.product", "farmer").session(session);
      await session.commitTransaction();

      const io = getIO();
      io.to(`user_${req.user.id}`).emit('order_update', { type: 'updated', order: populatedOrder });
      return res.status(200).json({ success: true, message: "Items added to your existing order", order: populatedOrder });
    }

    // ORIGINAL LOGIC (for new order or full merge)
    for (const { productId, quantity } of items) {
      // Validate and decrement atomically
      const updated = await Product.findOneAndUpdate(
        { _id: productId, quantity: { $gte: quantity }, isExpired: { $ne: true } },
        { $inc: { quantity: -quantity } },
        { new: true, session }
      );
      if (!updated) {
        // Check why: not found, expired, or insufficient stock
        const exists = await Product.findById(productId).select("name quantity isExpired").session(session);
        await session.abortTransaction();
        if (!exists) {
          return res.status(404).json({ success: false, message: `Product not found: ${productId}` });
        }
        if (exists.isExpired) {
          return res.status(400).json({ success: false, message: `\"${exists.name}\" is no longer available (expired)` });
        }
        return res.status(400).json({ success: false, message: `Insufficient stock for ${exists.name}. Available: ${exists.quantity}` });
      }
      // Mark as sold out if quantity is now 0
      if (updated.quantity === 0 && !updated.isSoldOut) {
        updated.isSoldOut = true;
        await updated.save({ session });
      }
      orderItems.push({
        product: updated._id,
        quantity,
        priceAtPurchase: updated.price,
      });
    }

    // Calculate total and persist order inside transaction
    const totalAmount = orderItems.reduce((sum, i) => sum + i.quantity * i.priceAtPurchase, 0) + (Number(req.body.deliveryFee) || 0);
    /* Auto-capture buyer's delivery address — prefer body, fallback to profile */
    const buyerUser = await User.findById(req.user.id).select("address").lean();
    const resolvedDeliveryAddress = bodyDeliveryAddress?.trim() || buyerUser?.address || null;

    const [order] = await Order.create([
      {
        buyer: req.user.id,
        items: orderItems,
        totalAmount,
        deliveryType: deliveryType || "pickup",
        deliveryFee: req.body.deliveryFee || 0,
        deliveryTimeSlot: deliveryTimeSlot || null,
        deliveryNotes: deliveryNotes || null,
        deliveryAddress: resolvedDeliveryAddress,
        statusHistory: [
          {
            status: "placed",
            actor: req.user.id,
            note: "Order placed by buyer",
            timestamp: new Date(),
          },
        ],
      },
    ], { session });

    // Populate order items to get farmer info for socket emission
    const populatedOrder = await Order.findById(order._id)
      .populate("items.product", "farmer")
      .session(session);

    await session.commitTransaction();

    const io = getIO();
    // Emit Socket.IO event to buyer, farmer, and delivery agent (if assigned)
    io.to(`user_${order.buyer}`).emit('order_update', { type: 'created', order: populatedOrder });

    // Safety check for for populated fields
    const farmerIds = [...new Set(populatedOrder.items
      .filter(i => i.product && i.product.farmer)
      .map(i => i.product.farmer.toString()))];

    farmerIds.forEach(farmerId => {
      io.to(`user_${farmerId}`).emit('order_update', { type: 'created', order: populatedOrder });
    });
    if (order.deliveryPartner) {
      io.to(`user_${order.deliveryPartner}`).emit('order_update', { type: 'created', order: populatedOrder });
    }
    // API contract: success, message, order
    res.status(201).json({ success: true, message: "Order placed successfully", order });
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    next(error);
  } finally {
    session.endSession();
  }
});

/* ================= GET BUYER ORDERS ================= */
export const getBuyerOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ buyer: req.user.id })
    .populate("items.product", "name price category farmer location imageUrl")
    .sort({ createdAt: -1 });
  res.json({ success: true, orders });
});

/* ================= GET ORDER BY ID ================= */
export const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate("buyer", "name email phone")
    .populate("items.product", "name price category farmer location")
    .populate("deliveryPartner", "name phone");

  if (!order) throw new AppError("Order not found", 404);

  const isBuyer = order.buyer._id.toString() === req.user.id;
  const isDeliveryPartner = order.deliveryPartner?._id?.toString() === req.user.id;

  let isFarmer = false;
  if (!isBuyer && !isDeliveryPartner) {
    const farmerProducts = await Product.find({ farmer: req.user.id }).select("_id").lean();
    const farmerSet = new Set(farmerProducts.map((p) => p._id.toString()));
    isFarmer = order.items.some((i) => i.product && farmerSet.has(i.product._id.toString()));
  }

  if (!isBuyer && !isFarmer && !isDeliveryPartner) throw new AppError("Not authorized", 403);

  res.json(order);
});

/* ================= CANCEL ORDER (BUYER) ================= */
export const cancelOrder = asyncHandler(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const order = await Order.findById(req.params.id).session(session);

    if (!order) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.buyer.toString() !== req.user.id) {
      await session.abortTransaction();
      return res.status(403).json({ message: "Not authorized" });
    }

    const allowed = STATUS_TRANSITIONS[order.status];
    if (!allowed || !allowed.has("cancelled")) {
      await session.abortTransaction();
      return res.status(400).json({
        message: `Cannot cancel order in '${order.status}' status`,
      });
    }

    const { reason } = req.body || {};

    /* restore stock for each item — inside the transaction so partial restores
       are rolled back if any step fails (prevents permanent stock inconsistency) */
    for (const item of order.items) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { quantity: item.quantity }, $set: { isSoldOut: false } },
        { session }
      );
    }

    order.status = "cancelled";
    order.cancellationReason = reason || "Cancelled by buyer";
    order.cancelledBy = req.user.id;
    order.statusHistory.push({
      status: "cancelled",
      actor: req.user.id,
      note: reason || "Cancelled by buyer",
      timestamp: new Date(),
    });
    await order.save({ session });
    await session.commitTransaction();

    // Emit real-time events after successful commit
    const io = getIO();
    io.to(`user_${order.buyer}`).emit('order_update', { type: 'status_changed', order });
    const farmerIds = [...new Set(order.items
      .map(i => i.product?.farmer?.toString?.() || null)
      .filter(Boolean)
    )];
    farmerIds.forEach(farmerId => {
      io.to(`user_${farmerId}`).emit('order_update', { type: 'status_changed', order });
    });
    if (order.deliveryPartner) {
      io.to(`user_${order.deliveryPartner}`).emit('order_update', { type: 'status_changed', order });
    }

    res.json({ message: "Order cancelled successfully", order });
  } catch (error) {
    if (session.inTransaction()) await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
});

/* ================= REMOVE ITEM FROM ORDER (BUYER) ================= */
export const removeItemFromOrder = asyncHandler(async (req, res, next) => {
  const { id, productId } = req.params;
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const order = await Order.findById(id).session(session);
    if (!order) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.buyer.toString() !== req.user.id) {
      await session.abortTransaction();
      return res.status(403).json({ message: "Not authorized" });
    }

    if (order.status !== "placed") {
      await session.abortTransaction();
      return res.status(400).json({ message: "Can only edit orders in 'placed' status" });
    }

    const itemIndex = order.items.findIndex(i => i.product.toString() === productId);
    if (itemIndex === -1) {
      await session.abortTransaction();
      return res.status(404).json({ message: "Item not found in order" });
    }

    const item = order.items[itemIndex];

    // Restore stock
    await Product.findByIdAndUpdate(productId, {
      $inc: { quantity: item.quantity },
      $set: { isSoldOut: false }
    }, { session });

    // Remove item
    order.items.splice(itemIndex, 1);

    // If no items left, cancel order
    if (order.items.length === 0) {
      order.status = "cancelled";
      order.cancellationReason = "All items removed";
    }

    order.totalAmount = order.items.reduce((sum, i) => sum + i.quantity * i.priceAtPurchase, 0);
    order.statusHistory.push({
      status: order.status,
      actor: req.user.id,
      note: `Removed product ${productId}`,
      timestamp: new Date(),
    });

    await order.save({ session });
    await session.commitTransaction();

    res.json({ message: "Item removed", order });
  } catch (error) {
    if (session.inTransaction()) await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
});

export const acceptDelivery = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate("items.product");
  if (!order) throw new AppError("Order not found", 404);

  const itemsByFarmer = order.items.filter(item => item.product && item.product.farmer && item.product.farmer.toString() === req.user.id);
  if (itemsByFarmer.length === 0) throw new AppError("Unauthorized: None of your products are in this order", 403);

  order.deliveryAcceptedByFarmer = true;
  order.statusHistory.push({ status: order.status, actor: req.user.id, note: "Farmer accepted delivery fulfillment", timestamp: new Date() });
  await order.save();

  res.json({ success: true, message: "Delivery accepted", order });
});