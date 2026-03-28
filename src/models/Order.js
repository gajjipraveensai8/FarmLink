import mongoose from "mongoose";

/* ── sub-schemas ── */

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    priceAtPurchase: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const statusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    note: { type: String, default: "" },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

/* ── all valid statuses ── */
const ORDER_STATUSES = [
  "placed",
  "accepted",
  "rejected",
  "packed",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "disputed",
];

const orderSchema = new mongoose.Schema(
  {
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: "Order must contain at least one item.",
      },
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: "placed",
    },

    /* ── lifecycle history ── */
    statusHistory: {
      type: [statusHistorySchema],
      default: [],
    },

    /* ── cancellation ── */
    cancellationReason: { type: String, default: null },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    /* ── rejection ── */
    rejectionReason: { type: String, default: null },

    /* ── delivery / logistics ── */
    deliveryType: {
      type: String,
      enum: ["pickup", "delivery"],
      default: "pickup",
    },
    /** Who handles fulfilment — set by farmer at accept time */
    farmerFulfillmentType: {
      type: String,
      enum: ["buyer_pickup", "farmer_deliver", "agent_deliver"],
      default: null,
    },
    deliveryAcceptedByFarmer: { type: Boolean, default: false },
    deliveryFee: { type: Number, default: 0 },
    deliveryTimeSlot: { type: String, default: null },
    deliveryPartner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    deliveryNotes: { type: String, default: null },
    /** Buyer's delivery address — auto-populated from buyer's profile */
    deliveryAddress: { type: String, default: null },
    /** Farmer's pickup address — auto-populated from farmer's profile */
    pickupAddress: { type: String, default: null },
  },
  { timestamps: true }
);

/* ── indexes ── */
orderSchema.index({ buyer: 1, createdAt: -1 });
orderSchema.index({ "items.product": 1 }); // fast lookup for farmer-order queries
orderSchema.index({ status: 1 });
orderSchema.index({ deliveryPartner: 1 });

/* ── status transition map ── */
export const STATUS_TRANSITIONS = {
  placed: new Set(["accepted", "rejected", "cancelled"]),
  accepted: new Set(["packed", "cancelled"]),
  packed: new Set(["out_for_delivery", "delivered", "cancelled"]),
  out_for_delivery: new Set(["delivered"]),
  delivered: new Set(["disputed"]),
  rejected: new Set(),
  cancelled: new Set(),
  disputed: new Set(["delivered", "cancelled"]),
};

export { ORDER_STATUSES };
export default mongoose.model("Order", orderSchema);