import { formatStatus } from "../utils/statusLabels";

/**
 * Vertical timeline displaying order statusHistory entries.
 */
export default function OrderTimeline({ statusHistory = [], currentStatus }) {
  if (!statusHistory.length && !currentStatus) return null;

  /* build entries — fallback to currentStatus if history is empty */
  const entries = statusHistory.length > 0
    ? statusHistory
    : [{ status: currentStatus, timestamp: null, note: "" }];

  const statusColor = (s) => {
    const map = {
      placed:           "bg-blue-500",
      accepted:         "bg-emerald-500",
      rejected:         "bg-red-500",
      packed:           "bg-indigo-500",
      out_for_delivery: "bg-orange-500",
      delivered:        "bg-green-600",
      cancelled:        "bg-gray-500",
      disputed:         "bg-yellow-500",
    };
    return map[s] || "bg-gray-400";
  };

  const statusIcon = (s) => {
    const map = {
      placed: "📦", accepted: "✅", rejected: "❌", packed: "📦",
      out_for_delivery: "🚚", delivered: "🎉", cancelled: "🚫", disputed: "⚠️",
    };
    return map[s] || "•";
  };

  const formatLabel = formatStatus;

  return (
    <div className="relative pl-6 space-y-4">
      {/* vertical line */}
      <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gray-200" />

      {entries.map((entry, i) => {
        const isLast = i === entries.length - 1;
        return (
          <div key={i} className="relative flex items-start gap-3">
            {/* dot */}
            <div
              className={`absolute left-[-17px] top-1 h-4 w-4 rounded-full border-2 border-white shadow-sm
                ${isLast ? statusColor(entry.status) : "bg-gray-300"}`}
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm">{statusIcon(entry.status)}</span>
                <span className={`text-sm font-semibold ${isLast ? "text-gray-800" : "text-gray-500"}`}>
                  {formatLabel(entry.status)}
                </span>
                {isLast && (
                  <span className="text-[10px] rounded-full bg-green-100 text-green-700 px-2 py-0.5 font-bold">
                    Current
                  </span>
                )}
              </div>
              {entry.note && (
                <p className="text-xs text-gray-400 mt-0.5">{entry.note}</p>
              )}
              {entry.timestamp && (
                <p className="text-[10px] text-gray-300 mt-0.5">
                  {new Date(entry.timestamp).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
