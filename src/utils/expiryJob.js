import Product from "../models/Product.js";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export const runExpiryJob = async () => {
  const now = new Date();

  await Product.updateMany(
    {
      isExpired: false,
      freshnessExpiryDays: { $gt: 0 },
      $expr: {
        $gte: [
          {
            $divide: [{ $subtract: [now, "$harvestDate"] }, MS_PER_DAY],
          },
          "$freshnessExpiryDays",
        ],
      },
    },
    { $set: { isExpired: true } }
  );
};
