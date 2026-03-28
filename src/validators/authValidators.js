import { body, validationResult } from "express-validator";

/* ── Reusable middleware to send 400 if any validators failed ── */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const firstError = errors.array()[0];
    return res.status(400).json({
      success: false,
      message: firstError.msg,
      errors: errors.array(),
    });
  }
  next();
};

/* ── Register validator chain ── */
export const registerValidator = [
  body("name")
    .trim()
    .isLength({ min: 2 })
    .withMessage("Name is required (min 2 characters)"),

  body("email")
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage("A valid email is required"),

  body("phone")
    .trim()
    .isLength({ min: 6 })
    .withMessage("A valid phone number is required (min 6 digits)"),

  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),

  body("role")
    .isIn(["farmer", "buyer", "delivery_partner"])
    .withMessage("Role must be 'farmer', 'buyer', or 'delivery_partner'"),

  handleValidationErrors,
];

/* ── Login validator chain ── */
export const loginValidator = [
  body("email")
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage("A valid email is required"),

  body("password")
    .notEmpty()
    .withMessage("Password is required"),

  handleValidationErrors,
];
