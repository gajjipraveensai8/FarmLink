import { useState, useEffect } from "react";
import api from "../api";

/**
 * Verification badge + status card for Farmer Dashboard.
 * Shows a compact badge inline, plus a card when unverified/pending.
 */
export default function VerificationCard() {
  const [status, setStatus] = useState(null); // "unverified" | "pending" | "verified" | "rejected"
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);

  /* ── upload form state (mock — just text URLs) ── */
  const [showUpload, setShowUpload] = useState(false);
  const [docUrl, setDocUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/api/verification/status");
        setStatus(data.status);
        setNote(data.note);
      } catch {
        /* silent — don't break dashboard */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!docUrl.trim()) return;
    setSubmitting(true);
    setSubmitMsg(null);
    try {
      await api.post("/api/verification/submit", {
        documents: [docUrl.trim()],
        note: "Submitted via dashboard",
      });
      setStatus("pending");
      setShowUpload(false);
      setDocUrl("");
      setSubmitMsg({ type: "success", text: "Documents submitted for review!" });
    } catch (err) {
      setSubmitMsg({ type: "error", text: err.response?.data?.message || "Submission failed" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return null;

  /* ── inline badge (for the dashboard header) ── */
  const badge = {
    verified:   { label: "✅ Verified",   cls: "bg-green-100 text-green-700 ring-1 ring-green-300" },
    pending:    { label: "⏳ Pending",     cls: "bg-yellow-100 text-yellow-700 ring-1 ring-yellow-300" },
    rejected:   { label: "❌ Rejected",    cls: "bg-red-100 text-red-700 ring-1 ring-red-300" },
    unverified: { label: "🔒 Unverified",  cls: "bg-gray-100 text-gray-600 ring-1 ring-gray-300" },
  }[status] || { label: "🔒 Unverified", cls: "bg-gray-100 text-gray-600 ring-1 ring-gray-300" };

  return (
    <div className="space-y-3">
      {/* badge row */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${badge.cls}`}>
          {badge.label}
        </span>
        {status === "unverified" && (
          <button
            onClick={() => setShowUpload(true)}
            className="text-xs text-blue-600 font-semibold hover:underline"
          >
            Get verified →
          </button>
        )}
        {status === "rejected" && (
          <button
            onClick={() => setShowUpload(true)}
            className="text-xs text-blue-600 font-semibold hover:underline"
          >
            Resubmit →
          </button>
        )}
      </div>

      {/* rejection note */}
      {status === "rejected" && note && (
        <p className="text-xs text-red-500 bg-red-50 rounded-xl px-3 py-2 border border-red-200">
          Rejection note: {note}
        </p>
      )}

      {/* pending status card */}
      {status === "pending" && (
        <div className="rounded-xl bg-yellow-50 border border-yellow-200 px-4 py-3 text-sm text-yellow-700">
          <p className="font-semibold">Verification under review</p>
          <p className="text-xs text-yellow-600 mt-0.5">
            An admin will review your documents shortly.
          </p>
        </div>
      )}

      {/* upload form */}
      {showUpload && (
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-gray-200 bg-white p-4 space-y-3 shadow-sm animate-[fadeSlide_0.2s_ease-out]"
        >
          <p className="text-sm font-semibold text-gray-700">📎 Submit Verification Document</p>
          <input
            type="url"
            placeholder="Paste document URL (e.g. Aadhaar, land record link)"
            value={docUrl}
            onChange={(e) => setDocUrl(e.target.value)}
            required
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm
                       focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:bg-white transition-all duration-200"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-green-600 px-4 py-2 text-sm font-bold text-white
                         hover:bg-green-700 transition-all duration-200 disabled:opacity-50"
            >
              {submitting ? "Submitting…" : "Submit"}
            </button>
            <button
              type="button"
              onClick={() => setShowUpload(false)}
              className="rounded-xl bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-600
                         hover:bg-gray-200 transition-all duration-200"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* success/error message */}
      {submitMsg && (
        <p className={`text-xs font-medium px-3 py-2 rounded-xl border ${
          submitMsg.type === "success"
            ? "bg-green-50 border-green-200 text-green-700"
            : "bg-red-50 border-red-200 text-red-600"
        }`}>
          {submitMsg.text}
        </p>
      )}

      <style>{`
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
