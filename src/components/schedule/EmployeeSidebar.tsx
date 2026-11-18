"use client";

import { useMemo, useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Search } from "lucide-react";
import { useAppState } from "@/context/AppStateContext";
import {
  getEmployeeWeekStats,
  type EmployeeAssignmentStatus,
} from "@/lib/employee-metrics";
import type { OperationalRole } from "@/lib/types";
import { EmployeeDetailPanel } from "./EmployeeDetailPanel";

const STATUS_BADGE: Record<
  EmployeeAssignmentStatus,
  { label: string; className: string }
> = {
  unassigned: {
    label: "ללא שיבוץ",
    className: "bg-slate-100 text-slate-700",
  },
  partial: {
    label: "חלקי",
    className: "bg-amber-100 text-amber-800",
  },
  full: {
    label: "מלא",
    className: "bg-emerald-100 text-emerald-800",
  },
  over: {
    label: "מעל",
    className: "bg-rose-100 text-rose-800",
  },
};

function DraggableEmployeeCard({
  id,
  interactive,
  selected,
  onSelect,
  children,
}: {
  id: string;
  interactive: boolean;
  selected: boolean;
  onSelect: () => void;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `emp:${id}`,
      disabled: !interactive,
    });

  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={onSelect}
      {...(interactive ? { ...listeners, ...attributes } : {})}
      className={`w-full rounded-xl border p-3 text-right transition ${
        selected
          ? "border-blue-400 bg-blue-50 ring-2 ring-blue-500/20"
          : "border-slate-200 bg-white hover:border-slate-300"
      } ${isDragging ? "opacity-50" : ""}`}
      style={{ transform: CSS.Translate.toString(transform) }}
    >
      {children}
    </button>
  );
}

export function EmployeeSidebar({
  interactive = false,
}: {
  interactive?: boolean;
}) {
  const { state, selectedEmployeeId, setSelectedEmployeeId } = useAppState();
  const [search, setSearch] = useState("");
  const [unitFilter, setUnitFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [availFilter, setAvailFilter] = useState<"all" | "yes" | "no">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | EmployeeAssignmentStatus>(
    "all",
  );

  const roles = useMemo(() => {
    const set = new Set(state.employees.map((e) => e.role));
    return Array.from(set).sort();
  }, [state.employees]);

  const employees = useMemo(() => {
    return state.employees
      .filter((e) => e.active)
      .map((e) => {
        const stats = getEmployeeWeekStats(state, e.id, state.weekId);
        const unit = state.units.find((u) => u.id === e.primaryUnitId);
        return { employee: e, stats, unitName: unit?.name ?? "—" };
      })
      .filter(({ employee, stats }) => {
        if (search && !employee.name.includes(search.trim())) return false;
        if (unitFilter !== "all" && employee.primaryUnitId !== unitFilter)
          return false;
        if (roleFilter !== "all" && employee.role !== roleFilter) return false;
        if (availFilter === "yes" && !stats.availableSubmitted) return false;
        if (availFilter === "no" && stats.availableSubmitted) return false;
        if (statusFilter !== "all" && stats.status !== statusFilter)
          return false;
        return true;
      })
      .sort((a, b) => a.employee.name.localeCompare(b.employee.name, "he"));
  }, [
    state,
    search,
    unitFilter,
    roleFilter,
    availFilter,
    statusFilter,
  ]);

  return (
    <aside className="flex w-full shrink-0 flex-col md:sticky md:top-4 md:h-[calc(100vh-7rem)] md:w-[320px]">
      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">עובדים</h2>

        <div className="relative mt-3">
          <Search className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="חיפוש לפי שם..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pr-9 pl-3 text-sm text-slate-900 focus:border-blue-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
        </div>

        <div className="mt-2 grid grid-cols-2 gap-2">
          <select
            value={unitFilter}
            onChange={(e) => setUnitFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-800"
          >
            <option value="all">כל היחידות</option>
            {state.units
              .filter((u) => u.active)
              .map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
          </select>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-800"
          >
            <option value="all">כל התפקידים</option>
            {roles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
          <select
            value={availFilter}
            onChange={(e) =>
              setAvailFilter(e.target.value as "all" | "yes" | "no")
            }
            className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-800"
          >
            <option value="all">זמינות: הכל</option>
            <option value="yes">הוגשה</option>
            <option value="no">לא הוגשה</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value as "all" | EmployeeAssignmentStatus,
              )
            }
            className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-800"
          >
            <option value="all">שיבוץ: הכל</option>
            <option value="unassigned">ללא שיבוץ</option>
            <option value="partial">חלקי</option>
            <option value="full">מלא</option>
            <option value="over">מעל היעד</option>
          </select>
        </div>

        {selectedEmployeeId && (
          <EmployeeDetailPanel
            state={state}
            employeeId={selectedEmployeeId}
            onClose={() => setSelectedEmployeeId(null)}
          />
        )}
      </div>

      <div className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto pr-0.5">
        {employees.map(({ employee, stats, unitName }) => {
          const badge = STATUS_BADGE[stats.status];
          return (
            <DraggableEmployeeCard
              key={employee.id}
              id={employee.id}
              interactive={interactive}
              selected={selectedEmployeeId === employee.id}
              onSelect={() =>
                setSelectedEmployeeId(
                  selectedEmployeeId === employee.id ? null : employee.id,
                )
              }
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {employee.name}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {employee.role as OperationalRole} · {unitName}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-medium ${badge.className}`}
                >
                  {badge.label}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-600">
                <span>{stats.assignedShifts} משמרות</span>
                <span>
                  {stats.assignedHours}/{stats.targetHours} שעות
                </span>
                <span>
                  זמינות:{" "}
                  {stats.availableSubmitted
                    ? stats.unassignedAvailable
                    : "לא הוגשה"}
                </span>
              </div>
            </DraggableEmployeeCard>
          );
        })}
        {employees.length === 0 && (
          <p className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-sm text-slate-500">
            לא נמצאו עובדים
          </p>
        )}
      </div>
    </aside>
  );
}
