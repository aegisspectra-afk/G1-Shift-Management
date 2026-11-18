"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppState } from "@/context/AppStateContext";
import { DEMO_WEEK_ID } from "@/lib/constants";
import { formatWeekRange, shiftWeek, weekDaysFromSunday } from "@/lib/week-utils";

export function WeekNavigator() {
  const { state, setWeekId } = useAppState();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setWeekId(shiftWeek(state.weekId, -1))}
          aria-label="שבוע קודם"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setWeekId(shiftWeek(state.weekId, 1))}
          aria-label="שבוע הבא"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setWeekId(DEMO_WEEK_ID)}
        >
          השבוע הנוכחי
        </Button>
        <label className="inline-flex items-center gap-2 text-xs text-slate-500">
          בחירת תאריך
          <input
            type="date"
            value={state.weekId}
            onChange={(event) => {
              const value = event.target.value;
              if (!value) return;
              setWeekId(weekDaysFromSunday(value)[0]!);
            }}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-800"
          />
        </label>
      </div>
      <p className="text-sm font-semibold text-slate-800">
        {formatWeekRange(state.weekId)}
      </p>
    </div>
  );
}
