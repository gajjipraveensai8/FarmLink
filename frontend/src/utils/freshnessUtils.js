export const calculateFreshnessDays = (harvestDate) => {
  if (!harvestDate) return 0;
  const today = new Date();
  const harvest = new Date(harvestDate);
  const diffMs = today - harvest;
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
};

export const getFreshnessStatus = (days) => {
  if (days <= 1) return "Fresh";
  if (days <= 3) return "2-3 Days Old";
  if (days <= 5) return "4-5 Days Old";
  return "Old";
};

const CATEGORY_LIMITS = {
  vegetables: 3,
  fruits: 5,
  milk: 2,
  eggs: 7,
};

export const shouldExpireProduct = (days, category = "vegetables") => {
  const limit = CATEGORY_LIMITS[category.toLowerCase()] ?? 3;
  return days >= limit;
};
