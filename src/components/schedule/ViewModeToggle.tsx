"use client";

import { useAppState } from "@/context/AppStateContext";
import { cn } from "@/lib/utils";

export function ViewModeToggle() {
  const { state, setScheduleViewMode } = useAppState();
  const mode = state.scheduleViewMode;

  return (
    <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
      <button
        type="button"
        onClick={() => setScheduleViewMode("weekly")}
        className={cn(
          "rounded-lg px-3 py-1.5 text-sm font-medium transition",
          mode === "weekly"
            ? "bg-blue-600 text-white"
            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
        )}
      >
        שבועי
      </button>
      <button
        type="button"
        onClick={() => setScheduleViewMode("daily")}
        className={cn(
          "rounded-lg px-3 py-1.5 text-sm font-medium transition",
          mode === "daily"
            ? "bg-blue-600 text-white"
            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
        )}
      >
        יומי
      </button>
    </div>
  );
}
