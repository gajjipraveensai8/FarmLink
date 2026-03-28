import { create } from 'zustand';
import api from '../api';

export const useCartStore = create((set, get) => ({
  cart: [],
  total: 0,
  count: 0,
  isSyncing: false,

  // Recalculate derived state
  _updateDerived: (cartItems) => {
    const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const count = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    set({ cart: cartItems, total, count });
  },

  // Sync with server (Call on login or initial load)
  fetchCart: async () => {
    try {
      set({ isSyncing: true });
      const { data } = await api.get('/api/cart');
      if (data?.success && data.cart) {
        // Map backend populated items to frontend structure
        const cartItems = data.cart.items.map(i => ({
          productId: i.product._id,
          name: i.product.name,
          price: i.product.price,
          quantity: i.quantity,
          imageUrl: i.product.imageUrl,
          isSoldOut: i.product.isSoldOut
        }));
        get()._updateDerived(cartItems);
      }
    } catch (error) {
      console.error("Failed to fetch cart", error);
    } finally {
      set({ isSyncing: false });
    }
  },

  // Save to server
  _syncToServer: async (cartItems) => {
    try {
      await api.post('/api/cart', { items: cartItems });
    } catch (error) {
      console.error("Failed to sync cart to server", error);
    }
  },

  addItem: (product, qty = 1) => {
    const { cart, _syncToServer, _updateDerived } = get();
    const existing = cart.find(i => i.productId === product._id);
    
    let newCart;
    if (existing) {
      newCart = cart.map(i => i.productId === product._id ? { ...i, quantity: i.quantity + qty } : i);
    } else {
      newCart = [...cart, {
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity: qty,
        imageUrl: product.imageUrl,
        isSoldOut: product.isSoldOut
      }];
    }
    
    _updateDerived(newCart);
    _syncToServer(newCart);
  },

  updateQty: (productId, delta) => {
    const { cart, _syncToServer, _updateDerived } = get();
    const newCart = cart.map(i => {
      if (i.productId === productId) {
        return { ...i, quantity: Math.max(1, i.quantity + delta) };
      }
      return i;
    });
    
    _updateDerived(newCart);
    _syncToServer(newCart);
  },

  removeItem: (productId) => {
    const { cart, _syncToServer, _updateDerived } = get();
    const newCart = cart.filter(i => i.productId !== productId);
    
    _updateDerived(newCart);
    _syncToServer(newCart);
  },

  clearCart: async () => {
    const { _syncToServer, _updateDerived } = get();
    _updateDerived([]);
    await _syncToServer([]);
  }
}));
