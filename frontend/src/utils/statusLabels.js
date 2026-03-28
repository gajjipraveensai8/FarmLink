/**
 * Canonical order-status label + badge mapping.
 *
 * If the backend ever adds a status the UI doesn't know about,
 * the fallback prettifies the raw enum automatically.
 */

export const STATUS_LABELS = {
  placed:           "Placed",
  pending:          "Pending",
  accepted:         "Accepted",
  rejected:         "Rejected",
  packed:           "Packed",
  out_for_delivery: "Out for Delivery",
  delivered:        "Delivered",
  cancelled:        "Cancelled",
  disputed:         "Disputed",
};

export const STATUS_BADGE = {
  placed:           "bg-purple-50 text-purple-700 ring-1 ring-purple-300",
  pending:          "bg-yellow-50 text-yellow-700 ring-1 ring-yellow-300",
  accepted:         "bg-blue-50 text-blue-700 ring-1 ring-blue-300",
  rejected:         "bg-red-50 text-red-600 ring-1 ring-red-300",
  packed:           "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-300",
  out_for_delivery: "bg-amber-50 text-amber-700 ring-1 ring-amber-300",
  delivered:        "bg-green-50 text-green-700 ring-1 ring-green-300",
  cancelled:        "bg-gray-100 text-gray-500 ring-1 ring-gray-200",
  disputed:         "bg-orange-50 text-orange-700 ring-1 ring-orange-300",
};

/** Pretty-print any status — known or unknown */
export const formatStatus = (status) =>
  STATUS_LABELS[status] ??
  (status || "Unknown").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

/** Badge class — always returns something visible */
export const badgeClass = (status) =>
  STATUS_BADGE[status] ?? "bg-gray-100 text-gray-600 ring-1 ring-gray-200";
