import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { AppError } from "../utils/AppError.js";
import { createNotification } from "./notificationController.js";

/* ================= SUBMIT VERIFICATION (FARMER) ================= */
export const submitVerification = asyncHandler(async (req, res) => {
  const { documents, note } = req.body;

  if (!Array.isArray(documents) || documents.length === 0) {
    throw new AppError("At least one document URL is required", 400);
  }

  const user = await User.findById(req.user.id);
  if (!user) throw new AppError("User not found", 404);
  if (user.verificationStatus === "verified") throw new AppError("Already verified", 400);
  if (user.verificationStatus === "pending") throw new AppError("Verification already pending review", 400);

  user.verificationStatus = "pending";
  user.verificationDocs = documents;
  user.verificationNote = note || null;
  await user.save();

  res.json({ message: "Verification documents submitted", status: "pending" });
});

/* ================= GET MY VERIFICATION STATUS (FARMER) ================= */
export const getVerificationStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select(
    "verificationStatus verificationDocs verificationNote verifiedAt"
  );
  if (!user) throw new AppError("User not found", 404);

  res.json({
    status: user.verificationStatus,
    docs: user.verificationDocs,
    note: user.verificationNote,
    verifiedAt: user.verifiedAt,
  });
});

/* ================= LIST PENDING VERIFICATIONS (ADMIN) ================= */
export const listPendingVerifications = asyncHandler(async (req, res) => {
  const users = await User.find({ role: "farmer", verificationStatus: "pending" })
    .select("name email phone verificationDocs verificationNote createdAt")
    .sort({ createdAt: 1 });
  res.json(users);
});

/* ================= REVIEW VERIFICATION (ADMIN) ================= */
export const reviewVerification = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { decision, note } = req.body;

  if (!["verified", "rejected"].includes(decision)) {
    throw new AppError("Decision must be 'verified' or 'rejected'", 400);
  }

  const user = await User.findById(userId);
  if (!user) throw new AppError("User not found", 404);
  if (user.verificationStatus !== "pending") throw new AppError("User is not pending verification", 400);

  user.verificationStatus = decision;
  user.verificationNote = note || null;
  if (decision === "verified") user.verifiedAt = new Date();
  await user.save();

  await createNotification({
    recipient: user._id,
    type: "verification_update",
    title: decision === "verified" ? "Verification Approved ✅" : "Verification Rejected ❌",
    message: decision === "verified"
      ? "Your farmer profile has been verified!"
      : `Verification rejected${note ? `: ${note}` : "."}`,
  });

  res.json({
    message: `Farmer ${decision}`,
    user: { _id: user._id, name: user.name, verificationStatus: user.verificationStatus },
  });
});
