"use client";

import { Button } from "@/components/ui/button";
import { useAppState } from "@/context/AppStateContext";
import { DEFAULT_SETTINGS } from "@/lib/constants";

export default function SettingsPage() {
  const { state, updateSettings, resetDemo } = useAppState();
  const notifications =
    state.settings?.notifications ?? DEFAULT_SETTINGS.notifications;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">הגדרות</h1>
        <p className="mt-1 text-sm text-slate-500">העדפות מערכת ודמו</p>
      </div>

      <label className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
        <span className="text-sm text-slate-800">התראות</span>
        <input
          type="checkbox"
          checked={notifications}
          onChange={(e) => updateSettings({ notifications: e.target.checked })}
          className="h-4 w-4 accent-sky-500"
        />
      </label>

      <Button variant="outline" onClick={resetDemo}>
        איפוס נתוני דמו
      </Button>
    </div>
  );
}
