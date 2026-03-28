import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["farmer", "buyer", "delivery_partner", "admin"],
      required: true,
    },

    /* ── farmer verification (Module 3) ── */
    verificationStatus: {
      type: String,
      enum: ["unverified", "pending", "verified", "rejected"],
      default: "unverified",
    },
    verificationDocs: {
      type: [String], // URLs or file references
      default: [],
    },
    verificationNote: { type: String, default: null },
    verifiedAt: { type: Date, default: null },

    /* ── profile extras ── */
    avatar: { type: String, default: null },
    address: { type: String, default: null },
    bio: { type: String, default: null },

    // Admin block/unblock
    blocked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);