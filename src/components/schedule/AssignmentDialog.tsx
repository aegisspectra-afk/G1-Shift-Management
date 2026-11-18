"use client";

import { useMemo, useState } from "react";
import { useAppState } from "@/context/AppStateContext";
import { Button } from "@/components/ui/button";
import {
  COMPAT_STATUS_CLASSES,
  SHIFT_LABELS,
  SHIFT_TIME_LABELS,
} from "@/lib/constants";
import type { CompatibilityStatus, ShiftSlot } from "@/lib/types";
import { getCompatibilityForEmployee } from "@/lib/validation/engine";
import { formatDayHe } from "@/lib/week-utils";

const STATUS_LABELS: Record<CompatibilityStatus, string> = {
  green: "מתאים",
  orange: "אזהרה",
  red: "חסום",
  gray: "לא ידוע",
};

const STATUS_ORDER: Record<CompatibilityStatus, number> = {
  green: 0,
  orange: 1,
  gray: 2,
  red: 3,
};

export function AssignmentDialog({
  slot,
  onClose,
}: {
  slot: ShiftSlot;
  onClose: () => void;
}) {
  const { state, addAssignment } = useAppState();
  const [employeeId, setEmployeeId] = useState("");
  const [confirmSoft, setConfirmSoft] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const assignedIds = useMemo(
    () =>
      new Set(
        state.assignments
          .filter((a) => a.slotId === slot.id)
          .map((a) => a.employeeId),
      ),
    [state.assignments, slot.id],
  );

  const candidates = useMemo(() => {
    return state.employees
      .filter((e) => e.active && !assignedIds.has(e.id))
      .map((emp) => {
        const compat = getCompatibilityForEmployee(state, emp.id, slot.id);
        return { emp, compat };
      })
      .sort((a, b) => {
        const byStatus =
          STATUS_ORDER[a.compat.status] - STATUS_ORDER[b.compat.status];
        if (byStatus !== 0) return byStatus;
        return a.emp.name.localeCompare(b.emp.name, "he");
      });
  }, [state, assignedIds, slot.id]);

  const selected = candidates.find((c) => c.emp.id === employeeId);

  const onConfirm = () => {
    if (!selected) return;
    setError(null);

    if (selected.compat.status === "red" || !selected.compat.canAssign) {
      setError(selected.compat.reasons[0] ?? "לא ניתן לשבץ עובד זה.");
      return;
    }

    if (selected.compat.status === "orange" && !confirmSoft) {
      setConfirmSoft(true);
      setError("יש אזהרות רכות — אשר שוב כדי לשבץ בכל זאת.");
      return;
    }

    addAssignment(slot.id, selected.emp.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
        <h2 className="text-lg font-semibold text-slate-900">שיבוץ עובד</h2>
        <p className="mt-1 text-sm text-slate-500">
          {formatDayHe(slot.day)} · {SHIFT_LABELS[slot.shift]} (
          {SHIFT_TIME_LABELS[slot.shift]}) ·{" "}
          {state.units.find((u) => u.id === slot.unitId)?.name}
        </p>

        <div className="mt-4 max-h-72 space-y-2 overflow-y-auto">
          {candidates.map(({ emp, compat }) => {
            const disabled = compat.status === "red" || !compat.canAssign;
            return (
              <label
                key={emp.id}
                title={compat.reasons.join(" · ")}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 transition ${
                  employeeId === emp.id
                    ? "border-blue-400 bg-blue-50"
                    : "border-slate-200 hover:bg-slate-50"
                } ${disabled ? "opacity-60" : ""}`}
              >
                <input
                  type="radio"
                  name="employee"
                  value={emp.id}
                  checked={employeeId === emp.id}
                  disabled={disabled}
                  onChange={() => {
                    setEmployeeId(emp.id);
                    setConfirmSoft(false);
                    setError(null);
                  }}
                  className="accent-blue-600"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium text-slate-900">
                      {emp.name}
                    </span>
                    <span
                      className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold ${COMPAT_STATUS_CLASSES[compat.status]}`}
                    >
                      {STATUS_LABELS[compat.status]}
                    </span>
                  </div>
                  <p className="truncate text-xs text-slate-500">
                    {emp.role} · {compat.reasons[0] ?? ""}
                  </p>
                </div>
              </label>
            );
          })}
        </div>

        {error && (
          <p className="mt-3 text-sm text-amber-700" role="alert">
            {error}
          </p>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            ביטול
          </Button>
          <Button
            type="button"
            disabled={!employeeId}
            onClick={onConfirm}
            variant={confirmSoft ? "default" : "default"}
          >
            {confirmSoft ? "אשר שיבוץ עם אזהרה" : "שבץ"}
          </Button>
        </div>
      </div>
    </div>
  );
}
