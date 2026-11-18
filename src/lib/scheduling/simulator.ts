import { DEMO_TIMESTAMP, SHIFTS } from "../constants";
import { validateAssignment } from "../validation/engine";
import type {
  AppState,
  Assignment,
  SimulationConfig,
  SimulationResult,
  UnfilledShiftExplanation,
} from "../types";
import { uid } from "../utils";

function explainUnfilledShift(params: {
  noCandidates: boolean;
  blockedByVehicle: boolean;
  blockedByQualification: boolean;
  blockedByAvailability: boolean;
  blockedByHours: boolean;
}): string {
  if (params.blockedByVehicle) return "משמרת לא אוישה: אין עובדים עם הרשאת רכב.";
  if (params.blockedByQualification) return "משמרת לא אוישה: אין עובדים מוסמכים.";
  if (params.blockedByAvailability) return "משמרת לא אוישה: אין זמינות מתאימה.";
  if (params.blockedByHours) return "משמרת לא אוישה: חריגה ממכסת שעות.";
  if (params.noCandidates) return "משמרת לא אוישה: לא נמצאו מועמדים.";
  return "משמרת לא אוישה: מחסור בכוח אדם.";
}

function scoreEmployee(
  employeeId: string,
  unitId: string,
  state: AppState,
  config: SimulationConfig,
  tentative: Assignment[],
): number {
  const employee = state.employees.find((e) => e.id === employeeId)!;
  const count = tentative.filter((a) => a.employeeId === employeeId).length;
  const w = config.weights;
  let score = w.coverage;
  const avail = state.availabilities.find(
    (a) => a.employeeId === employeeId && a.weekId === config.weekId,
  );
  if (avail?.submitted) score += w.availability;
  score += w.fairness * (1 / (count + 1));
  if (count < employee.minWeeklyShifts) score += w.minimumShifts;
  if (employee.primaryUnitId === unitId) score += w.primaryUnit;
  return score;
}

export function runSimulation(
  state: AppState,
  config: SimulationConfig,
): SimulationResult {
  const now = DEMO_TIMESTAMP;
  const weekAssignments = state.assignments.filter(
    (a) => a.weekId === config.weekId,
  );
  const manualIds = weekAssignments
    .filter((a) => a.source === "manual")
    .map((a) => a.id);

  const tentative: Assignment[] = weekAssignments.map((a) => ({ ...a }));
  const proposed: Assignment[] = [];
  const unfilled: UnfilledShiftExplanation[] = [];
  const softWarnings = [];

  const units = state.units
    .filter((u) => u.active && config.unitIds.includes(u.id))
    .slice()
    .sort((a, b) => a.id.localeCompare(b.id));

  const employees = state.employees
    .filter((e) => e.active)
    .slice()
    .sort((a, b) => a.id.localeCompare(b.id));

  for (const unit of units) {
    const vehicle =
      state.vehicles.find(
        (v) => v.unitId === unit.id && v.available && unit.vehicleIds.includes(v.id),
      ) ?? null;

    for (let day = 0; day < 7; day++) {
      for (const shift of SHIFTS) {
        const required = unit.requiredStaffing[shift.type];
        let filled = tentative.filter(
          (a) =>
            a.unitId === unit.id && a.day === day && a.shift === shift.type,
        ).length;

        const flags = {
          noCandidates: true,
          blockedByVehicle: false,
          blockedByQualification: false,
          blockedByAvailability: false,
          blockedByHours: false,
        };

        while (filled < required) {
          const candidates = employees
            .map((employee) => {
              const availability = state.availabilities.find(
                (a) =>
                  a.employeeId === employee.id && a.weekId === config.weekId,
              );
              const result = validateAssignment(employee, {
                weekId: config.weekId,
                unit,
                day,
                shift: shift.type,
                vehicle,
                existingAssignments: tentative,
                availability,
                policy: state.policy,
              });
              return { employee, result };
            })
            .filter((c) => {
              if (c.result.canAssign) {
                flags.noCandidates = false;
                return true;
              }
              const codes = c.result.hard.map((h) => h.code);
              if (codes.includes("vehicle_auth")) flags.blockedByVehicle = true;
              if (codes.includes("qualification")) flags.blockedByQualification = true;
              if (codes.includes("availability_hard")) flags.blockedByAvailability = true;
              if (codes.includes("max_hours") || codes.includes("max_shifts")) {
                flags.blockedByHours = true;
              }
              return false;
            })
            .sort(
              (a, b) =>
                scoreEmployee(b.employee.id, unit.id, state, config, tentative) -
                scoreEmployee(a.employee.id, unit.id, state, config, tentative),
            );

          const best = candidates[0];
          if (!best) break;

          softWarnings.push(...best.result.soft);

          const slot = state.slots.find(
            (s) =>
              s.weekId === config.weekId &&
              s.unitId === unit.id &&
              s.dayIndex === day &&
              s.shift === shift.type,
          );

          const assignment: Assignment = {
            id: uid("asg"),
            weekId: config.weekId,
            unitId: unit.id,
            day,
            shift: shift.type,
            slotId: slot?.id ?? `${unit.id}-sim-${day}-${shift.type}`,
            employeeId: best.employee.id,
            vehicleId: vehicle?.id ?? null,
            status: "planned",
            source: "simulation",
            createdAt: now,
            updatedAt: now,
          };
          tentative.push(assignment);
          proposed.push(assignment);
          filled += 1;
        }

        if (filled < required) {
          unfilled.push({
            weekId: config.weekId,
            unitId: unit.id,
            day,
            shift: shift.type,
            required,
            filled,
            reason: explainUnfilledShift(flags),
          });
        }
      }
    }
  }

  const required = units.reduce((sum, unit) => {
    let s = 0;
    for (let d = 0; d < 7; d++) {
      for (const shift of SHIFTS) s += unit.requiredStaffing[shift.type];
    }
    return sum + s;
  }, 0);

  const filledSlots =
    required - unfilled.reduce((s, u) => s + (u.required - u.filled), 0);

  const simId = `sim_${config.weekId}_${[...config.unitIds].sort().join("|")}`;

  return {
    id: simId,
    createdAt: now,
    config,
    proposedAssignments: proposed,
    untouchedManualAssignmentIds: manualIds,
    unfilled,
    metrics: {
      coveragePercent:
        required === 0 ? 100 : Math.round((filledSlots / required) * 100),
      filledSlots,
      unfilledSlots: unfilled.reduce((s, u) => s + (u.required - u.filled), 0),
      expectedOvertimeHours: 0,
      employeesBelowMinimum: 0,
      employeesAboveTarget: 0,
      employeesWithNoAssignments: 0,
      hardViolations: 0,
      softWarnings: softWarnings.length,
    },
    softWarnings,
  };
}