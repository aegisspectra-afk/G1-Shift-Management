"use client";

import Link from "next/link";
import { CalendarDays, Users, AlertTriangle } from "lucide-react";
import { useAppState } from "@/context/AppStateContext";
import { computeDashboardMetrics } from "@/lib/metrics";

export default function DashboardPage() {
  const { state } = useAppState();
  const metrics = computeDashboardMetrics(state);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">לוח בקרה</h1>
          <p className="mt-1 text-sm text-slate-500">
            סקירה שבועית של כיסוי משמרות ושיבוצים
          </p>
        </div>
        <Link
          href="/schedule"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700"
        >
          <CalendarDays className="h-4 w-4" />
          סידור עבודה
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-500">
            <CalendarDays className="h-4 w-4" />
            <span className="text-sm">כיסוי משמרות</span>
          </div>
          <p className="mt-3 text-3xl font-semibold text-blue-600">
            {metrics.coveragePercent}%
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {metrics.filledSlots} מתוך {metrics.requiredSlots} משבצות
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-500">
            <Users className="h-4 w-4" />
            <span className="text-sm">עובדים פעילים</span>
          </div>
          <p className="mt-3 text-3xl font-semibold text-slate-900">
            {metrics.totalEmployees}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-slate-500">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm">משבצות פנויות</span>
          </div>
          <p className="mt-3 text-3xl font-semibold text-amber-600">
            {metrics.unfilledSlots}
          </p>
        </div>
      </div>
    </div>
  );
}