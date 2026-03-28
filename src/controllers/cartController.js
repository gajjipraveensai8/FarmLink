import Cart from "../models/Cart.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// @route GET /api/cart
export const getCart = asyncHandler(async (req, res) => {
  let cart = await Cart.findOne({ user: req.user.id }).populate(
    "items.product",
    "name price imageUrl quantity isSoldOut"
  );

  if (!cart) {
    cart = await Cart.create({ user: req.user.id, items: [] });
  }

  res.json({ success: true, cart });
});

// @route POST /api/cart
export const syncCart = asyncHandler(async (req, res) => {
  const { items } = req.body; // array of { productId, quantity }

  const formattedItems = (items || []).map(item => ({
    product: item.productId,
    quantity: item.quantity,
  }));

  let cart = await Cart.findOne({ user: req.user.id });

  if (cart) {
    cart.items = formattedItems;
    await cart.save();
  } else {
    cart = await Cart.create({ user: req.user.id, items: formattedItems });
  }

  cart = await cart.populate("items.product", "name price imageUrl quantity isSoldOut");

  res.json({ success: true, cart });
});
