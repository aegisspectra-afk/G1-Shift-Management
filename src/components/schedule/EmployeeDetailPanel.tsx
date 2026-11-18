"use client";

import { SHIFT_LABELS, SHIFT_TYPES } from "@/lib/constants";
import { getEmployeeWeekStats } from "@/lib/employee-metrics";
import type { AppState } from "@/lib/types";
import { DAYS } from "@/lib/constants";

const STATUS_LABELS = {
  unassigned: "ללא שיבוץ",
  partial: "חלקי",
  full: "מלא",
  over: "מעל היעד",
} as const;

export function EmployeeDetailPanel({
  state,
  employeeId,
  onClose,
}: {
  state: AppState;
  employeeId: string;
  onClose: () => void;
}) {
  const employee = state.employees.find((e) => e.id === employeeId);
  if (!employee) return null;

  const stats = getEmployeeWeekStats(state, employeeId, state.weekId);
  const unit = state.units.find((u) => u.id === employee.primaryUnitId);
  const availability = state.availabilities.find(
    (a) => a.employeeId === employeeId && a.weekId === state.weekId,
  );
  const assignments = state.assignments.filter(
    (a) => a.employeeId === employeeId && a.weekId === state.weekId,
  );
  const assignedKeys = new Set(assignments.map((a) => `${a.day}-${a.shift}`));

  const conflicts: string[] = [];
  if (!availability?.submitted) {
    conflicts.push("זמינות לא הוגשה לשבוע זה.");
  }
  if (stats.status === "over") {
    conflicts.push("שעות השיבוץ עולות על יעד השבוע.");
  }

  return (
    <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-slate-900">{employee.name}</p>
          <p className="text-xs text-slate-500">
            {employee.role} · {unit?.name ?? "—"}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-slate-500 hover:text-slate-800"
        >
          סגור
        </button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg bg-white px-2 py-1.5 border border-slate-200">
          <div className="text-slate-500">שעות</div>
          <div className="font-semibold text-slate-800">
            {stats.assignedHours}/{stats.targetHours}
          </div>
        </div>
        <div className="rounded-lg bg-white px-2 py-1.5 border border-slate-200">
          <div className="text-slate-500">נותר</div>
          <div className="font-semibold text-slate-800">
            {stats.remainingHours}
          </div>
        </div>
        <div className="rounded-lg bg-white px-2 py-1.5 border border-slate-200">
          <div className="text-slate-500">משמרות</div>
          <div className="font-semibold text-slate-800">
            {stats.assignedShifts}
          </div>
        </div>
        <div className="rounded-lg bg-white px-2 py-1.5 border border-slate-200">
          <div className="text-slate-500">סטטוס</div>
          <div className="font-semibold text-slate-800">
            {STATUS_LABELS[stats.status]}
          </div>
        </div>
      </div>

      {conflicts.length > 0 && (
        <ul className="mt-3 space-y-1 text-xs text-amber-700">
          {conflicts.map((c) => (
            <li key={c}>• {c}</li>
          ))}
        </ul>
      )}

      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[280px] border-collapse text-[10px]">
          <thead>
            <tr>
              <th className="p-1 text-right text-slate-500" />
              {DAYS.map((d) => (
                <th key={d.index} className="p-1 font-medium text-slate-600">
                  {d.label.slice(0, 1)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SHIFT_TYPES.map((shift) => (
              <tr key={shift}>
                <td className="p-1 text-slate-600">{SHIFT_LABELS[shift]}</td>
                {DAYS.map((d) => {
                  const avail = availability?.entries.find(
                    (e) => e.day === d.index && e.shift === shift,
                  );
                  const assigned = assignedKeys.has(`${d.index}-${shift}`);
                  const submitted = Boolean(availability?.submitted);
                  let cell = "bg-slate-100 text-slate-400";
                  let label = "✕";
                  let title = "לא הגיש את המשמרת";

                  if (assigned || avail?.status === "available") {
                    // ✓ = עובד / זמין
                    cell = assigned
                      ? "bg-blue-100 text-blue-800"
                      : "bg-emerald-100 text-emerald-800";
                    label = "✓";
                    title = assigned ? "משובץ" : "זמין לעבודה";
                  } else if (avail?.status === "unavailable") {
                    // ✕ = לא יכול
                    cell = "bg-rose-100 text-rose-700";
                    label = "✕";
                    title = "לא יכול";
                  } else if (!submitted || !avail) {
                    // ✕ אפור = לא הגיש
                    cell = "bg-slate-100 text-slate-400";
                    label = "✕";
                    title = "לא הגיש את המשמרת";
                  }

                  return (
                    <td key={d.index} className="p-0.5 text-center">
                      <span
                        title={title}
                        className={`inline-flex h-5 w-5 items-center justify-center rounded text-[11px] font-semibold ${cell}`}
                      >
                        {label}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-1 text-[10px] text-slate-500">
          ✓ = עובד · ✕ = לא יכול · ✕ אפור = לא הגיש
        </p>
      </div>
    </div>
  );
}
