import express from "express";
import { registerUser, loginUser, getMe, logoutUser } from "../controllers/authController.js";
import { registerValidator, loginValidator } from "../validators/authValidators.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// handleValidationErrors is now the last item in each validator array
router.post("/register", registerValidator, registerUser);
router.post("/login", loginValidator, loginUser);
router.post("/logout", logoutUser);
router.get("/me", protect, getMe);

export default router;