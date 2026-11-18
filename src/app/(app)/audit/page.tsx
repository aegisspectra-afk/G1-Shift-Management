"use client";

import { useAppState } from "@/context/AppStateContext";

export default function AuditPage() {
  const { state } = useAppState();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">יומן פעולות</h1>
        <p className="mt-1 text-sm text-slate-500">היסטוריית שינויים בסידור</p>
      </div>
      <ul className="space-y-2">
        {state.auditLog.map((entry) => (
          <li
            key={entry.id}
            className="rounded-lg border border-slate-200 bg-white px-4 py-3"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-slate-100">
                {entry.action}
              </span>
              <span className="text-xs text-slate-500">{entry.timestamp}</span>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              {entry.newValue ?? entry.reason ?? "—"}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}