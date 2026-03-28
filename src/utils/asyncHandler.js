/**
 * Wraps an async Express route handler so any rejected promise is forwarded
 * to the next() error handler automatically.
 *
 * Usage:
 *   export const myController = asyncHandler(async (req, res) => { ... });
 *
 * This eliminates the need for repetitive try/catch blocks in every controller.
 */
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
