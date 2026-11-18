"use client";

import { useAppState } from "@/context/AppStateContext";

export default function UnitsPage() {
  const { state } = useAppState();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">יחידות</h1>
        <p className="mt-1 text-sm text-slate-500">יחידות מבצעיות לסידור</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {state.units.map((unit) => (
          <div
            key={unit.id}
            className="rounded-xl border border-slate-200 bg-white p-4"
          >
            <h2 className="font-medium text-slate-100">{unit.name}</h2>
            <p className="mt-1 text-sm text-slate-500">{unit.area}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
