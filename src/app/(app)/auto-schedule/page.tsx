"use client";

import { DEFAULT_WEIGHTS } from "@/lib/constants";
import { useAppState } from "@/context/AppStateContext";
import { Button } from "@/components/ui/button";

export default function AutoSchedulePage() {
  const { state, runAutoSchedule, applyPendingSimulation } = useAppState();
  const sim = state.pendingSimulation;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">שיבוץ אוטומטי</h1>
        <p className="mt-1 text-sm text-slate-500">
          סימולציה דטרמיניסטית לפי זמינות, הסמכות ואילוצי מנוחה
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          onClick={() =>
            runAutoSchedule({
              weekId: state.weekId,
              unitIds: state.units.map((u) => u.id),
              weights: DEFAULT_WEIGHTS,
            })
          }
        >
          הרץ סימולציה לכל הגזרות
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={!sim}
          onClick={() => applyPendingSimulation(false)}
        >
          החל תוצאות (שמור ידני)
        </Button>
      </div>

      {sim ? (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">מזהה סימולציה: {sim.id}</p>
          <p className="mt-2 text-2xl font-semibold text-blue-600">
            {sim.metrics.coveragePercent}% כיסוי
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {sim.proposedAssignments.length} שיבוצים מוצעים · {sim.unfilled.length}{" "}
            הסברי משבצות ריקות
          </p>
        </div>
      ) : (
        <p className="text-sm text-slate-500">אין סימולציה פעילה.</p>
      )}
    </div>
  );
}