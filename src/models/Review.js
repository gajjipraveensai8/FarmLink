import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      default: null,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      maxlength: 500,
      default: "",
    },
    farmerReply: {
      type: String,
      maxlength: 300,
      default: null,
    },
    farmerRepliedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

/* one review per order per buyer */
reviewSchema.index({ order: 1, buyer: 1 }, { unique: true });
reviewSchema.index({ farmer: 1, createdAt: -1 });
reviewSchema.index({ product: 1 });

export default mongoose.model("Review", reviewSchema);
