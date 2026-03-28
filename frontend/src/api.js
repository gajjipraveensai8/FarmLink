import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "";

const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

/* ── handle 401 globally: clear local user state ── */
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, emit event for context to catch
      window.dispatchEvent(new Event('unauthorized'));
    }
    return Promise.reject(error);
  }
);

export default api;

/* ═══════════════ Response-safety helpers ═══════════════ */

/** Guarantee an array — useful when endpoint shape drifts */
export const safeArray = (data) =>
  Array.isArray(data) ? data : [];

/** Guarantee a plain object */
export const safeObject = (data) =>
  data && typeof data === "object" && !Array.isArray(data) ? data : {};

/** Guarantee a finite number */
export const safeNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

/** Guarantee a display-safe string */
export const safeString = (value, fallback = "—") =>
  value != null && String(value).trim() !== "" ? String(value) : fallback;
