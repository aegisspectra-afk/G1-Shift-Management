"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { DEFAULT_SETTINGS, DEMO_TIMESTAMP } from "@/lib/constants";
import { buildSlots, createInitialState } from "@/lib/demo-data";
import { applySimulation } from "@/lib/scheduling/apply";
import { runSimulation } from "@/lib/scheduling/simulator";
import { clearState, loadState, saveState } from "@/lib/storage";
import type {
  AppSettings,
  AppState,
  Assignment,
  ScheduleViewMode,
  SimulationConfig,
} from "@/lib/types";
import { uid } from "@/lib/utils";
import {
  getCompatibilityForEmployee,
} from "@/lib/validation/engine";
import { weekDaysFromSunday } from "@/lib/week-utils";

type ActionResult = { ok: boolean; message: string };

type AppStateContextValue = {
  state: AppState;
  hydrated: boolean;
  selectedEmployeeId: string | null;
  setSelectedEmployeeId: (id: string | null) => void;
  setWeekId: (weekId: string) => void;
  setScheduleViewMode: (mode: ScheduleViewMode) => void;
  setDailyViewDay: (day: string) => void;
  moveAssignment: (assignmentId: string, targetSlotId: string) => void;
  addAssignment: (slotId: string, employeeId: string) => void;
  removeAssignment: (assignmentId: string) => void;
  tryAssign: (slotId: string, employeeId: string) => ActionResult;
  tryMove: (assignmentId: string, slotId: string) => ActionResult;
  updateSettings: (patch: Partial<AppSettings>) => void;
  runAutoSchedule: (config: SimulationConfig) => void;
  applyPendingSimulation: (overwriteManual?: boolean) => void;
  resetDemo: () => void;
};

const AppStateContext = createContext<AppStateContextValue | null>(null);

function withSafeSettings(state: AppState): AppState {
  return {
    ...state,
    settings: { ...DEFAULT_SETTINGS, ...(state.settings ?? {}) },
  };
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => createInitialState());
  const [hydrated, setHydrated] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    setState(withSafeSettings(loadState()));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveState(withSafeSettings(state));
  }, [state, hydrated]);

  const setWeekId = (weekId: string) => {
    setState((prev) => {
      const days = weekDaysFromSunday(weekId);
      const newWeekSlots = buildSlots(prev.units, weekId);
      const otherSlots = prev.slots.filter((s) => s.weekId !== weekId);
      return withSafeSettings({
        ...prev,
        weekId,
        dailyViewDay: days[0]!,
        slots: [...otherSlots, ...newWeekSlots],
      });
    });
  };

  const setScheduleViewMode = (mode: ScheduleViewMode) => {
    setState((prev) => {
      const days = weekDaysFromSunday(prev.weekId);
      return withSafeSettings({
        ...prev,
        scheduleViewMode: mode,
        dailyViewDay: prev.dailyViewDay || days[0]!,
      });
    });
  };

  const setDailyViewDay = (day: string) => {
    setState((prev) => withSafeSettings({ ...prev, dailyViewDay: day }));
  };

  const moveAssignment = (assignmentId: string, targetSlotId: string) => {
    setState((prev) => {
      const slot = prev.slots.find((s) => s.id === targetSlotId);
      if (!slot) return withSafeSettings(prev);
      const unit = prev.units.find((u) => u.id === slot.unitId);
      return withSafeSettings({
        ...prev,
        assignments: prev.assignments.map((a) =>
          a.id === assignmentId
            ? {
                ...a,
                weekId: slot.weekId,
                slotId: targetSlotId,
                unitId: slot.unitId,
                day: slot.dayIndex,
                shift: slot.shift,
                updatedAt: DEMO_TIMESTAMP,
              }
            : a,
        ),
        auditLog: [
          {
            id: uid("aud"),
            action: "assignment_changed",
            user: prev.manager.name,
            timestamp: DEMO_TIMESTAMP,
            previousValue: assignmentId,
            newValue: `${unit?.name ?? slot.unitId} · ${slot.shift}`,
          },
          ...prev.auditLog,
        ],
      });
    });
  };

  const addAssignment = (slotId: string, employeeId: string) => {
    setState((prev) => {
      const slot = prev.slots.find((s) => s.id === slotId);
      if (!slot) return withSafeSettings(prev);
      const unit = prev.units.find((u) => u.id === slot.unitId);
      const vehicle =
        prev.vehicles.find((v) => unit?.vehicleIds.includes(v.id)) ?? null;
      const employee = prev.employees.find((e) => e.id === employeeId);
      const assignment: Assignment = {
        id: uid("asg"),
        weekId: slot.weekId || prev.weekId,
        unitId: slot.unitId,
        day: slot.dayIndex,
        shift: slot.shift,
        slotId,
        employeeId,
        vehicleId:
          vehicle && employee?.vehicleAuthIds.includes(vehicle.id)
            ? vehicle.id
            : null,
        status: "planned",
        source: "manual",
        createdAt: DEMO_TIMESTAMP,
        updatedAt: DEMO_TIMESTAMP,
      };
      return withSafeSettings({
        ...prev,
        assignments: [...prev.assignments, assignment],
        auditLog: [
          {
            id: uid("aud"),
            action: "assignment_created",
            user: prev.manager.name,
            timestamp: DEMO_TIMESTAMP,
            previousValue: null,
            newValue: `${employee?.name ?? employeeId} → ${unit?.name}`,
          },
          ...prev.auditLog,
        ],
      });
    });
  };

  const removeAssignment = (assignmentId: string) => {
    setState((prev) =>
      withSafeSettings({
        ...prev,
        assignments: prev.assignments.filter((a) => a.id !== assignmentId),
      }),
    );
  };

  const tryAssign = (slotId: string, employeeId: string): ActionResult => {
    const result = getCompatibilityForEmployee(state, employeeId, slotId);
    if (!result.canAssign) {
      return {
        ok: false,
        message: result.reasons[0] ?? "לא ניתן לשבץ — חסימה קשה.",
      };
    }
    addAssignment(slotId, employeeId);
    return {
      ok: true,
      message:
        result.status === "orange" || result.status === "gray"
          ? result.reasons[0] ?? "שובץ עם אזהרה."
          : "השיבוץ בוצע בהצלחה.",
    };
  };

  const tryMove = (assignmentId: string, slotId: string): ActionResult => {
    const assignment = state.assignments.find((a) => a.id === assignmentId);
    if (!assignment) {
      return { ok: false, message: "שיבוץ לא נמצא." };
    }
    const result = getCompatibilityForEmployee(
      state,
      assignment.employeeId,
      slotId,
      { ignoreAssignmentId: assignmentId },
    );
    if (!result.canAssign) {
      return {
        ok: false,
        message: result.reasons[0] ?? "לא ניתן להעביר — חסימה קשה.",
      };
    }
    moveAssignment(assignmentId, slotId);
    return {
      ok: true,
      message:
        result.status === "orange" || result.status === "gray"
          ? result.reasons[0] ?? "הועבר עם אזהרה."
          : "השיבוץ הועבר בהצלחה.",
    };
  };

  const updateSettings = (patch: Partial<AppSettings>) => {
    setState((prev) =>
      withSafeSettings({
        ...prev,
        settings: { ...DEFAULT_SETTINGS, ...prev.settings, ...patch },
      }),
    );
  };

  const runAutoSchedule = (config: SimulationConfig) => {
    setState((prev) => {
      const result = runSimulation(prev, config);
      return withSafeSettings({
        ...prev,
        pendingSimulation: result,
        auditLog: [
          {
            id: uid("aud"),
            action: "simulation_generated",
            user: prev.manager.name,
            timestamp: DEMO_TIMESTAMP,
            previousValue: null,
            newValue: result.id,
          },
          ...prev.auditLog,
        ],
      });
    });
  };

  const applyPendingSimulation = (overwriteManual = false) => {
    setState((prev) => {
      if (!prev.pendingSimulation) return withSafeSettings(prev);
      const { state: next } = applySimulation(prev, prev.pendingSimulation, {
        overwriteManual,
        user: prev.manager.name,
      });
      return withSafeSettings(next);
    });
  };

  const resetDemo = () => {
    clearState();
    setState(createInitialState());
    setSelectedEmployeeId(null);
  };

  return (
    <AppStateContext.Provider
      value={{
        state: withSafeSettings(state),
        hydrated,
        selectedEmployeeId,
        setSelectedEmployeeId,
        setWeekId,
        setScheduleViewMode,
        setDailyViewDay,
        moveAssignment,
        addAssignment,
        removeAssignment,
        tryAssign,
        tryMove,
        updateSettings,
        runAutoSchedule,
        applyPendingSimulation,
        resetDemo,
      }}
    >
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) {
    throw new Error("useAppState must be used within AppStateProvider");
  }
  return ctx;
}
