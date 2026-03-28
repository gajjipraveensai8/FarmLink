import { useState, useEffect, useRef, useCallback } from "react";
import api, { safeArray, safeNumber, safeString } from "../api";
import Skeleton from "./Skeleton";
import EmptyState from "./EmptyState";

const POLL_INTERVAL = 30_000; // 30s

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef(null);

  /* ── fetch notifications ── */
  const fetchNotifications = useCallback(async () => {
    try {
      const { data } = await api.get("/api/notifications", {
        params: { limit: 15 },
      });
      setNotifications(safeArray(data.notifications));
      setUnread(safeNumber(data.unreadCount));
    } catch {
      /* silent — bell shouldn't break app */
    }
  }, []);

  /* initial + polling */
  useEffect(() => {
    fetchNotifications();
    const id = setInterval(fetchNotifications, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [fetchNotifications]);

  /* close on outside click */
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  /* ── mark single as read ── */
  const markRead = async (id) => {
    try {
      await api.patch(`/api/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnread((c) => Math.max(0, c - 1));
    } catch { /* silent */ }
  };

  /* ── mark all read ── */
  const markAllRead = async () => {
    try {
      await api.patch("/api/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnread(0);
    } catch { /* silent */ }
  };

  /* ── icon by type ── */
  const typeIcon = (type) => {
    const map = {
      order_placed: "📦", order_accepted: "✅", order_rejected: "❌",
      order_packed: "📦", order_out_for_delivery: "🚚", order_delivered: "🎉",
      order_cancelled: "🚫", order_disputed: "⚠️", low_stock: "📉",
      new_review: "⭐", dispute_update: "⚖️", verification_update: "🔒",
      subscription_reminder: "🔔", price_alert: "💰",
    };
    return map[type] || "🔔";
  };

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* bell button */}
      <button
        onClick={() => { setOpen((v) => !v); if (!open) fetchNotifications(); }}
        className="relative rounded-full p-2 text-white/90 hover:bg-white/15 hover:text-white transition-all duration-200"
        aria-label="Notifications"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full
                           bg-red-500 text-[10px] font-bold text-white ring-2 ring-green-700 min-w-[18px] px-1">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>
      {/* dropdown panel */}
      {open && (
        <div
          className="absolute right-0 mt-2 w-96 max-w-full bg-white rounded-2xl shadow-xl border border-gray-100 z-50 animate-[fadeDown_0.2s_ease-out]"
        >
          {/* header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/80">
            <h3 className="text-sm font-bold text-gray-800">Notifications</h3>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-green-600 font-semibold hover:text-green-700 transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="py-10 flex flex-col items-center justify-center">
                {[1,2,3].map((i) => (
                  <Skeleton key={i} className="h-6 w-11/12 mb-2" />
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <EmptyState
                icon="🔔"
                title="No notifications yet"
                subtitle="You're all caught up!"
              />
            ) : (
              notifications.map((n) => (
                <button
                  key={n._id}
                  onClick={() => { if (!n.read) markRead(n._id); }}
                  className={`w-full text-left px-4 py-3 flex gap-3 hover:bg-gray-50 transition-colors duration-150 ${n.read ? "opacity-60" : ""}`}
                >
                  <span className="text-lg mt-0.5 shrink-0">{typeIcon(n.type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-snug ${n.read ? "text-gray-500" : "text-gray-800 font-semibold"}`}>
                      {safeString(n.title, "Notification")}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{safeString(n.message)}</p>
                    <p className="text-[10px] text-gray-300 mt-1">{timeAgo(n.createdAt)}</p>
                  </div>
                  {!n.read && (
                    <span className="mt-2 h-2 w-2 rounded-full bg-green-500 shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>
          <style>{`
            @keyframes fadeDown {
              from { opacity: 0; transform: translateY(-8px); }
              to   { opacity: 1; transform: translateY(0); }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}
