import mongoose from "mongoose";

const subscriptionItemSchema = new mongoose.Schema(
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
  },
  { _id: false }
);

const subscriptionSchema = new mongoose.Schema(
  {
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: {
      type: [subscriptionItemSchema],
      required: true,
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: "Subscription must have at least one item.",
      },
    },
    frequency: {
      type: String,
      enum: ["daily", "weekly", "biweekly", "monthly"],
      required: true,
    },
    deliveryDay: {
      type: String,
      enum: [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ],
      default: null,
    },
    deliveryTimeSlot: { type: String, default: null },
    status: {
      type: String,
      enum: ["active", "paused", "cancelled"],
      default: "active",
    },
    nextDeliveryDate: { type: Date, default: null },
    lastOrderedAt: { type: Date, default: null },
    totalOrdersPlaced: { type: Number, default: 0 },
  },
  { timestamps: true }
);

subscriptionSchema.index({ buyer: 1, status: 1 });
subscriptionSchema.index({ status: 1, nextDeliveryDate: 1 });

export default mongoose.model("Subscription", subscriptionSchema);
