import { DEMO_TIMESTAMP } from "../constants";
import type { AppState, AuditEntry, SimulationResult } from "../types";
import { uid } from "../utils";

export type ApplyOptions = {
  overwriteManual?: boolean;
  user?: string;
};

export function applySimulation(
  state: AppState,
  result: SimulationResult,
  options: ApplyOptions = {},
): { state: AppState; audit: AuditEntry[] } {
  const overwriteManual = options.overwriteManual ?? false;
  const user = options.user ?? state.manager.name;
  const now = DEMO_TIMESTAMP;

  const protectedIds = new Set(
    overwriteManual ? [] : result.untouchedManualAssignmentIds,
  );

  let assignments = state.assignments.filter((a) => {
    if (a.weekId !== result.config.weekId) return true;
    if (a.source === "simulation") return false;
    if (protectedIds.has(a.id)) return true;
    if (overwriteManual && a.source === "manual") return false;
    return true;
  });

  const existingKeys = new Set(
    assignments
      .filter((a) => a.weekId === result.config.weekId)
      .map((a) => `${a.unitId}|${a.day}|${a.shift}|${a.employeeId}`),
  );

  const toAdd = result.proposedAssignments.filter((p) => {
    const key = `${p.unitId}|${p.day}|${p.shift}|${p.employeeId}`;
    if (existingKeys.has(key)) return false;
    existingKeys.add(key);
    return true;
  });

  assignments = [...assignments, ...toAdd];

  const audit: AuditEntry = {
    id: uid("aud"),
    action: "simulation_applied",
    user,
    timestamp: now,
    previousValue: `${state.assignments.filter((a) => a.weekId === result.config.weekId).length} שיבוצים`,
    newValue: `${assignments.filter((a) => a.weekId === result.config.weekId).length} שיבוצים (+${toAdd.length})`,
    reason: overwriteManual
      ? "החלת סימולציה כולל דריסת ידני"
      : "החלת סימולציה ללא דריסת ידני",
  };

  return {
    state: {
      ...state,
      assignments,
      pendingSimulation: null,
      scheduleStatus: "draft",
      auditLog: [audit, ...state.auditLog],
    },
    audit: [audit],
  };
}