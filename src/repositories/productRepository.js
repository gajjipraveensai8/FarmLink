import Product from "../models/Product.js";

class ProductRepository {
  async create(data) {
    return await Product.create(data);
  }

  async aggregate(pipeline) {
    return await Product.aggregate(pipeline);
  }

  async findById(id) {
    return await Product.findById(id);
  }

  async findByFarmer(farmerId) {
    return await Product.find({ farmer: farmerId }).sort({ createdAt: -1 });
  }

  async getActiveFarmerCount() {
    const count = await Product.distinct("farmer", { 
      isExpired: false, 
      isSoldOut: false, 
      quantity: { $gt: 0 } 
    });
    return count.length;
  }
}

export default new ProductRepository();
