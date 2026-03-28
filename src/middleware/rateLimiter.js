const WINDOW_MS = 60 * 1000;
const MAX_TOKENS = 60;
const MAX_TRACKED_IPS = 10_000;
const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes

const requestsMap = new Map();

/* ── periodic sweep of expired windows to prevent memory leak ── */
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of requestsMap) {
    if (now - record.windowStart > WINDOW_MS) {
      requestsMap.delete(ip);
    }
  }
}, CLEANUP_INTERVAL);

export const rateLimiter = (req, res, next) => {
  const ip = req.ip || req.connection?.remoteAddress || "unknown";
  const now = Date.now();

  /* hard cap: drop oldest entry if map grows too large */
  if (requestsMap.size >= MAX_TRACKED_IPS && !requestsMap.has(ip)) {
    const firstKey = requestsMap.keys().next().value;
    requestsMap.delete(firstKey);
  }

  const clientRecord = requestsMap.get(ip) || {
    tokensUsed: 0,
    windowStart: now,
  };

  if (now - clientRecord.windowStart > WINDOW_MS) {
    clientRecord.tokensUsed = 0;
    clientRecord.windowStart = now;
  }

  const weight = res.locals.cacheHit === true ? 0.2 : 1;
  clientRecord.tokensUsed += weight;
  requestsMap.set(ip, clientRecord);

  if (clientRecord.tokensUsed > MAX_TOKENS) {
    const warning = {
      level: "warn",
      requestId: req.id,
      ip,
      tokensUsed: clientRecord.tokensUsed,
      route: req.originalUrl,
      reason: "adaptive_rate_limit",
      timestamp: new Date().toISOString(),
    };
    console.warn(JSON.stringify(warning));

    return res.status(429).json({
      success: false,
      message: "Too many requests",
      requestId: req.id,
    });
  }

  next();
};
