// frontend/src/api/admin.js
import api from "../api";

export const fetchUsers = () => api.get("/admin/users");
export const blockUser = (id) => api.patch(`/admin/users/${id}/block`);
export const unblockUser = (id) => api.patch(`/admin/users/${id}/unblock`);
export const approveFarmer = (id) => api.patch(`/admin/farmers/${id}/approve`);
export const rejectFarmer = (id, note) => api.patch(`/admin/farmers/${id}/reject`, { note });
export const fetchOrders = () => api.get("/admin/orders");
export const fetchDisputes = () => api.get("/admin/disputes");
export const resolveDispute = (id, status, note) => api.patch(`/admin/disputes/${id}/resolve`, { status, note });
