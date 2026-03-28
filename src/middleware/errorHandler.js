import { logger } from "../utils/logger.js";
import { AppError } from "../utils/AppError.js";

export const errorHandler = (err, req, res, next) => {
  // Determine status: AppError carries its own code, otherwise fall back
  const statusCode = err.statusCode || (res.statusCode >= 400 ? res.statusCode : 500);

  const payload = {
    success: false,
    message: err.message || "Internal Server Error",
    requestId: req.id,
  };

  if (process.env.NODE_ENV === "development") {
    payload.stack = err.stack;
  }

  // Only log unexpected (non-operational) errors as errors; log operational ones as warnings
  if (err instanceof AppError && err.isOperational) {
    logger.warn(err.message, {
      requestId: req.id,
      path: req.originalUrl,
      method: req.method,
      statusCode,
    });
  } else {
    logger.error(err.message, {
      requestId: req.id,
      path: req.originalUrl,
      method: req.method,
      statusCode,
      stack: err.stack,
    });
  }

  res.status(statusCode).json(payload);
};
