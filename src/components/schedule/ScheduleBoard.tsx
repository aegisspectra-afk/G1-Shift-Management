"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Plus, X } from "lucide-react";
import {
  DAYS,
  SHIFT_LABELS,
  SHIFT_TIME_LABELS,
  SHIFT_TYPES,
} from "@/lib/constants";
import { useAppState } from "@/context/AppStateContext";
import { formatDayHe, weekDaysFromSunday } from "@/lib/week-utils";
import { AssignmentDialog } from "./AssignmentDialog";
import { EmployeeSidebar } from "./EmployeeSidebar";
import { WeekNavigator } from "./WeekNavigator";
import type { Assignment, ShiftSlot } from "@/lib/types";

function AssignmentChip({
  assignment,
  label,
  interactive,
  onOpen,
  onRemove,
}: {
  assignment: Assignment;
  label: string;
  interactive: boolean;
  onOpen: () => void;
  onRemove: () => void;
}) {
  if (!interactive) {
    return (
      <div className="group flex w-full items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-800">
        <button type="button" onClick={onOpen} className="min-w-0 flex-1 truncate text-right">
          {label}
        </button>
      </div>
    );
  }
  return (
    <DraggableAssignment
      id={assignment.id}
      label={label}
      onOpen={onOpen}
      onRemove={onRemove}
    />
  );
}

function DraggableAssignment({
  id,
  label,
  onOpen,
  onRemove,
}: {
  id: string;
  label: string;
  onOpen: () => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: `asg:${id}` });
  return (
    <div
      ref={setNodeRef}
      className="group flex w-full items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 text-xs font-medium text-blue-800"
      style={{
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.5 : 1,
      }}
    >
      <button
        type="button"
        className="min-w-0 flex-1 truncate px-2 py-1 text-right"
        onClick={onOpen}
        {...listeners}
        {...attributes}
      >
        {label}
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="shrink-0 p-1 text-blue-400 opacity-0 transition group-hover:opacity-100 hover:text-rose-600"
        aria-label="הסר שיבוץ"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

function DropCell({
  slot,
  interactive,
  children,
  empty,
  onAdd,
}: {
  slot: ShiftSlot;
  interactive: boolean;
  children: React.ReactNode;
  empty: boolean;
  onAdd: () => void;
}) {
  if (!interactive) {
    return (
      <div className="min-h-[76px] border border-slate-200 bg-white p-1.5">
        <div className="mb-1 text-[10px] text-slate-400">
          {SHIFT_TIME_LABELS[slot.shift]}
        </div>
        <div className="space-y-1">{children}</div>
        {empty && (
          <button
            type="button"
            onClick={onAdd}
            className="mt-1 flex w-full items-center justify-center rounded-lg border border-dashed border-slate-200 py-2 text-slate-400 hover:border-blue-300 hover:text-blue-600"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    );
  }
  return (
    <DroppableCell slot={slot} empty={empty} onAdd={onAdd}>
      {children}
    </DroppableCell>
  );
}

function DroppableCell({
  slot,
  children,
  empty,
  onAdd,
}: {
  slot: ShiftSlot;
  children: React.ReactNode;
  empty: boolean;
  onAdd: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: slot.id });
  return (
    <div
      ref={setNodeRef}
      className={`min-h-[76px] border p-1.5 transition ${
        isOver
          ? "border-blue-400 bg-blue-50"
          : "border-slate-200 bg-white"
      }`}
    >
      <div className="mb-1 text-[10px] text-slate-400">
        {SHIFT_TIME_LABELS[slot.shift]}
      </div>
      <div className="space-y-1">{children}</div>
      {empty && (
        <button
          type="button"
          onClick={onAdd}
          className="mt-1 flex w-full items-center justify-center rounded-lg border border-dashed border-slate-200 py-2 text-slate-400 hover:border-blue-300 hover:text-blue-600"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

export function ScheduleBoard() {
  const { state, tryAssign, tryMove, removeAssignment, setSelectedEmployeeId } =
    useAppState();
  const days = useMemo(() => weekDaysFromSunday(state.weekId), [state.weekId]);
  const activeUnits = useMemo(
    () => state.units.filter((u) => u.active),
    [state.units],
  );

  const [dialogSlot, setDialogSlot] = useState<ShiftSlot | null>(null);
  const [activeDrag, setActiveDrag] = useState<{
    kind: "emp" | "asg";
    id: string;
    label: string;
  } | null>(null);
  const [dndReady, setDndReady] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<"board" | "employees">("board");
  const [chipDetail, setChipDetail] = useState<Assignment | null>(null);

  useEffect(() => {
    setDndReady(true);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(t);
  }, [toast]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const weekSlots = useMemo(
    () => state.slots.filter((s) => s.weekId === state.weekId),
    [state.slots, state.weekId],
  );

  const weekAssignments = useMemo(
    () => state.assignments.filter((a) => a.weekId === state.weekId),
    [state.assignments, state.weekId],
  );

  const onDragStart = (event: DragStartEvent) => {
    const raw = String(event.active.id);
    if (raw.startsWith("emp:")) {
      const empId = raw.slice(4);
      const emp = state.employees.find((e) => e.id === empId);
      setActiveDrag({ kind: "emp", id: empId, label: emp?.name ?? empId });
      return;
    }
    if (raw.startsWith("asg:")) {
      const asgId = raw.slice(4);
      const asg = state.assignments.find((a) => a.id === asgId);
      const emp = asg
        ? state.employees.find((e) => e.id === asg.employeeId)
        : null;
      setActiveDrag({
        kind: "asg",
        id: asgId,
        label: emp?.name ?? asgId,
      });
      return;
    }
    // legacy assignment ids without prefix
    const asg = state.assignments.find((a) => a.id === raw);
    if (asg) {
      const emp = state.employees.find((e) => e.id === asg.employeeId);
      setActiveDrag({ kind: "asg", id: asg.id, label: emp?.name ?? asg.id });
    }
  };

  const onDragEnd = (event: DragEndEvent) => {
    setActiveDrag(null);
    const overId = event.over?.id ? String(event.over.id) : null;
    if (!overId) return;

    const activeRaw = String(event.active.id);
    if (activeRaw.startsWith("emp:")) {
      const empId = activeRaw.slice(4);
      const result = tryAssign(overId, empId);
      setToast(result.message);
      return;
    }

    const asgId = activeRaw.startsWith("asg:")
      ? activeRaw.slice(4)
      : activeRaw;
    const result = tryMove(asgId, overId);
    setToast(result.message);
  };

  const board = (
    <div className="overflow-auto rounded-xl border border-slate-200 bg-white">
      <div
        className="min-w-[960px]"
        style={{
          display: "grid",
          gridTemplateColumns: `112px repeat(${days.length}, minmax(110px, 1fr))`,
        }}
      >
        {/* Sticky date header */}
        <div className="sticky top-0 z-20 border-b border-slate-200 bg-slate-100" />
        {days.map((day, i) => (
          <div
            key={day}
            className="sticky top-0 z-20 border-b border-l border-slate-200 bg-slate-100 px-2 py-2.5 text-center"
          >
            <div className="text-xs font-semibold text-slate-800">
              {DAYS[i]?.label ?? formatDayHe(day)}
            </div>
            <div className="text-[11px] text-slate-500">
              {day.slice(8)}/{day.slice(5, 7)}
            </div>
          </div>
        ))}

        {activeUnits.map((unit) => (
          <div key={unit.id} className="contents">
            <div className="col-span-8 bg-blue-600 px-3 py-2 text-center text-sm font-semibold text-white">
              {unit.name}
            </div>

            {SHIFT_TYPES.map((shift, shiftIdx) => (
              <div key={`${unit.id}-${shift}`} className="contents">
                <div
                  className={`sticky right-0 z-10 flex flex-col justify-center border-b border-l border-orange-200/80 px-2 py-2 text-xs ${
                    shiftIdx < SHIFT_TYPES.length - 1
                      ? "border-b-orange-300"
                      : ""
                  }`}
                  style={{ backgroundColor: "rgba(251, 146, 60, 0.12)" }}
                >
                  <span className="font-semibold text-orange-900">
                    {SHIFT_LABELS[shift]}
                  </span>
                  <span className="text-[10px] text-orange-700/80">
                    {SHIFT_TIME_LABELS[shift]}
                  </span>
                </div>
                {days.map((day) => {
                  const slot = weekSlots.find(
                    (s) =>
                      s.unitId === unit.id &&
                      s.day === day &&
                      s.shift === shift,
                  );
                  if (!slot) {
                    return (
                      <div
                        key={`${unit.id}-${day}-${shift}-empty`}
                        className="min-h-[76px] border border-slate-100 bg-slate-50"
                      />
                    );
                  }
                  const assignments = weekAssignments.filter(
                    (a) => a.slotId === slot.id,
                  );
                  return (
                    <DropCell
                      key={slot.id}
                      slot={slot}
                      interactive={dndReady}
                      empty={assignments.length === 0}
                      onAdd={() => setDialogSlot(slot)}
                    >
                      {assignments.map((a) => {
                        const emp = state.employees.find(
                          (e) => e.id === a.employeeId,
                        );
                        return (
                          <AssignmentChip
                            key={a.id}
                            assignment={a}
                            label={emp?.name ?? a.employeeId}
                            interactive={dndReady}
                            onOpen={() => {
                              setChipDetail(a);
                              setSelectedEmployeeId(a.employeeId);
                            }}
                            onRemove={() => {
                              removeAssignment(a.id);
                              setToast("השיבוץ הוסר.");
                            }}
                          />
                        );
                      })}
                    </DropCell>
                  );
                })}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );

  const content = (
    <div className="flex flex-col gap-4 md:flex-row">
      {/* DOM-first in RTL → visual right sidebar */}
      <div
        className={`${
          mobileTab === "employees" ? "block" : "hidden"
        } md:block`}
      >
        <EmployeeSidebar interactive={dndReady} />
      </div>
      <div
        className={`min-w-0 flex-1 space-y-3 ${
          mobileTab === "board" ? "block" : "hidden"
        } md:block`}
      >
        <WeekNavigator />
        {board}
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="flex gap-2 md:hidden">
        <button
          type="button"
          onClick={() => setMobileTab("board")}
          className={`flex-1 rounded-xl px-3 py-2 text-sm font-medium ${
            mobileTab === "board"
              ? "bg-blue-600 text-white"
              : "bg-slate-100 text-slate-700"
          }`}
        >
          לוח
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("employees")}
          className={`flex-1 rounded-xl px-3 py-2 text-sm font-medium ${
            mobileTab === "employees"
              ? "bg-blue-600 text-white"
              : "bg-slate-100 text-slate-700"
          }`}
        >
          עובדים
        </button>
      </div>

      {dndReady ? (
        <DndContext
          sensors={sensors}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onDragCancel={() => setActiveDrag(null)}
        >
          {content}
          <DragOverlay>
            {activeDrag ? (
              <div className="rounded-lg border border-blue-300 bg-blue-600 px-3 py-2 text-xs font-medium text-white shadow-lg">
                {activeDrag.label}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        content
      )}

      {toast && (
        <div
          className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 shadow-lg"
          role="status"
        >
          {toast}
        </div>
      )}

      {dialogSlot && (
        <AssignmentDialog
          slot={dialogSlot}
          onClose={() => setDialogSlot(null)}
        />
      )}

      {chipDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
            <h3 className="text-base font-semibold text-slate-900">
              פרטי שיבוץ
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              {
                state.employees.find((e) => e.id === chipDetail.employeeId)
                  ?.name
              }{" "}
              · {SHIFT_LABELS[chipDetail.shift]} ·{" "}
              {state.units.find((u) => u.id === chipDetail.unitId)?.name}
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                onClick={() => setChipDetail(null)}
              >
                סגור
              </button>
              <button
                type="button"
                className="rounded-lg bg-rose-600 px-3 py-2 text-sm text-white"
                onClick={() => {
                  removeAssignment(chipDetail.id);
                  setChipDetail(null);
                  setToast("השיבוץ הוסר.");
                }}
              >
                הסר שיבוץ
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
