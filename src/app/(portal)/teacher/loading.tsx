import React from "react";

export default function TeacherLoading() {
  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl animate-pulse">
      <div className="space-y-2">
        <div className="h-7 w-48 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        <div className="h-4 w-72 bg-slate-100 dark:bg-slate-800/60 rounded-lg" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4" />
        ))}
      </div>

      <div className="h-72 bg-slate-900 rounded-3xl p-6" />
    </div>
  );
}
