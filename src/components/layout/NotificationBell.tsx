"use client";

import React, { useState, useEffect } from "react";
import { Bell, Check, Sparkles, AlertCircle, BookOpen, Clock, CheckCheck } from "lucide-react";
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

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
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

  const markAsRead = async (notificationId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setNotifications((prev) =>
      prev.map((n) => (n._id === notificationId ? { ...n, read: true } : n))
    );
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

  // Format relative timestamp
  const formatTimeAgo = (dateStr?: string) => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

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

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="View notifications"
        className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 transition-colors relative cursor-pointer"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shadow-md animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-900 dark:text-slate-100">Notifications</span>
                {unreadCount > 0 ? (
                  <span className="bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs px-2 py-0.5 rounded-full font-semibold">
                    {unreadCount} new
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400">All caught up</span>
                )}
              </div>

              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Mark all read</span>
                </button>
              )}
            </div>

            <div className="py-2 space-y-2 max-h-84 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
              {notifications.length === 0 ? (
                <p className="text-center py-8 text-xs text-slate-400">No notifications yet</p>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n._id}
                    onClick={() => markAsRead(n._id)}
                    className={`block pt-2 first:pt-0 cursor-pointer group`}
                  >
                    <Link
                      href={n.linkUrl || "#"}
                      onClick={() => {
                        markAsRead(n._id);
                        setIsOpen(false);
                      }}
                      className={`block p-3 rounded-xl text-xs transition-all border ${
                        n.read
                          ? "bg-slate-50/50 dark:bg-slate-800/30 border-slate-100 dark:border-slate-800/50 text-slate-500 opacity-80"
                          : "bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-200/70 dark:border-indigo-800/60 text-slate-900 dark:text-slate-100 font-medium shadow-2xs ring-1 ring-indigo-500/10"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {!n.read && (
                            <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
                          )}
                          <span className="font-bold text-slate-900 dark:text-slate-100 truncate">
                            {n.title}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                          {formatTimeAgo(n.createdAt)}
                        </span>
                      </div>

                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                        {n.message}
                      </p>

                      {!n.read && (
                        <div className="mt-2 flex justify-end">
                          <button
                            type="button"
                            onClick={(e) => markAsRead(n._id, e)}
                            className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 flex items-center gap-1 hover:underline cursor-pointer"
                          >
                            <Check className="w-3 h-3" />
                            <span>Mark as read</span>
                          </button>
                        </div>
                      )}
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
