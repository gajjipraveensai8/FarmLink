import { useState } from "react";
import api, { safeArray, safeString } from "../api";
import { formatStatus } from "../utils/statusLabels";
import { validateRequired } from "../utils/validators";

/**
 * Dispute panel — raise a dispute + message thread.
 * Shown inside an order detail view for delivered/disputed orders.
 */
export default function DisputePanel({ orderId, againstUserId, existingDispute, onDisputeCreated }) {
  const [showForm, setShowForm] = useState(false);
  const [reason, setReason] = useState("quality_issue");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  /* ── message state ── */
  const [newMsg, setNewMsg] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);
  const [dispute, setDispute] = useState(existingDispute || null);

  const REASONS = [
    { value: "quality_issue", label: "Quality Issue" },
    { value: "wrong_item", label: "Wrong Item" },
    { value: "missing_item", label: "Missing Item" },
    { value: "late_delivery", label: "Late Delivery" },
    { value: "not_delivered", label: "Not Delivered" },
    { value: "other", label: "Other" },
  ];

  const handleRaise = async (e) => {
    e.preventDefault();
    const descCheck = validateRequired(description, "Description");
    if (!descCheck.valid) {
      setError(descCheck.message);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const { data } = await api.post("/api/disputes", {
        orderId,
        againstUserId,
        reason,
        description: description.trim(),
      });
      setError(null);
      setDispute(data.dispute);
      setShowForm(false);
      onDisputeCreated?.(data.dispute);
    } catch (err) {
      if (err?.name === "CanceledError" || err?.code === "ERR_CANCELED") return;
      setError(err.response?.data?.message || "Failed to raise dispute");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMsg.trim() || !dispute) return;
    setSendingMsg(true);
    try {
      const { data } = await api.post(`/api/disputes/${dispute._id}/message`, {
        message: newMsg.trim(),
      });
      setDispute(data.dispute);
      setNewMsg("");
      setError(null);
    } catch (err) {
      if (err?.name === "CanceledError" || err?.code === "ERR_CANCELED") return;
      /* silent but safe */
    } finally {
      setSendingMsg(false);
    }
  };

  /* ── already has dispute ── */
  if (dispute) {
    const statusCls = {
      open: "bg-yellow-100 text-yellow-700",
      under_review: "bg-blue-100 text-blue-700",
      resolved: "bg-green-100 text-green-700",
      closed: "bg-gray-100 text-gray-600",
    }[dispute.status] || "bg-gray-100 text-gray-600";

    return (
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/80 flex items-center justify-between">
          <span className="text-sm font-bold text-gray-700">⚖️ Dispute</span>
          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold capitalize ${statusCls}`}>
            {formatStatus(dispute.status)}
          </span>
        </div>

        {/* message thread */}
        <div className="max-h-48 overflow-y-auto divide-y divide-gray-50">
          {safeArray(dispute.messages).map((m, i) => (
            <div key={i} className="px-4 py-2.5 text-sm">
              <p className="text-gray-700">{m.message}</p>
              <p className="text-[10px] text-gray-300 mt-0.5">
                {m.timestamp ? new Date(m.timestamp).toLocaleString() : ""}
              </p>
            </div>
          ))}
        </div>

        {/* resolution */}
        {dispute.resolution && (
          <div className="px-4 py-2.5 bg-green-50 border-t border-green-200 text-xs text-green-700">
            <span className="font-semibold">Resolution:</span> {dispute.resolution}
          </div>
        )}

        {/* send message (if open) */}
        {["open", "under_review"].includes(dispute.status) && (
          <div className="px-4 py-3 border-t border-gray-100 flex gap-2">
            <input
              value={newMsg}
              onChange={(e) => setNewMsg(e.target.value)}
              placeholder="Add a message…"
              className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm
                         focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:bg-white transition-all duration-200"
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            />
            <button
              onClick={handleSendMessage}
              disabled={sendingMsg || !newMsg.trim()}
              className="rounded-xl bg-green-600 px-3 py-2 text-xs font-bold text-white
                         hover:bg-green-700 transition-all duration-200 disabled:opacity-50"
            >
              {sendingMsg ? "…" : "Send"}
            </button>
          </div>
        )}
      </div>
    );
  }

  /* ── raise dispute button + form ── */
  return (
    <div className="space-y-2">
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="rounded-xl bg-red-50 text-red-600 px-4 py-2 text-xs font-bold ring-1 ring-red-200
                     hover:bg-red-100 transition-all duration-200 hover:scale-105 active:scale-95"
        >
          ⚠️ Raise Dispute
        </button>
      ) : (
        <form onSubmit={handleRaise} className="rounded-xl border border-gray-200 bg-white p-4 space-y-3 shadow-sm animate-[fadeSlide_0.2s_ease-out]">
          <p className="text-sm font-semibold text-gray-700">Raise a Dispute</p>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm
                       focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:bg-white transition-all duration-200"
          >
            {REASONS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the issue…"
            required
            rows={3}
            maxLength={1000}
            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm resize-none
                       focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:bg-white transition-all duration-200"
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white
                         hover:bg-red-700 transition-all duration-200 disabled:opacity-50"
            >
              {submitting ? "Submitting…" : "Submit Dispute"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded-xl bg-gray-100 px-4 py-2 text-xs font-semibold text-gray-600
                         hover:bg-gray-200 transition-all duration-200"
            >
              Cancel
            </button>
          </div>
        </form>
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
