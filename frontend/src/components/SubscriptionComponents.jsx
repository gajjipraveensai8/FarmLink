import { useState, useEffect } from "react";
import api, { safeArray, safeString } from "../api";
import { formatStatus } from "../utils/statusLabels";
import Skeleton from "./Skeleton";
import EmptyState from "./EmptyState";
import {
  validateQuantity, validateSubscriptionSchedule,
  validateSubscriptionFeasibility, validateSeasonalAvailability,
} from "../utils/validators";

/**
 * Subscriptions panel for buyers.
 * Lists active subscriptions + allows creating from a product.
 */
export function SubscriptionsList() {
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/api/subscriptions/my");
        setSubs(safeArray(data));
      } catch (err) {
        if (err?.name === "CanceledError" || err?.code === "ERR_CANCELED") return;
        setError("Unable to load subscriptions");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const changeStatus = async (id, status) => {
    setActionLoading(id);
    try {
      const { data } = await api.patch(`/api/subscriptions/${id}/status`, { status });
      const updated = data.subscription || data;
      setSubs((prev) => prev.map((s) => (s._id === id ? { ...s, ...updated } : s)));
      setError(null);
    } catch (err) {
      if (err?.name === "CanceledError" || err?.code === "ERR_CANCELED") return;
      setError("Action failed. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const statusBadge = {
    active: "bg-green-100 text-green-700 ring-1 ring-green-300",
    paused: "bg-yellow-100 text-yellow-700 ring-1 ring-yellow-300",
    cancelled: "bg-gray-100 text-gray-500 ring-1 ring-gray-200",
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (subs.length === 0) {
    return (
      <EmptyState
        icon="🔔"
        title="No subscriptions yet"
        subtitle="Subscribe to products from the marketplace"
      />
    );
  }

  return (
    <div className="space-y-4">
      {subs.map((sub) => (
        <div key={sub._id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-3
                                       transition-all duration-200 hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${statusBadge[sub.status] || statusBadge.cancelled}`}>
              {sub.status}
            </span>
            <span className="text-xs text-gray-400 capitalize">{sub.frequency}</span>
          </div>

          <div className="text-sm text-gray-600">
            {safeArray(sub.items).map((item, i) => (
              <span key={i}>
                {safeString(item.product?.name, "Product")} ×{item.quantity}
                {i < (sub.items?.length ?? 0) - 1 ? ", " : ""}
              </span>
            ))}
          </div>

          {sub.nextDeliveryDate && (
            <p className="text-xs text-gray-400">
              Next delivery: {new Date(sub.nextDeliveryDate).toLocaleDateString()}
            </p>
          )}

          {sub.status !== "cancelled" && (
            <div className="flex gap-2 pt-1">
              {sub.status === "active" && (
                <button
                  onClick={() => changeStatus(sub._id, "paused")}
                  disabled={actionLoading === sub._id}
                  className="rounded-xl bg-yellow-50 text-yellow-700 px-3 py-1.5 text-xs font-bold
                             ring-1 ring-yellow-200 hover:bg-yellow-100 transition-all duration-200 disabled:opacity-50"
                >
                  ⏸ Pause
                </button>
              )}
              {sub.status === "paused" && (
                <button
                  onClick={() => changeStatus(sub._id, "active")}
                  disabled={actionLoading === sub._id}
                  className="rounded-xl bg-green-50 text-green-700 px-3 py-1.5 text-xs font-bold
                             ring-1 ring-green-200 hover:bg-green-100 transition-all duration-200 disabled:opacity-50"
                >
                  ▶ Resume
                </button>
              )}
              <button
                onClick={() => changeStatus(sub._id, "cancelled")}
                disabled={actionLoading === sub._id}
                className="rounded-xl bg-red-50 text-red-600 px-3 py-1.5 text-xs font-bold
                           ring-1 ring-red-200 hover:bg-red-100 transition-all duration-200 disabled:opacity-50"
              >
                ✕ Cancel
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * Quick "Subscribe" button for product cards.
 */
export function SubscribeButton({ productId, productName, freshnessExpiryDays, category }) {
  const [showForm, setShowForm] = useState(false);
  const [frequency, setFrequency] = useState("weekly");
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);
  const [scheduleWarn, setScheduleWarn] = useState(null);
  const [feasibilityMsg, setFeasibilityMsg] = useState(null);
  const seasonCheck = validateSeasonalAvailability(category, null, productName);

  const handleSubscribe = async () => {
    const qtyCheck = validateQuantity(quantity);
    if (!qtyCheck.valid) {
      setError(qtyCheck.message);
      return;
    }
    const schedCheck = validateSubscriptionSchedule(frequency);
    setScheduleWarn(schedCheck.warn ? schedCheck.message : null);

    /* ── feasibility: does frequency fit the product’s freshness? ── */
    const feasCheck = validateSubscriptionFeasibility(
      { freshnessExpiryDays },
      frequency,
    );
    if (!feasCheck.valid) {
      setError(feasCheck.message);
      return;
    }
    setFeasibilityMsg(feasCheck.warn ? feasCheck.message : null);

    setSubmitting(true);
    setError(null);
    try {
      await api.post("/api/subscriptions", {
        items: [{ product: productId, quantity }],
        frequency,
      });
      setError(null);
      setDone(true);
      setTimeout(() => { setDone(false); setShowForm(false); }, 2000);
    } catch (err) {
      if (err?.name === "CanceledError" || err?.code === "ERR_CANCELED") return;
      setError(err.response?.data?.message || "Failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <span className="text-xs text-green-600 font-semibold">✅ Subscribed!</span>
    );
  }

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="inline-flex items-center gap-1 rounded-full bg-purple-50 text-purple-600 px-2.5 py-1 text-xs font-semibold
                   ring-1 ring-purple-200 hover:bg-purple-100 transition-all duration-200 hover:scale-105 active:scale-95"
      >
        🔔 Subscribe
      </button>
    );
  }

  return (
    <div className="mt-2 p-3 rounded-xl border border-gray-200 bg-white shadow-sm space-y-2 animate-[fadeSlide_0.2s_ease-out]">
      <p className="text-xs font-semibold text-gray-600 truncate">Subscribe: {productName}</p>
      <div className="flex gap-2">
        <select
          value={frequency}
          onChange={(e) => setFrequency(e.target.value)}
          className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5 text-xs
                     focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all duration-200"
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="biweekly">Bi-weekly</option>
          <option value="monthly">Monthly</option>
        </select>
        <input
          type="number"
          min={1}
          max={100}
          value={quantity}
          onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
          className="w-14 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5 text-xs text-center
                     focus:ring-2 focus:ring-purple-400 focus:border-purple-400 transition-all duration-200"
        />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      {feasibilityMsg && !error && (
        <p className="text-xs text-amber-600">⚠️ {feasibilityMsg}</p>
      )}
      {scheduleWarn && !error && !feasibilityMsg && (
        <p className="text-xs text-amber-600">⚠️ {scheduleWarn}</p>
      )}
      {seasonCheck.warn && (
        <p className="text-xs text-amber-600">🗓️ {seasonCheck.message}</p>
      )}
      <div className="flex gap-2">
        <button
          onClick={handleSubscribe}
          disabled={submitting}
          className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-bold text-white
                     hover:bg-purple-700 transition-all duration-200 disabled:opacity-50"
        >
          {submitting ? "…" : "Confirm"}
        </button>
        <button
          onClick={() => setShowForm(false)}
          className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-500
                     hover:bg-gray-200 transition-all duration-200"
        >
          Cancel
        </button>
      </div>
      <style>{`
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
