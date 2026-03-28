/**
 * Custom application error class.
 *
 * Carry an HTTP statusCode on the error so the global errorHandler can
 * respond with the correct status code without scattered `if (error.status)`
 * checks in every controller.
 *
 * Usage:
 *   throw new AppError("Product not found", 404);
 *   throw new AppError("Invalid credentials", 401);
 */
export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // distinguish from programming errors
    Error.captureStackTrace(this, this.constructor);
  }
}
