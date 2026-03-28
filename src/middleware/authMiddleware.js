import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ message: "Not authorized, no token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch fresh user from DB so we always have up-to-date fields (blocked, role, etc.)
    const user = await User.findById(decoded.id).select("-password").lean();
    if (!user) {
      return res.status(401).json({ message: "User no longer exists" });
    }

    // Block suspended accounts from all protected routes
    if (user.blocked && req.path !== "/me") {
      return res.status(403).json({
        message: "Your account is suspended. Please contact support.",
      });
    }

    req.user = user; // full user object: { _id, name, email, role, blocked, ... }
    req.user.id = user._id.toString(); // backward-compat alias so all controllers work
    next();
  } catch (error) {
    res.status(401).json({ message: "Token failed or expired" });
  }
};
