import { useState, useEffect } from "react";
import api from "../../api";

/**
 * AcceptOrderModal
 * Shown when farmer clicks "Accept Order".
 * Lets them choose one of three fulfilment modes:
 *   1. buyer_pickup   – buyer comes to the farm
 *   2. farmer_deliver – farmer delivers themselves
 *   3. agent_deliver  – assign to a delivery agent
 */
export default function AcceptOrderModal({ order, onClose, onConfirm }) {
  const [mode, setMode] = useState(null);
  const [agents, setAgents] = useState([]);
  const [agentsLoading, setAgentsLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [deliveryAddress, setDeliveryAddress] = useState(order?.buyer?.address || "");
  const [submitting, setSubmitting] = useState(false);
  const [agentError, setAgentError] = useState(null);

  /* Fetch available delivery agents when agent_deliver is selected */
  useEffect(() => {
    if (mode !== "agent_deliver") return;
    setAgentsLoading(true);
    setAgentError(null);
    api.get("/api/delivery/available-agents")
      .then(({ data }) => setAgents(data.agents || []))
      .catch(() => setAgentError("Could not load delivery agents. Try again."))
      .finally(() => setAgentsLoading(false));
  }, [mode]);

  const canConfirm = () => {
    if (!mode) return false;
    if (mode === "agent_deliver" && !selectedAgent) return false;
    return true;
  };

  const handleConfirm = async () => {
    if (!canConfirm()) return;
    setSubmitting(true);
    try {
      await onConfirm({
        farmerFulfillmentType: mode,
        deliveryPartnerId: mode === "agent_deliver" ? selectedAgent._id : undefined,
        deliveryAddress: deliveryAddress || undefined,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const OPTIONS = [
    {
      id: "farmer_deliver",
      emoji: "🧑‍🌾",
      title: "Farmer Delivers",
      subtitle: "You deliver directly to the buyer",
      color: "emerald",
    },
    {
      id: "agent_deliver",
      emoji: "🚚",
      title: "Assign Delivery Agent",
      subtitle: "A nearby agent picks up & delivers",
      color: "amber",
    },
  ];

  const colorMap = {
    emerald: {
      border: "border-emerald-400",
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      ring: "ring-emerald-400",
    },
    amber: {
      border: "border-amber-400",
      bg: "bg-amber-50",
      text: "text-amber-700",
      ring: "ring-amber-400",
    },
  };

  return (
    /* backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.65)", backdropFilter: "blur(6px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">

        {/* Header */}
        <div className="px-7 pt-7 pb-4 border-b border-slate-100 flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Order #{(order._id || "").slice(-6).toUpperCase()}</p>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">How will this order be fulfilled?</h2>
            <p className="text-sm text-slate-500 mt-1">Choose who handles delivery for this order.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors mt-1 shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Order summary */}
        <div className="px-7 pt-4 pb-3 bg-slate-50/60 border-b border-slate-100">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Buyer: <strong className="text-slate-800">{order.buyer?.name}</strong></span>
            <span className="font-black text-brand-700">₹{order.totalAmount}</span>
          </div>
          {order.buyer?.phone && (
            <p className="text-xs text-slate-400 mt-1">📞 {order.buyer.phone}</p>
          )}
        </div>

        {/* Mode selector */}
        <div className="px-7 pt-5 space-y-3">
          {OPTIONS.map((opt) => {
            const c = colorMap[opt.color];
            const active = mode === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => { setMode(opt.id); setSelectedAgent(null); }}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-200 text-left
                  ${active ? `${c.border} ${c.bg} ring-2 ${c.ring} ring-offset-1` : "border-slate-100 hover:border-slate-200 hover:bg-slate-50"}`}
              >
                <span className="text-3xl">{opt.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-black tracking-tight ${active ? c.text : "text-slate-800"}`}>{opt.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-tight">{opt.subtitle}</p>
                </div>
                {active && (
                  <span className={`w-5 h-5 rounded-full border-2 ${c.border} flex items-center justify-center shrink-0`}>
                    <span className={`w-2.5 h-2.5 rounded-full ${c.bg.replace("50", "500")}`} />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Delivery address field (shown for farmer_deliver and agent_deliver) */}
        {(mode === "farmer_deliver" || mode === "agent_deliver") && (
          <div className="px-7 pt-4">
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
              Buyer's Delivery Address
            </label>
            <input
              type="text"
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              placeholder="e.g. 42 MG Road, Bangalore 560001"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm placeholder-slate-300
                         focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400 transition-all"
            />
          </div>
        )}

        {/* Agent selector (shown when agent_deliver mode is active) */}
        {mode === "agent_deliver" && (
          <div className="px-7 pt-4">
            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-2">
              Select Delivery Agent
            </label>

            {agentsLoading && (
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <div key={i} className="h-14 rounded-xl bg-slate-100 animate-pulse" />
                ))}
              </div>
            )}

            {agentError && (
              <p className="text-sm text-red-500 bg-red-50 rounded-xl px-4 py-3">{agentError}</p>
            )}

            {!agentsLoading && !agentError && agents.length === 0 && (
              <p className="text-sm text-slate-400 bg-slate-50 rounded-xl px-4 py-3 text-center">
                No delivery agents available right now.
              </p>
            )}

            {!agentsLoading && agents.length > 0 && (
              <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                {agents.map((agent) => {
                  const selected = selectedAgent?._id === agent._id;
                  return (
                    <button
                      key={agent._id}
                      onClick={() => setSelectedAgent(agent)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left
                        ${selected ? "border-amber-400 bg-amber-50 ring-2 ring-amber-300 ring-offset-1" : "border-slate-100 hover:border-slate-200"}`}
                    >
                      <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center text-lg shrink-0">
                        🚴
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-slate-800 truncate">{agent.name}</p>
                        {agent.phone && <p className="text-xs text-slate-400">📞 {agent.phone}</p>}
                        {agent.address && <p className="text-xs text-slate-400 truncate">📍 {agent.address}</p>}
                      </div>
                      {selected && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-amber-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="px-7 pt-5 pb-7 flex gap-3 mt-1">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl border-2 border-slate-200 text-sm font-black text-slate-600 hover:bg-slate-50 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!canConfirm() || submitting}
            className="flex-1 py-3 rounded-2xl bg-brand-600 text-white text-sm font-black
                       hover:bg-brand-700 transition-all shadow-lg shadow-brand-200
                       disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {submitting ? "Accepting…" : mode === "agent_deliver" && selectedAgent ? `Assign to ${selectedAgent.name}` : "Confirm & Accept"}
          </button>
        </div>
      </div>
    </div>
  );
}
