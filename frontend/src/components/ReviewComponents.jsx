import { useState, useEffect, useCallback } from "react";
import api, { safeArray, safeNumber, safeString } from "../api";
import { validateRating } from "../utils/validators";

/* ── per-session cache for StarRating to avoid duplicate fetches ── */
const _ratingCache = new Map();

/**
 * Review display modal for a farmer.
 * Also includes a "Write Review" form for delivered orders.
 */
export function FarmerReviewsModal({ isOpen, onClose, farmerId, farmerName }) {
  const [reviews, setReviews] = useState([]);
  const [avg, setAvg] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !farmerId) return;
    setLoading(true);
    api
      .get(`/api/reviews/farmer/${farmerId}`)
      .then(({ data }) => {
        setReviews(safeArray(data.reviews));
        setAvg(safeNumber(data.averageRating));
        setTotal(safeNumber(data.totalReviews));
      })
      .catch((err) => {
        if (err?.name === "CanceledError" || err?.code === "ERR_CANCELED") return;
      })
      .finally(() => setLoading(false));
  }, [isOpen, farmerId]);

  /* lock background scroll while modal is open */
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col
                   animate-[scaleIn_0.2s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/80">
          <div>
            <h3 className="text-sm font-bold text-gray-800">
              Reviews for {safeString(farmerName, "Farmer")}
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {total} review{total !== 1 ? "s" : ""} · ⭐ {avg.toFixed(1)} avg
            </p>
          </div>
          <button onClick={onClose} className="rounded-full bg-gray-100 p-1.5 hover:bg-gray-200 transition-colors text-gray-500 text-sm">✕</button>
        </div>

        {/* body */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
          {loading ? (
            <div className="py-12 text-center text-gray-400 text-sm">Loading…</div>
          ) : reviews.length === 0 ? (
            <div className="py-12 text-center">
              <span className="text-3xl">⭐</span>
              <p className="mt-2 text-sm text-gray-400">No reviews yet</p>
            </div>
          ) : (
            reviews.map((r) => (
              <div key={r._id} className="px-5 py-4 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700">
                    {safeString(r.buyer?.name, "Buyer")}
                  </span>
                  <span className="text-xs text-gray-300">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className={`text-sm ${i < r.rating ? "text-yellow-400" : "text-gray-200"}`}>★</span>
                  ))}
                </div>
                {r.comment && <p className="text-sm text-gray-600">{r.comment}</p>}
                {r.farmerReply && (
                  <div className="mt-2 pl-3 border-l-2 border-green-200">
                    <p className="text-xs text-green-700 font-semibold">Farmer reply:</p>
                    <p className="text-xs text-gray-500">{r.farmerReply}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
      <style>{`
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

/**
 * Compact star rating display for product cards.
 */
export function StarRating({ farmerId }) {
  const [avg, setAvg] = useState(null);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!farmerId) return;

    /* use cache to avoid duplicate fetches for the same farmer */
    if (_ratingCache.has(farmerId)) {
      const cached = _ratingCache.get(farmerId);
      setAvg(cached.avg);
      setTotal(cached.total);
      return;
    }

    let cancelled = false;
    api
      .get(`/api/reviews/farmer/${farmerId}`)
      .then(({ data }) => {
        if (cancelled) return;
        const a = safeNumber(data.averageRating);
        const t = safeNumber(data.totalReviews);
        _ratingCache.set(farmerId, { avg: a, total: t });
        setAvg(a);
        setTotal(t);
      })
      .catch((err) => {
        if (err?.name === "CanceledError" || err?.code === "ERR_CANCELED") return;
      });
    return () => { cancelled = true; };
  }, [farmerId]);

  if (avg === null || total === 0) return null;

  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-yellow-600 bg-yellow-50 rounded-full px-2 py-0.5 ring-1 ring-yellow-200">
      ⭐ {avg.toFixed(1)} <span className="text-gray-400">({total})</span>
    </span>
  );
}

/**
 * Inline "Write a review" form after delivery.
 */
export function WriteReviewForm({ orderId, farmerId, onDone }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const ratingCheck = validateRating(rating);
    if (!ratingCheck.valid) {
      setError(ratingCheck.message);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await api.post("/api/reviews", {
        orderId,
        farmerId,
        rating,
        comment,
      });
      setError(null);
      setDone(true);
      onDone?.();
    } catch (err) {
      if (err?.name === "CanceledError" || err?.code === "ERR_CANCELED") return;
      setError(err.response?.data?.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <p className="text-xs text-green-600 font-semibold bg-green-50 rounded-xl px-3 py-2 border border-green-200">
        ✅ Review submitted! Thank you.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 mt-2">
      <p className="text-xs font-semibold text-gray-600">Leave a review</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setRating(s)}
            className={`text-lg transition-transform duration-150 hover:scale-125 ${s <= rating ? "text-yellow-400" : "text-gray-200"}`}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Comment (optional)"
        maxLength={500}
        rows={2}
        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm
                   focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:bg-white transition-all duration-200 resize-none"
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="rounded-xl bg-green-600 px-4 py-1.5 text-xs font-bold text-white
                   hover:bg-green-700 transition-all duration-200 disabled:opacity-50"
      >
        {submitting ? "Submitting…" : "Submit Review"}
      </button>
    </form>
  );
}
