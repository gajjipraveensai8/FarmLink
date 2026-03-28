// src/middleware/adminMiddleware.js
import User from "../models/User.js";

export default function adminMiddleware(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}
