import { create } from "zustand";
import api from "../api";

export const useProductStore = create((set, get) => ({
  products: [],
  loading: true,
  error: null,
  farmerCount: null,
  activeParams: {},

  fetchProducts: async (params = {}) => {
    // Merge new params with activeParams
    const fetchParams = { ...get().activeParams, ...params };
    set({ loading: true, error: null, activeParams: fetchParams });

    try {
      const { data } = await api.get("/api/products", { params: fetchParams });
      const raw = data?.products || data || [];
      set({ products: Array.isArray(raw) ? raw : [], loading: false });
    } catch (err) {
      if (err?.name === "CanceledError" || err?.code === "ERR_CANCELED") return;
      set({ error: err?.response?.data?.message || "Failed to load products", loading: false });
    }
  },

  fetchFarmerCount: async () => {
    try {
      const { data } = await api.get("/api/products/count");
      if (data?.count != null) {
        set({ farmerCount: data.count });
      }
    } catch (err) {
      // silently fail — hardcoded fallback shown in UI
    }
  }
}));
