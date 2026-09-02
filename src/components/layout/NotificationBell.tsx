
import React, { useState, useEffect } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  X,
  Inbox,
  BookOpen,
  FileCheck,
  Video,
  BookMarked,
  ShieldAlert,
  Info,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  linkUrl?: string;
  createdAt: string;
}

const getTypeStyle = (type: string) => {
  switch (type?.toUpperCase()) {
    case "TEST":
    case "EXAM":
      return { icon: ShieldAlert, bg: "bg-rose-500/15", iconColor: "text-rose-400", dot: "bg-rose-500" };
    case "ASSIGNMENT":
    case "HOMEWORK":
      return { icon: FileCheck, bg: "bg-amber-500/15", iconColor: "text-amber-400", dot: "bg-amber-500" };
    case "LIVE_CLASS":
    case "LIVE":
    case "CLASS":
      return { icon: Video, bg: "bg-emerald-500/15", iconColor: "text-emerald-400", dot: "bg-emerald-500" };
    case "MATERIAL":
    case "STUDY":
      return { icon: BookOpen, bg: "bg-blue-500/15", iconColor: "text-blue-400", dot: "bg-blue-500" };
    case "GRADE":
    case "RESULT":
      return { icon: Sparkles, bg: "bg-purple-500/15", iconColor: "text-purple-400", dot: "bg-purple-500" };
    default:
      return { icon: Info, bg: "bg-slate-500/15", iconColor: "text-slate-400", dot: "bg-slate-400" };
  }
};

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [showAllModal, setShowAllModal] = useState(false);
  const [modalFilter, setModalFilter] = useState<"ALL" | "UNREAD">("ALL");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const loadNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.notifications)) {
          setNotifications(data.notifications);
        }
      }
    } catch (err) {
      console.error("Failed to load notifications", err);
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const quickNotifications = notifications.slice(0, 2);

  const markAsRead = async (notificationId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setNotifications((prev) => prev.map((n) => (n._id === notificationId ? { ...n, read: true } : n)));
    try {
      await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const formatTimeAgo = (dateStr?: string) => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      const diffSec = Math.floor((Date.now() - date.getTime()) / 1000);
      if (diffSec < 60) return "Just now";
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHour = Math.floor(diffMin / 60);
      if (diffHour < 24) return `${diffHour}h ago`;
      const diffDay = Math.floor(diffHour / 24);
      if (diffDay < 7) return `${diffDay}d ago`;
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } catch {
      return dateStr;
    }
  };

  const filteredModalNotifications =
    modalFilter === "UNREAD" ? notifications.filter((n) => !n.read) : notifications;

  // ── Reusable notification card ────────────────────────────────────────────
  const NotifCard = ({ n, onClose, compact = false }: { n: NotificationItem; onClose: () => void; compact?: boolean }) => {
    const style = getTypeStyle(n.type);
    const Icon = style.icon;
    return (
      <Link
        href={n.linkUrl || "#"}
        onClick={() => { markAsRead(n._id); onClose(); }}
        className={`group flex items-start gap-3 p-3 rounded-xl transition-all duration-150 border ${
          n.read
            ? "bg-transparent border-transparent hover:bg-slate-100/60 dark:hover:bg-slate-800/40"
            : "bg-white dark:bg-slate-800/70 border-slate-200 dark:border-slate-700/80 shadow-sm hover:shadow-md"
        }`}
      >
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${style.bg}`}>
          <Icon className={`w-4 h-4 ${style.iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-0.5">
            <p className={`text-xs font-bold leading-tight truncate ${n.read ? "text-slate-500 dark:text-slate-400" : "text-slate-900 dark:text-slate-100"}`}>
              {n.title}
            </p>
            <span className="text-[10px] text-slate-400 font-mono shrink-0 mt-0.5">{formatTimeAgo(n.createdAt)}</span>
          </div>
          <p className={`text-[11px] leading-relaxed ${compact ? "line-clamp-1" : "line-clamp-2"} ${n.read ? "text-slate-400 dark:text-slate-500" : "text-slate-600 dark:text-slate-300"}`}>
            {n.message}
          </p>
        </div>
        {!n.read && <span className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${style.dot}`} />}
      </Link>
    );
  };

  return (
    <div className="relative">
      {/* Bell button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="View notifications"
        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all relative cursor-pointer ${
          isOpen
            ? "bg-[#004b79] text-white shadow-lg"
            : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
        }`}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center shadow-md">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* ── QUICK DROPDOWN ── */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div
            className="absolute right-0 mt-2 w-80 sm:w-[360px] bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl z-50 overflow-hidden"
            style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.1)" }}
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/60">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#004b79]/10 dark:bg-[#004b79]/25 flex items-center justify-center">
                  <Bell className="w-3.5 h-3.5 text-[#004b79] dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-900 dark:text-slate-100 leading-none">Notifications</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
                  </p>
                </div>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-[10px] font-bold text-[#004b79] dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer px-2 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
                >
                  <CheckCheck className="w-3 h-3" />
                  <span>Mark all read</span>
                </button>
              )}
            </div>

            {/* Items */}
            <div className="p-2 space-y-0.5 max-h-64 overflow-y-auto">
              {quickNotifications.length === 0 ? (
                <div className="py-8 text-center">
                  <Inbox className="w-7 h-7 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">No notifications yet</p>
                </div>
              ) : (
                quickNotifications.map((n) => (
                  <NotifCard key={n._id} n={n} onClose={() => setIsOpen(false)} compact />
                ))
              )}
            </div>

            {/* Footer */}
            <div className="px-2 py-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40">
              <button
                type="button"
                onClick={() => { setIsOpen(false); setShowAllModal(true); }}
                className="w-full py-2 rounded-xl text-xs font-bold text-[#004b79] dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <BookMarked className="w-3.5 h-3.5" />
                View all notifications {notifications.length > 0 && `(${notifications.length})`}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── VIEW ALL MODAL ── */}
      {showAllModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div
            className="relative w-full max-w-md bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden flex flex-col max-h-[88vh]"
            style={{ boxShadow: "0 30px 80px rgba(0,0,0,0.3)" }}
          >
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0 bg-slate-50/80 dark:bg-slate-900/60">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#004b79]/10 dark:bg-[#004b79]/25 flex items-center justify-center">
                  <Bell className="w-4 h-4 text-[#004b79] dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">All Notifications</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">{notifications.length} total · {unreadCount} unread</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    className="text-[11px] font-bold text-[#004b79] dark:text-blue-400 px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 cursor-pointer flex items-center gap-1 transition-colors hover:bg-blue-100 dark:hover:bg-blue-950/60"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Mark all</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowAllModal(false)}
                  className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="px-4 py-2.5 flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 shrink-0">
              {(["ALL", "UNREAD"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setModalFilter(f)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                    modalFilter === f
                      ? "bg-[#004b79] text-white shadow-sm"
                      : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  {f === "ALL" ? `All (${notifications.length})` : `Unread (${unreadCount})`}
                </button>
              ))}
            </div>

            {/* Notification list */}
            <div className="p-3 overflow-y-auto flex-1 space-y-0.5">
              {filteredModalNotifications.length === 0 ? (
                <div className="py-14 text-center space-y-2">
                  <Inbox className="w-9 h-9 text-slate-300 dark:text-slate-600 mx-auto" />
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    No {modalFilter === "UNREAD" ? "unread " : ""}notifications
                  </p>
                  <p className="text-xs text-slate-400">You are completely up to date!</p>
                </div>
              ) : (
                filteredModalNotifications.map((n) => (
                  <div key={n._id} className="relative">
                    <NotifCard n={n} onClose={() => setShowAllModal(false)} />
                    {!n.read && (
                      <button
                        type="button"
                        onClick={(e) => markAsRead(n._id, e)}
                        title="Mark as read"
                        className="absolute top-2.5 right-2.5 w-6 h-6 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:border-emerald-400 transition-colors cursor-pointer shadow-sm"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

