import { useState, useEffect, useCallback } from "react";
import api, { safeArray, safeObject, safeNumber, safeString } from "../api";
import Navbar from "../components/Navbar";
import { formatStatus, badgeClass } from "../utils/statusLabels";
import Skeleton from "../components/Skeleton";
import EmptyState from "../components/EmptyState";

const FULFILLMENT_ICONS = {
  agent_deliver: { emoji: "🚚", label: "Agent Delivery", color: "bg-amber-50 text-amber-700 border-amber-200" },
  farmer_deliver: { emoji: "🧑‍🌾", label: "Farmer Delivers", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  buyer_pickup: { emoji: "🛒", label: "Buyer Pickup", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
};

export default function DeliveryDashboard() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState(null);

  const fetchDeliveries = useCallback(async () => {
    try {
      const { data } = await api.get("/api/delivery/my");
      setDeliveries(safeArray(data.deliveries ?? data));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load deliveries");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDeliveries(); }, [fetchDeliveries]);

  const updateStatus = async (deliveryId, status) => {
    setActionLoading(deliveryId);
    try {
      await api.patch(`/api/delivery/${deliveryId}/status`, { status });
      await fetchDeliveries();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update status");
    } finally {
      setActionLoading(null);
    }
  };

  const nextActions = {
    packed: [{ label: "🚚 Out for Delivery", status: "out_for_delivery" }],
    out_for_delivery: [{ label: "✅ Mark Delivered", status: "delivered" }],
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9FAFB]">
        <Navbar />
        <div className="mx-auto max-w-4xl px-4 py-10 space-y-4">
          <h1 className="text-2xl font-bold text-gray-800">🚚 My Deliveries</h1>
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <Navbar />

      <div className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">🚚 My Deliveries</h1>

        {error && (
          <div className="rounded-xl bg-red-50 text-red-600 px-4 py-3 text-sm mb-4 ring-1 ring-red-200">{error}</div>
        )}

        {deliveries.length === 0 ? (
          <EmptyState icon="📦" title="No deliveries assigned" subtitle="Check back soon for new assignments" />
        ) : (
          <div className="space-y-5">
            {deliveries.map((d) => {
              const buyer = safeObject(d.buyer);
              const actions = nextActions[d.status] || [];
              const fulfillment = FULFILLMENT_ICONS[d.farmerFulfillmentType] || null;
              const deliveryAddr = d.deliveryAddress || buyer.address;
              // Always generate a map URL — use address if available, fall back to buyer name
              const mapQuery = deliveryAddr || buyer.name;
              const mapUrl = mapQuery ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}` : null;

              return (
                <div
                  key={d._id}
                  className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden transition-all hover:shadow-md"
                >
                  {/* ── Card header ── */}
                  <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50 bg-gray-50/60 flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-mono text-gray-400">#{(d._id || "").slice(-6).toUpperCase()}</span>
                      <span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${badgeClass(d.status)}`}>
                        {formatStatus(d.status)}
                      </span>
                      {fulfillment && (
                        <span className={`rounded-full px-2.5 py-1 text-xs font-bold border ${fulfillment.color}`}>
                          {fulfillment.emoji} {fulfillment.label}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">
                      {d.createdAt ? new Date(d.createdAt).toLocaleDateString() : ""}
                    </span>
                  </div>

                  <div className="px-5 py-4 space-y-4">

                    {/* ── PICKUP LOCATION (Farmer) ── */}
                    {d.pickupAddress && (
                      <div className="rounded-xl border-2 border-dashed border-orange-200 bg-orange-50/50 p-4">
                        <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-2">
                          🏡 Pickup From Farmer
                        </p>
                        <div className="flex items-start gap-2">
                          <span className="text-sm text-gray-800 flex-1">{d.pickupAddress}</span>
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(d.pickupAddress)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-orange-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all"
                          >
                            🗺 Maps
                          </a>
                        </div>
                      </div>
                    )}

                    {/* ── DELIVERY DESTINATION (Buyer) ── */}
                    <div className="rounded-xl border-2 border-dashed border-green-200 bg-green-50/50 p-4">
                      <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-2 flex items-center gap-1">
                        📍 Delivery Destination
                      </p>
                      <div className="grid sm:grid-cols-2 gap-2 text-sm">
                        {buyer.name && (
                          <div>
                            <span className="text-gray-400 text-xs block">Recipient</span>
                            <span className="font-semibold text-gray-800">{safeString(buyer.name)}</span>
                          </div>
                        )}
                        {buyer.phone && (
                          <div>
                            <span className="text-gray-400 text-xs block">Phone</span>
                            <a href={`tel:${buyer.phone}`} className="font-semibold text-blue-600 hover:underline">
                              {safeString(buyer.phone)}
                            </a>
                          </div>
                        )}
                        {deliveryAddr && (
                          <div className="sm:col-span-2">
                            <span className="text-gray-400 text-xs block mb-1">Address</span>
                            <div className="flex items-start gap-2">
                              <span className="text-gray-800 flex-1">{deliveryAddr}</span>
                              {mapUrl && (
                                <a
                                  href={mapUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all"
                                >
                                  🗺 Maps
                                </a>
                              )}
                            </div>
                          </div>
                        )}
                        {!deliveryAddr && (
                          <div className="sm:col-span-2 text-xs text-gray-400 italic">No delivery address provided</div>
                        )}
                      </div>
                    </div>

                    {/* ── Order info ── */}
                    <div className="grid sm:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-400 text-xs block mb-0.5">Order Total</span>
                        <span className="text-gray-700 font-semibold">₹{safeNumber(d.totalAmount).toFixed(2)}</span>
                      </div>
                      {safeString(d.deliveryNotes, null) && (
                        <div className="sm:col-span-2">
                          <span className="text-gray-400 text-xs block mb-0.5">Notes</span>
                          <span className="text-gray-700">{d.deliveryNotes}</span>
                        </div>
                      )}
                    </div>

                    {/* ── Items ── */}
                    {safeArray(d.items).length > 0 && (
                      <div className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                        {safeArray(d.items).map((item, i) => (
                          <span key={i}>
                            {safeString(item.product?.name, "Item")} ×{safeNumber(item.quantity, 1)}
                            {i < d.items.length - 1 ? ", " : ""}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* ── Actions ── */}
                    {actions.length > 0 && (
                      <div className="flex gap-2">
                        {actions.map((a) => (
                          <button
                            key={a.status}
                            onClick={() => updateStatus(d._id, a.status)}
                            disabled={actionLoading === d._id}
                            className="rounded-xl bg-green-600 px-5 py-2.5 text-xs font-bold text-white shadow-md
                                       hover:bg-green-700 transition-all hover:scale-105 active:scale-95
                                       disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {actionLoading === d._id ? "…" : a.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
