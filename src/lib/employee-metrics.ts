import type { AppState } from "./types";

export type EmployeeAssignmentStatus =
  | "unassigned"
  | "partial"
  | "full"
  | "over";

export type EmployeeWeekStats = {
  assignedShifts: number;
  assignedHours: number;
  targetHours: number;
  remainingHours: number;
  availableSubmitted: boolean;
  unassignedAvailable: number;
  status: EmployeeAssignmentStatus;
};

export function getEmployeeWeekStats(
  state: AppState,
  employeeId: string,
  weekId: string = state.weekId,
): EmployeeWeekStats {
  const employee = state.employees.find((e) => e.id === employeeId);
  const shiftHours = state.policy.shiftHours || 8;
  const weekAssignments = state.assignments.filter(
    (a) => a.employeeId === employeeId && a.weekId === weekId,
  );
  const assignedShifts = weekAssignments.length;
  const assignedHours = assignedShifts * shiftHours;
  const targetHours = (employee?.targetWeeklyShifts ?? 0) * shiftHours;
  const remainingHours = Math.max(0, targetHours - assignedHours);

  const availability = state.availabilities.find(
    (a) => a.employeeId === employeeId && a.weekId === weekId,
  );
  const availableSubmitted = Boolean(availability?.submitted);
  const availableEntries =
    availability?.entries.filter((e) => e.status === "available") ?? [];
  const assignedKeys = new Set(
    weekAssignments.map((a) => `${a.day}-${a.shift}`),
  );
  const unassignedAvailable = availableEntries.filter(
    (e) => !assignedKeys.has(`${e.day}-${e.shift}`),
  ).length;

  let status: EmployeeAssignmentStatus;
  if (assignedShifts === 0) status = "unassigned";
  else if (assignedHours > targetHours) status = "over";
  else if (assignedHours >= targetHours) status = "full";
  else status = "partial";

  return {
    assignedShifts,
    assignedHours,
    targetHours,
    remainingHours,
    availableSubmitted,
    unassignedAvailable,
    status,
  };
}
