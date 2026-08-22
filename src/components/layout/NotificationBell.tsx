"use client";

import React, { useState, useEffect } from "react";
import { Bell, Check, Sparkles, AlertCircle, BookOpen, Clock } from "lucide-react";
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
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      _id: "1",
      title: "Live Class in 25 Minutes",
      message: "Class 10 Quadratic Equations batch starts at 7:00 PM.",
      type: "CLASS_REMINDER",
      read: false,
      linkUrl: "/student/classes",
      createdAt: "Just now",
    },
    {
      _id: "2",
      title: "New Worksheet Available",
      message: "Science Ray Diagrams sample questions uploaded by Prof. Rajesh.",
      type: "NEW_MATERIAL",
      read: false,
      linkUrl: "/student/materials",
      createdAt: "1 hour ago",
    },
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 transition-colors relative"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shadow-md animate-pulse">
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
                {unreadCount > 0 && (
                  <span className="bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs px-2 py-0.5 rounded-full font-semibold">
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                >
                  Mark all read
                </button>
              )}
            </div>

            <div className="py-2 space-y-2 max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="text-center py-6 text-xs text-slate-400">No new notifications</p>
              ) : (
                notifications.map((n) => (
                  <Link
                    key={n._id}
                    href={n.linkUrl || "#"}
                    onClick={() => setIsOpen(false)}
                    className={`block p-3 rounded-xl text-xs transition-colors border ${
                      n.read
                        ? "bg-slate-50/50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800/50 text-slate-500"
                        : "bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-100 dark:border-indigo-900/50 text-slate-800 dark:text-slate-200 font-medium"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900 dark:text-slate-100">{n.title}</span>
                      <span className="text-[10px] text-slate-400">{n.createdAt}</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">{n.message}</p>
                  </Link>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
