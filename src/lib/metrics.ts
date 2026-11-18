import { SHIFTS, SHIFT_HOURS } from "./constants";
import type { AppState, Assignment, DashboardMetrics } from "./types";

function requiredSlots(state: AppState): number {
  return state.units
    .filter((u) => u.active)
    .reduce((sum, unit) => {
      let unitSum = 0;
      for (let day = 0; day < 7; day++) {
        for (const shift of SHIFTS) {
          unitSum += unit.requiredStaffing[shift.type];
        }
      }
      return sum + unitSum;
    }, 0);
}

function weekAssignments(state: AppState): Assignment[] {
  return state.assignments.filter((a) => a.weekId === state.weekId);
}

export function computeDashboardMetrics(state: AppState): DashboardMetrics {
  const assignments = weekAssignments(state);
  const required = requiredSlots(state);
  let filledSlots = 0;
  let unfilledSlots = 0;

  for (const unit of state.units.filter((u) => u.active)) {
    for (let day = 0; day < 7; day++) {
      for (const shift of SHIFTS) {
        const need = unit.requiredStaffing[shift.type];
        const have = assignments.filter(
          (a) =>
            a.unitId === unit.id && a.day === day && a.shift === shift.type,
        ).length;
        unfilledSlots += Math.max(0, need - have);
        filledSlots += Math.min(have, need);
      }
    }
  }

  const activeEmployees = state.employees.filter((e) => e.active);
  let employeesBelowTarget = 0;
  let employeesWithNoAssignments = 0;
  let expectedOvertimeHours = 0;
  const warnings: string[] = [];

  for (const employee of activeEmployees) {
    const mine = assignments.filter((a) => a.employeeId === employee.id);
    const shifts = mine.length;
    const hours = shifts * SHIFT_HOURS;
    if (shifts === 0) employeesWithNoAssignments += 1;
    if (shifts < employee.targetWeeklyShifts) employeesBelowTarget += 1;
    if (hours > employee.targetWeeklyShifts * SHIFT_HOURS) {
      expectedOvertimeHours += hours - employee.targetWeeklyShifts * SHIFT_HOURS;
    }
  }

  if (unfilledSlots > 0) warnings.push(`${unfilledSlots} משבצות ללא איוש מלא`);
  if (employeesWithNoAssignments > 0) {
    warnings.push(`${employeesWithNoAssignments} עובדים ללא שיבוץ`);
  }

  const coveragePercent =
    required === 0 ? 100 : Math.round((filledSlots / required) * 100);

  return {
    weekId: state.weekId,
    totalEmployees: activeEmployees.length,
    activeUnits: state.units.filter((u) => u.active).length,
    requiredSlots: required,
    filledSlots,
    unfilledSlots,
    coveragePercent,
    employeesBelowTarget,
    employeesWithNoAssignments,
    expectedOvertimeHours,
    warnings,
    plannedCount: assignments.filter((a) => a.status === "planned").length,
    publishedCount: assignments.filter((a) => a.status === "published").length,
    completedCount: state.assignments.filter((a) => a.status === "completed")
      .length,
  };
}