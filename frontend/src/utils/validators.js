/**
 * Client-side payload validators.
 * Each returns { valid: boolean, message?: string }.
 */

/** Validate "lng, lat" coordinate string */
export function validateCoordinates(str) {
  if (!str || typeof str !== "string") {
    return { valid: false, message: "Coordinates are required." };
  }
  const parts = str.split(",").map((s) => s.trim()).filter(Boolean);
  if (parts.length !== 2) {
    return { valid: false, message: "Use format: lng, lat (e.g. 77.59, 12.97)" };
  }
  const [lng, lat] = parts.map(Number);
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
    return { valid: false, message: "Coordinates must be valid numbers." };
  }
  if (lng < -180 || lng > 180) {
    return { valid: false, message: "Longitude must be between -180 and 180." };
  }
  if (lat < -90 || lat > 90) {
    return { valid: false, message: "Latitude must be between -90 and 90." };
  }
  return { valid: true };
}

/** Validate price (must be a positive finite number) */
export function validatePrice(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) {
    return { valid: false, message: "Price must be greater than 0." };
  }
  return { valid: true };
}

/** Validate quantity (must be a positive integer) */
export function validateQuantity(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0 || !Number.isInteger(n)) {
    return { valid: false, message: "Quantity must be a whole number greater than 0." };
  }
  return { valid: true };
}

/** Validate order items array — non-empty, each has productId + quantity > 0 */
export function validateOrderItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return { valid: false, message: "Cart is empty. Add items before ordering." };
  }
  for (const item of items) {
    if (!item.productId) {
      return { valid: false, message: "An item is missing a product reference." };
    }
    const q = Number(item.quantity);
    if (!Number.isFinite(q) || q <= 0) {
      return { valid: false, message: `Invalid quantity for "${item.name || "item"}".` };
    }
  }
  return { valid: true };
}

/** Validate rating (integer 1–5) */
export function validateRating(value) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1 || n > 5) {
    return { valid: false, message: "Rating must be between 1 and 5." };
  }
  return { valid: true };
}

/** Validate non-empty text field */
export function validateRequired(value, fieldName = "Field") {
  if (!value || (typeof value === "string" && !value.trim())) {
    return { valid: false, message: `${fieldName} is required.` };
  }
  return { valid: true };
}

/* ═══════════════════ Semantic Validators ═══════════════════ */

/**
 * Harvest date + freshness-expiry-days coherence.
 * expiryDate is derived: harvestDate + freshnessExpiryDays.
 * Returns { valid, warn?, message? }.
 *   - valid:false  → blocking error
 *   - warn:true    → soft warning (submission allowed)
 */
export function validateHarvestDate(harvestDate, freshnessExpiryDays) {
  if (!harvestDate) return { valid: true }; // not required at this layer

  const hd = new Date(harvestDate);
  if (isNaN(hd.getTime())) {
    return { valid: false, message: "Harvest date is not a valid date." };
  }

  const today = new Date();
  today.setHours(23, 59, 59, 999); // allow "today"
  if (hd > today) {
    return { valid: false, message: "Harvest date cannot be in the future." };
  }

  // If freshness window supplied, check the derived expiry isn't already past
  const days = Number(freshnessExpiryDays);
  if (Number.isFinite(days) && days > 0) {
    const expiry = new Date(hd);
    expiry.setDate(expiry.getDate() + days);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    if (expiry < now) {
      return {
        valid: true,
        warn: true,
        message: `Product is already past its ${days}-day freshness window.`,
      };
    }
  }

  return { valid: true };
}

/**
 * Freshness window sanity: ensure the window isn't excessively large.
 * Soft warning only.
 */
export function validateFreshnessWindow(harvestDate) {
  if (!harvestDate) return { valid: true };

  const hd = new Date(harvestDate);
  if (isNaN(hd.getTime())) return { valid: true };

  const now = new Date();
  const diffMs = now - hd;
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffDays > 7) {
    return {
      valid: true,
      warn: true,
      message: `Harvested ${diffDays} days ago — product may no longer be fresh.`,
    };
  }
  return { valid: true };
}

/**
 * Cart-vs-stock check.
 * productMap: Map<productId, { name, quantity }> or an array of products.
 */
export function validateCartStock(cartItems, productMap) {
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    return { valid: true }; // empty cart handled by validateOrderItems
  }

  // Accept array → convert to Map
  const map =
    productMap instanceof Map
      ? productMap
      : new Map((productMap || []).map((p) => [p._id, p]));

  const issues = [];
  for (const item of cartItems) {
    const product = map.get(item.productId);
    if (!product) continue; // product not in current view — skip
    if (item.quantity > product.quantity) {
      issues.push(
        `"${item.name || "Item"}" has only ${product.quantity} in stock (you selected ${item.quantity}).`
      );
    }
  }

  if (issues.length > 0) {
    return { valid: false, message: issues.join(" ") };
  }
  return { valid: true };
}

/**
 * Subscription schedule: weekly frequency should ideally include a delivery day.
 * Soft warning (non-blocking).
 */
export function validateSubscriptionSchedule(frequency, deliveryDay) {
  if (frequency === "weekly" && !deliveryDay) {
    return {
      valid: true,
      warn: true,
      message: "Weekly subscriptions default to Monday delivery. Choose a day if preferred.",
    };
  }
  return { valid: true };
}

/**
 * India bounding box soft-check (approx).
 * lng: 68–97, lat: 6–37.
 * Returns warn:true if outside.
 */
export function validateProductGeoBounds(lng, lat) {
  const lo = Number(lng);
  const la = Number(lat);
  if (!Number.isFinite(lo) || !Number.isFinite(la)) return { valid: true };

  if (lo < 68 || lo > 97 || la < 6 || la > 37) {
    return {
      valid: true,
      warn: true,
      message: "Coordinates appear to be outside India. Please double-check.",
    };
  }
  return { valid: true };
}

/* ═══════════════════ Predictive / Contextual Validators ═══════════════════ */

/** Category → typical max freshness days */
const CATEGORY_FRESHNESS_DAYS = {
  milk: 1,
  eggs: 3,
  fruits: 5,
  vegetables: 4,
  other: 7,
};

/**
 * Warn buyer if product is expiring within `thresholdHrs` hours.
 * Uses harvestDate + freshnessExpiryDays to compute an expiry timestamp.
 * Returns { valid, warn?, message? }.
 */
export function validateProductExpiry(product, thresholdHrs = 2) {
  if (!product) return { valid: true };

  const hd = product.harvestDate ? new Date(product.harvestDate) : null;
  const days = Number(product.freshnessExpiryDays);

  if (!hd || isNaN(hd.getTime()) || !Number.isFinite(days) || days <= 0) {
    return { valid: true }; // not enough info — allow
  }

  const expiryMs = hd.getTime() + days * 86_400_000;
  const nowMs = Date.now();
  const remainingHrs = (expiryMs - nowMs) / 3_600_000;

  if (remainingHrs <= 0) {
    return {
      valid: true,
      warn: true,
      message: "This product has passed its freshness window. Order at your own discretion.",
    };
  }
  if (remainingHrs <= thresholdHrs) {
    const mins = Math.max(1, Math.round(remainingHrs * 60));
    return {
      valid: true,
      warn: true,
      message: `Freshness expires in ~${mins < 60 ? `${mins} min` : `${Math.round(remainingHrs)}h`}. Consider ordering quickly.`,
    };
  }
  return { valid: true };
}

/**
 * Haversine distance (km) between two [lng, lat] coordinate pairs.
 */
function haversineKm(lng1, lat1, lng2, lat2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Block order if buyer is outside delivery radius.
 * buyerCoords / productCoords: [lng, lat] arrays or { lng, lat } objects.
 * maxRadiusKm defaults to 50 km.
 */
export function validateDeliveryRadius(buyerCoords, productCoords, maxRadiusKm = 50) {
  if (!buyerCoords || !productCoords) return { valid: true }; // no geo data — skip

  const bLng = Number(Array.isArray(buyerCoords) ? buyerCoords[0] : buyerCoords.lng);
  const bLat = Number(Array.isArray(buyerCoords) ? buyerCoords[1] : buyerCoords.lat);
  const pLng = Number(Array.isArray(productCoords) ? productCoords[0] : productCoords.lng);
  const pLat = Number(Array.isArray(productCoords) ? productCoords[1] : productCoords.lat);

  if ([bLng, bLat, pLng, pLat].some((n) => !Number.isFinite(n))) {
    return { valid: true }; // incomplete data — skip
  }

  const dist = haversineKm(bLng, bLat, pLng, pLat);
  const distRound = Math.round(dist);

  if (dist > maxRadiusKm) {
    return {
      valid: false,
      message: `Farm is ${distRound} km away — outside the ${maxRadiusKm} km delivery radius.`,
    };
  }
  if (dist > maxRadiusKm * 0.8) {
    return {
      valid: true,
      warn: true,
      message: `Farm is ${distRound} km away — near the delivery limit (${maxRadiusKm} km).`,
    };
  }
  return { valid: true };
}

/**
 * Subscription frequency must align with the product's freshness window.
 * e.g. milk (1-day shelf life) can't be delivered monthly.
 */
export function validateSubscriptionFeasibility(product, frequency) {
  if (!product || !frequency) return { valid: true };

  const days = Number(product.freshnessExpiryDays);
  if (!Number.isFinite(days) || days <= 0) return { valid: true };

  const freqDays = { daily: 1, weekly: 7, biweekly: 14, monthly: 30 };
  const interval = freqDays[frequency];
  if (!interval) return { valid: true };

  if (interval > days) {
    return {
      valid: false,
      message: `This product stays fresh for ${days} day${days > 1 ? "s" : ""} — "${frequency}" delivery would arrive after it expires.`,
    };
  }
  if (interval === days) {
    return {
      valid: true,
      warn: true,
      message: `Product freshness (${days}d) barely covers the "${frequency}" interval. Consider a shorter frequency.`,
    };
  }
  return { valid: true };
}

/**
 * Category-aware freshness hint for farmers.
 * Soft warning if freshnessExpiryDays exceeds typical window for the category.
 */
export function validateCategoryFreshness(category, harvestDate, freshnessExpiryDays) {
  const typicalDays = CATEGORY_FRESHNESS_DAYS[category];
  if (!typicalDays) return { valid: true };

  const days = Number(freshnessExpiryDays);
  if (!Number.isFinite(days) || days <= 0) return { valid: true };

  if (days > typicalDays * 2) {
    return {
      valid: true,
      warn: true,
      message: `${days}-day freshness window seems long for ${category} (typical: ${typicalDays} day${typicalDays > 1 ? "s" : ""}). Consider reducing.`,
    };
  }

  // Also check if harvest date implies the product won't survive the claimed window
  if (harvestDate) {
    const hd = new Date(harvestDate);
    if (!isNaN(hd.getTime())) {
      const elapsed = Math.floor((Date.now() - hd.getTime()) / 86_400_000);
      const remaining = days - elapsed;
      if (remaining <= 0) {
        return {
          valid: true,
          warn: true,
          message: `Already ${elapsed} day${elapsed > 1 ? "s" : ""} since harvest — ${category} may no longer be at peak freshness.`,
        };
      }
    }
  }

  return { valid: true };
}

/* ═══════════════════ Systemic Validators ═══════════════════ */

/** Seasonal produce → months when typically available (1-indexed). */
const SEASONAL_PRODUCE = {
  mango:       [3, 4, 5, 6, 7],
  watermelon:  [3, 4, 5, 6],
  strawberry:  [11, 12, 1, 2],
  litchi:      [5, 6, 7],
  cherry:      [5, 6, 7],
  orange:      [11, 12, 1, 2, 3],
  pomegranate: [9, 10, 11, 12, 1, 2],
  grapes:      [1, 2, 3, 4],
  jackfruit:   [4, 5, 6, 7, 8],
  guava:       [8, 9, 10, 11, 12, 1],
  peas:        [10, 11, 12, 1, 2],
  corn:        [6, 7, 8, 9],
  pumpkin:     [9, 10, 11],
};

/**
 * Warn buyer if cart products come from farms spread > 30 km apart.
 * products: array of product objects that have location.coordinates [lng, lat].
 * Returns { valid, warn?, message? }.
 */
export function validateOrderClusterFeasibility(products) {
  if (!Array.isArray(products) || products.length < 2) return { valid: true };

  const located = products.filter(
    (p) => p.location?.coordinates?.length === 2,
  );
  if (located.length < 2) return { valid: true };

  let maxSpan = 0;
  for (let i = 0; i < located.length; i++) {
    for (let j = i + 1; j < located.length; j++) {
      const [lng1, lat1] = located[i].location.coordinates;
      const [lng2, lat2] = located[j].location.coordinates;
      const d = haversineKm(lng1, lat1, lng2, lat2);
      if (d > maxSpan) maxSpan = d;
    }
  }

  if (maxSpan > 30) {
    return {
      valid: true,
      warn: true,
      message: `Farms in your cart span ${Math.round(maxSpan)} km apart — delivery may be split into multiple trips.`,
    };
  }
  return { valid: true };
}

/**
 * Block order if product will expire before estimated delivery.
 * etaMinutes: estimated delivery time in minutes (default 60).
 */
export function validateDeliveryEtaExpiry(product, etaMinutes = 60) {
  if (!product) return { valid: true };

  const hd = product.harvestDate ? new Date(product.harvestDate) : null;
  const days = Number(product.freshnessExpiryDays);

  if (!hd || isNaN(hd.getTime()) || !Number.isFinite(days) || days <= 0) {
    return { valid: true };
  }

  const expiryMs = hd.getTime() + days * 86_400_000;
  const arrivalMs = Date.now() + etaMinutes * 60_000;

  if (expiryMs <= arrivalMs) {
    return {
      valid: false,
      message: `Product will expire before delivery (~${etaMinutes} min ETA). Order cannot proceed.`,
    };
  }

  // warn if expiry within 30 min of arrival
  if (expiryMs <= arrivalMs + 30 * 60_000) {
    return {
      valid: true,
      warn: true,
      message: "Product expires very close to estimated delivery time. Freshness not guaranteed.",
    };
  }
  return { valid: true };
}

/**
 * Seasonal availability hint for produce.
 * category: product category string.
 * month: 1-indexed month (defaults to current month).
 * productName: product name used for seasonal produce lookup.
 */
export function validateSeasonalAvailability(category, month, productName) {
  const m = month || new Date().getMonth() + 1;

  // Non-produce categories are always available
  if (category && !["fruits", "vegetables"].includes(category.toLowerCase())) {
    return { valid: true };
  }

  // Check specific produce by name
  if (productName) {
    const key = productName.toLowerCase().trim();
    for (const [produce, months] of Object.entries(SEASONAL_PRODUCE)) {
      if (key.includes(produce)) {
        if (!months.includes(m)) {
          const names = months.map((n) =>
            new Date(2000, n - 1).toLocaleString("default", { month: "short" }),
          );
          return {
            valid: true,
            warn: true,
            message: `${produce.charAt(0).toUpperCase() + produce.slice(1)} is typically in season ${names[0]}–${names[names.length - 1]}. Availability may be limited now.`,
          };
        }
        return { valid: true, hint: "🌿 In season — peak availability!" };
      }
    }
  }

  return { valid: true };
}

/* ═══════════════════ Cart Intelligence Metrics ═══════════════════ */

/**
 * Compute an aggregate freshness score for the cart (0–100).
 * Based on the *nearest* expiry among all cart products.
 *   100  = all items have > 90 % of their freshness window remaining
 *     0  = at least one item is already expired
 * cartProducts: resolved product objects for current cart items.
 */
export function computeCartFreshnessScore(cartProducts) {
  if (!Array.isArray(cartProducts) || cartProducts.length === 0) {
    return { score: 100, label: "N/A", color: "gray", explain: "" };
  }

  let worstRatio = 1; // 1 = full freshness remaining
  let worstName = "";
  let worstHrs = null;

  for (const p of cartProducts) {
    const hd = p.harvestDate ? new Date(p.harvestDate) : null;
    const days = Number(p.freshnessExpiryDays);
    if (!hd || isNaN(hd.getTime()) || !Number.isFinite(days) || days <= 0) continue;

    const windowMs = days * 86_400_000;
    const elapsed = Date.now() - hd.getTime();
    const ratio = Math.max(0, 1 - elapsed / windowMs);
    if (ratio < worstRatio) {
      worstRatio = ratio;
      worstName = p.name || "Item";
      const remainMs = Math.max(0, windowMs - elapsed);
      worstHrs = Math.round((remainMs / 3_600_000) * 10) / 10;
    }
  }

  const score = Math.round(worstRatio * 100);
  let label, color;
  if (score >= 70)      { label = "Fresh";   color = "green";  }
  else if (score >= 40) { label = "OK";      color = "yellow"; }
  else if (score > 0)   { label = "Aging";   color = "orange"; }
  else                  { label = "Expired"; color = "red";    }

  let explain;
  if (worstHrs != null && worstHrs > 24) {
    explain = "All items fresh for >24h";
  } else if (worstName) {
    explain = `Lowest freshness: ${worstName} (${worstHrs}h left)`;
  } else {
    explain = "";
  }

  return { score, label, color, explain };
}

/**
 * Compute delivery complexity (1–5 scale) based on farm spread.
 * 1 = single source, 5 = farms > 60 km apart.
 * cartProducts: resolved product objects.
 * buyerCoords: [lng, lat] or null.
 */
export function computeCartDeliveryComplexity(cartProducts, buyerCoords) {
  if (!Array.isArray(cartProducts) || cartProducts.length === 0) {
    return { level: 1, label: "Simple", color: "green", explain: "" };
  }

  const located = cartProducts.filter(
    (p) => p.location?.coordinates?.length === 2,
  );
  if (located.length <= 1) {
    return { level: 1, label: "Simple", color: "green", explain: "Single pickup" };
  }

  // Compute max pair-wise farm distance
  let maxSpan = 0;
  for (let i = 0; i < located.length; i++) {
    for (let j = i + 1; j < located.length; j++) {
      const [lng1, lat1] = located[i].location.coordinates;
      const [lng2, lat2] = located[j].location.coordinates;
      const d = haversineKm(lng1, lat1, lng2, lat2);
      if (d > maxSpan) maxSpan = d;
    }
  }

  // Factor in unique farm count
  const uniqueFarms = new Set(located.map((p) => String(p.farmer?._id || p.farmer)));
  const farmCount = uniqueFarms.size;

  // Composite: distance-based level + farm-count bump
  let level;
  if (maxSpan <= 5)       level = 1;
  else if (maxSpan <= 15) level = 2;
  else if (maxSpan <= 30) level = 3;
  else if (maxSpan <= 60) level = 4;
  else                    level = 5;

  // Bump by 1 if many farms
  if (farmCount >= 4 && level < 5) level += 1;

  const labels = ["Simple", "Easy", "Moderate", "Complex", "Very Complex"];
  const colors = ["green", "green", "yellow", "orange", "red"];

  const explain = farmCount === 1
    ? "Single farm delivery"
    : `${farmCount} farm${farmCount !== 1 ? "s" : ""} across ${Math.round(maxSpan)} km`;

  return { level, label: labels[level - 1], color: colors[level - 1], explain };
}

/**
 * Compute expiry risk for the cart: how close is the nearest expiry to now + ETA?
 * Returns a risk label and hours remaining.
 * cartProducts: resolved product objects.
 */
export function computeCartExpiryRisk(cartProducts) {
  if (!Array.isArray(cartProducts) || cartProducts.length === 0) {
    return { hoursLeft: null, label: "None", color: "green", explain: "" };
  }

  let soonestHrs = Infinity;
  let soonestName = "";

  for (const p of cartProducts) {
    const hd = p.harvestDate ? new Date(p.harvestDate) : null;
    const days = Number(p.freshnessExpiryDays);
    if (!hd || isNaN(hd.getTime()) || !Number.isFinite(days) || days <= 0) continue;

    const expiryMs = hd.getTime() + days * 86_400_000;
    const remainingHrs = (expiryMs - Date.now()) / 3_600_000;
    if (remainingHrs < soonestHrs) {
      soonestHrs = remainingHrs;
      soonestName = p.name || "Item";
    }
  }

  if (!Number.isFinite(soonestHrs)) {
    return { hoursLeft: null, label: "N/A", color: "gray", explain: "" };
  }

  const hoursLeft = Math.round(soonestHrs * 10) / 10; // 1 decimal
  let label, color;
  if (hoursLeft <= 0)      { label = "Expired"; color = "red";    }
  else if (hoursLeft <= 2) { label = "Critical"; color = "red";   }
  else if (hoursLeft <= 6) { label = "Soon";    color = "orange"; }
  else if (hoursLeft <= 24){ label = "Today";   color = "yellow"; }
  else                     { label = "Safe";    color = "green";  }

  let explain;
  if (hoursLeft > 12) {
    explain = "No near-term expiry risk";
  } else if (hoursLeft <= 0) {
    explain = `${soonestName} already expired`;
  } else {
    explain = `${soonestName} expires in ${hoursLeft}h`;
  }

  return { hoursLeft, label, color, explain };
}
