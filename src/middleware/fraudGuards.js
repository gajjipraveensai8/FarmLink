/**
 * Fraud-prevention middleware — guards for unreasonable values.
 * Attach BEFORE controller handlers on relevant routes.
 */

/* ── Product creation / update guards ── */
export const validateProduct = (req, res, next) => {
  const { price, quantity, freshnessExpiryDays, coordinates, harvestDate } =
    req.body;

  /* price must be positive and reasonable */
  if (price !== undefined) {
    const p = Number(price);
    if (!Number.isFinite(p) || p <= 0) {
      return res.status(400).json({ message: "Price must be a positive number." });
    }
    if (p > 100_000) {
      return res
        .status(400)
        .json({ message: "Price exceeds maximum allowed (₹1,00,000)." });
    }
  }

  /* quantity must be reasonable */
  if (quantity !== undefined) {
    const q = Number(quantity);
    if (!Number.isFinite(q) || q < 0 || !Number.isInteger(q)) {
      return res
        .status(400)
        .json({ message: "Quantity must be a non-negative integer." });
    }
    if (q > 100_000) {
      return res
        .status(400)
        .json({ message: "Quantity exceeds maximum allowed (100,000)." });
    }
  }

  /* freshness expiry must be reasonable */
  if (freshnessExpiryDays !== undefined) {
    const f = Number(freshnessExpiryDays);
    if (!Number.isFinite(f) || f < 1 || f > 365) {
      return res
        .status(400)
        .json({ message: "Freshness expiry must be between 1 and 365 days." });
    }
  }

  /* coordinates must be valid geo */
  if (coordinates !== undefined) {
    if (!Array.isArray(coordinates) || coordinates.length !== 2) {
      return res
        .status(400)
        .json({ message: "coordinates must be [lng, lat] array." });
    }
    const [lng, lat] = coordinates.map(Number);
    if (
      !Number.isFinite(lng) ||
      !Number.isFinite(lat) ||
      lng < -180 ||
      lng > 180 ||
      lat < -90 ||
      lat > 90
    ) {
      return res
        .status(400)
        .json({ message: "Coordinates out of valid range." });
    }
  }

  /* harvest date cannot be in the far future */
  if (harvestDate !== undefined) {
    const h = new Date(harvestDate);
    if (isNaN(h.getTime())) {
      return res.status(400).json({ message: "Invalid harvest date." });
    }
    const maxFuture = new Date();
    maxFuture.setDate(maxFuture.getDate() + 7); // allow up to 7 days in future
    if (h > maxFuture) {
      return res
        .status(400)
        .json({ message: "Harvest date cannot be more than 7 days in the future." });
    }
  }

  next();
};

/* ── Order placement guards ── */
export const validateOrder = (req, res, next) => {
  const { items } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res
      .status(400)
      .json({ message: "Items array is required and must not be empty." });
  }

  if (items.length > 50) {
    return res.status(400).json({ message: "Maximum 50 items per order." });
  }

  for (const item of items) {
    if (!item.productId || typeof item.productId !== "string") {
      return res
        .status(400)
        .json({ message: "Each item must have a valid productId." });
    }
    if (!Number.isInteger(item.quantity) || item.quantity < 1) {
      return res
        .status(400)
        .json({ message: "Each item must have a positive integer quantity." });
    }
    if (item.quantity > 10_000) {
      return res.status(400).json({
        message: "Single item quantity cannot exceed 10,000.",
      });
    }
  }

  /* detect duplicate product IDs in same order */
  const ids = items.map((i) => i.productId);
  if (new Set(ids).size !== ids.length) {
    return res
      .status(400)
      .json({ message: "Duplicate product IDs in order." });
  }

  next();
};
