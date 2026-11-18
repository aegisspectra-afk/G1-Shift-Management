"use client";

import { useAppState } from "@/context/AppStateContext";

export default function ReportsPage() {
  const { state } = useAppState();
  const byUnit = state.units.map((unit) => {
    const slots = state.slots.filter((s) => s.unitId === unit.id);
    const filled = state.assignments.filter((a) =>
      slots.some((s) => s.id === a.slotId),
    ).length;
    return {
      name: unit.name,
      filled,
      total: slots.length,
      pct: slots.length ? Math.round((filled / slots.length) * 100) : 0,
    };
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">דוחות</h1>
        <p className="mt-1 text-sm text-slate-500">כיסוי משמרות לפי יחידה</p>
      </div>
      <div className="space-y-2">
        {byUnit.map((row) => (
          <div
            key={row.name}
            className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3"
          >
            <span className="text-sm text-slate-800">{row.name}</span>
            <span className="text-sm text-blue-600">
              {row.pct}% ({row.filled}/{row.total})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
