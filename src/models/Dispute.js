import mongoose from "mongoose";

const disputeMessageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const disputeSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    raisedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    against: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reason: {
      type: String,
      enum: [
        "quality_issue",
        "wrong_item",
        "missing_item",
        "late_delivery",
        "not_delivered",
        "other",
      ],
      required: true,
    },
    description: { type: String, required: true, maxlength: 1000 },
    status: {
      type: String,
      enum: ["open", "under_review", "resolved", "closed"],
      default: "open",
    },
    resolution: { type: String, default: null },
    messages: { type: [disputeMessageSchema], default: [] },
  },
  { timestamps: true }
);

disputeSchema.index({ order: 1 });
disputeSchema.index({ raisedBy: 1, createdAt: -1 });
disputeSchema.index({ status: 1 });

export default mongoose.model("Dispute", disputeSchema);
