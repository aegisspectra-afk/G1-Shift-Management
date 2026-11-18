"use client";

import { Bell, RotateCcw } from "lucide-react";
import { DEFAULT_SETTINGS } from "@/lib/constants";
import { useAppState } from "@/context/AppStateContext";
import { formatWeekRange } from "@/lib/week-utils";
import { Button } from "@/components/ui/button";

export function TopBar() {
  const { state, updateSettings, resetDemo } = useAppState();
  const notifications =
    state.settings?.notifications ?? DEFAULT_SETTINGS.notifications;

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b border-slate-200/80 bg-white/90 px-5 backdrop-blur-md">
      <div>
        <p className="text-xs text-slate-500">שבוע נוכחי</p>
        <p className="text-sm font-semibold text-slate-900">
          {formatWeekRange(state.weekId)}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => updateSettings({ notifications: !notifications })}
          aria-pressed={notifications}
          title="התראות"
        >
          <Bell
            className={`h-4 w-4 ${notifications ? "text-blue-600" : "text-slate-400"}`}
          />
          <span className="hidden sm:inline">
            {notifications ? "התראות פעילות" : "התראות כבויות"}
          </span>
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={resetDemo}>
          <RotateCcw className="h-4 w-4" />
          איפוס דמו
        </Button>
      </div>
    </header>
  );
}
