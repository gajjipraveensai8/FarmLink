import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    name: {
      type: String,
      required: true,
    },


    price: {
      type: Number,
      required: true,
      min: 0,
    },

    quantity: {
      type: Number,
      required: true,
      min: 0,
    },

    category: {
      type: String,
      enum: ["fruits", "vegetables", "milk", "eggs", "other"],
      default: "vegetables",
    },

    harvestDate: {
      type: Date,
      required: true,
    },

    freshnessExpiryDays: {
      type: Number,
      default: 2,
    },

    isExpired: {
      type: Boolean,
      default: false,
    },

    // 🔥 PRO LEVEL LOCATION (GeoJSON)
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },

    isSoldOut: {
      type: Boolean,
      default: false,
    },

    /* ── product image ── */
    imageUrl: { type: String, default: null },
  },
  { timestamps: true }
);

// 🔥 Needed for radius queries later
productSchema.index({ location: "2dsphere" });
productSchema.index({ harvestDate: -1 });
productSchema.index({ name: "text", category: "text" });
productSchema.index({ farmer: 1 });   // getFarmerOrders queries by farmer

// 🔥 Compound Index for heavily filtered Marketplace queries to prevent COLLSCAN
productSchema.index({ isExpired: 1, isSoldOut: 1, quantity: 1, category: 1 });

export default mongoose.model("Product", productSchema);