import { performance } from "node:perf_hooks";
import { logger } from "../utils/logger.js";

export const requestLogger = (req, res, next) => {
  const start = performance.now();

  res.on("finish", () => {
    const duration = Math.round(performance.now() - start);
    const logEntry = {
      level: "info",
      requestId: req.id,
      method: req.method,
      path: req.originalUrl,
      query: req.query,
      statusCode: res.statusCode,
      durationMs: duration,
      timestamp: new Date().toISOString(),
    };

    logger.info(`[${req.id}] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
  });

  next();
};
