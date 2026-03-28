import productRepository from "../repositories/productRepository.js";

class ProductService {
  async addProduct(farmerId, data) {
    const { name, price, quantity, harvestDate, coordinates, category, freshnessExpiryDays, imageUrl } = data;

    if (!name || price === undefined || quantity === undefined || !harvestDate || !coordinates || !category || freshnessExpiryDays === undefined) {
      throw Object.assign(new Error("Missing required fields"), { status: 400 });
    }

    return await productRepository.create({
      farmer: farmerId,
      name,
      price: Number(price),
      quantity: Number(quantity),
      harvestDate,
      category: String(category).toLowerCase(),
      freshnessExpiryDays: Number(freshnessExpiryDays),
      location: { type: "Point", coordinates: coordinates.map(Number) },
      isSoldOut: Number(quantity) === 0,
      imageUrl: imageUrl || null,
    });
  }

  async getProducts(filters) {
    const { lng, lat, radius, limit, page, sort, q, minPrice, maxPrice, category, freshness } = filters;

    const useGeo = lng && lat && lng !== 'null' && lat !== 'null';
    const parsedRadius = Math.min(Number(radius) || 50, 50); // Enforce 50km limit
    const radiusInMeters = useGeo ? parsedRadius * 1000 : null;

    const limitValue = Math.min(Math.max(parseInt(limit ?? "24", 10) || 24, 1), 100);
    const skipValue = (Math.max(parseInt(page ?? "1", 10) || 1, 1) - 1) * limitValue;

    const sortOptions = {
      freshest: { harvestDate: -1 },
      price_low: { price: 1 },
      price_high: { price: -1 },
      nearest: { distanceInMeters: 1 }
    };
    const chosenSort = sortOptions[sort] || sortOptions.freshest;

    const pipeline = [];

    if (useGeo) {
      pipeline.push({
        $geoNear: {
          near: { type: "Point", coordinates: [Number(lng), Number(lat)] },
          distanceField: "distanceInMeters",
          maxDistance: radiusInMeters,
          spherical: true,
          query: { isExpired: false, isSoldOut: false, quantity: { $gt: 0 } }
        }
      });
    }

    const matchStage = { isExpired: false, isSoldOut: false, quantity: { $gt: 0 } };
    if (q) matchStage.name = { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
    if (minPrice || maxPrice) {
      matchStage.price = {};
      if (minPrice) matchStage.price.$gte = Number(minPrice);
      if (maxPrice) matchStage.price.$lte = Number(maxPrice);
    }
    if (category && category !== 'all') matchStage.category = { $regex: `^${category}$`, $options: "i" };

    if (!useGeo) pipeline.push({ $match: matchStage });
    else pipeline.push({ $match: { ...matchStage } }); 

    pipeline.push({
      $addFields: {
        freshnessDays: {
          $max: [0, { $floor: { $divide: [{ $subtract: [new Date(), "$harvestDate"] }, 86400000] } }]
        }
      }
    });

    if (freshness === "fresh") pipeline.push({ $match: { freshnessDays: { $lte: 1 } } });

    pipeline.push({
      $lookup: { from: "users", localField: "farmer", foreignField: "_id", as: "farmer" }
    });
    pipeline.push({ $unwind: { path: "$farmer", preserveNullAndEmptyArrays: true } });

    /* hide products from suspended farmers */
    pipeline.push({ $match: { $or: [{ "farmer.blocked": { $ne: true } }, { farmer: null }] } });

    /* inline rating aggregation */
    pipeline.push({
      $lookup: {
        from: "reviews",
        localField: "farmer._id",
        foreignField: "farmer",
        as: "_reviews"
      }
    });

    pipeline.push({
      $project: {
        name: 1, price: 1, quantity: 1, category: 1, harvestDate: 1, freshnessDays: 1,
        freshnessStatus: {
          $switch: {
            branches: [
              { case: { $lte: ["$freshnessDays", 1] }, then: "Fresh" },
              { case: { $lte: ["$freshnessDays", 3] }, then: "2-3 Days Old" }
            ],
            default: "Standard"
          }
        },
        farmer: {
          _id: "$farmer._id",
          name: { $ifNull: ["$farmer.name", "Local Farmer"] }
        },
        avgRating: { $round: [{ $avg: "$_reviews.rating" }, 1] },
        reviewCount: { $size: "$_reviews" },
        location: 1,
        distanceInKm: { $cond: [{ $ifNull: ["$distanceInMeters", false] }, { $round: [{ $divide: ["$distanceInMeters", 1000] }, 1] }, null] }
      }
    });

    pipeline.push({ $sort: chosenSort });
    pipeline.push({ $skip: skipValue });
    pipeline.push({ $limit: limitValue });

    return await productRepository.aggregate(pipeline);
  }

  async updateProduct(productId, farmerId, data) {
    const ALLOWED_UPDATE_FIELDS = ["name", "price", "quantity", "category", "harvestDate", "freshnessExpiryDays", "imageUrl", "isSoldOut"];
    const product = await productRepository.findById(productId);
    
    if (!product || product.farmer.toString() !== farmerId) {
      throw Object.assign(new Error("Unauthorized"), { status: 403 });
    }
    
    for (const key of ALLOWED_UPDATE_FIELDS) {
      if (data[key] !== undefined) product[key] = data[key];
    }
    if (data.coordinates) {
      product.location = { type: "Point", coordinates: data.coordinates.map(Number) };
    }
    if (data.quantity !== undefined) product.isSoldOut = Number(data.quantity) === 0;

    await product.save();
    return product;
  }

  async deleteProduct(productId, farmerId) {
    const product = await productRepository.findById(productId);
    if (!product || product.farmer.toString() !== farmerId) {
      throw Object.assign(new Error("Unauthorized"), { status: 403 });
    }
    await product.deleteOne();
  }

  async getMyProducts(farmerId) {
    return await productRepository.findByFarmer(farmerId);
  }

  async getActiveFarmerCount() {
    return await productRepository.getActiveFarmerCount();
  }
}

export default new ProductService();
