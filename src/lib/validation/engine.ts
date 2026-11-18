import { SHIFTS, SHIFT_HOURS } from "../constants";
import { getAvailabilityForSlot } from "../availability-rules";
import type {
  AppState,
  Assignment,
  CompatibilityStatus,
  Employee,
  EmployeeWeekAvailability,
  OperationalUnit,
  SchedulePolicy,
  ShiftType,
  ValidationFinding,
  ValidationResult,
  Vehicle,
} from "../types";
import { uid } from "../utils";

export type AssignmentContext = {
  weekId: string;
  unit: OperationalUnit;
  day: number;
  shift: ShiftType;
  vehicle: Vehicle | null;
  existingAssignments: Assignment[];
  availability?: EmployeeWeekAvailability;
  policy: SchedulePolicy;
  ignoreAssignmentId?: string;
};

function finding(partial: Omit<ValidationFinding, "id">): ValidationFinding {
  return { id: uid("find"), ...partial };
}

function assignmentEndHour(day: number, shift: ShiftType): number {
  const meta = SHIFTS.find((s) => s.type === shift)!;
  return day * 24 + meta.endHour;
}

function assignmentStartHour(day: number, shift: ShiftType): number {
  const meta = SHIFTS.find((s) => s.type === shift)!;
  return day * 24 + meta.startHour;
}

export function checkOverlap(
  employeeId: string,
  day: number,
  shift: ShiftType,
  existing: Assignment[],
  ignoreAssignmentId?: string,
): ValidationFinding | null {
  const conflict = existing.find(
    (a) =>
      a.employeeId === employeeId &&
      a.id !== ignoreAssignmentId &&
      a.day === day &&
      a.shift === shift,
  );
  if (!conflict) return null;
  return finding({
    severity: "critical",
    code: "overlap",
    message: "העובד כבר משובץ במשמרת חופפת.",
    employeeId,
    assignmentId: conflict.id,
    day,
    shift,
  });
}

export function checkRestPeriod(
  employeeId: string,
  day: number,
  shift: ShiftType,
  existing: Assignment[],
  minRestHours: number,
  ignoreAssignmentId?: string,
): ValidationFinding | null {
  const start = assignmentStartHour(day, shift);
  const end = assignmentEndHour(day, shift);
  for (const a of existing) {
    if (a.employeeId !== employeeId || a.id === ignoreAssignmentId) continue;
    const aStart = assignmentStartHour(a.day, a.shift);
    const aEnd = assignmentEndHour(a.day, a.shift);
    const gapAfter = start - aEnd;
    const gapBefore = aStart - end;
    const gap = Math.min(
      gapAfter >= 0 ? gapAfter : Infinity,
      gapBefore >= 0 ? gapBefore : Infinity,
    );
    if (gap < minRestHours) {
      return finding({
        severity: "critical",
        code: "rest_period",
        message: `השיבוץ מפר את מדיניות המנוחה (${minRestHours} שעות).`,
        employeeId,
        assignmentId: a.id,
        day,
        shift,
      });
    }
  }
  return null;
}

export function checkMaxHours(
  employee: Employee,
  existing: Assignment[],
  policy: SchedulePolicy,
  ignoreAssignmentId?: string,
): ValidationFinding | null {
  const count = existing.filter(
    (a) => a.employeeId === employee.id && a.id !== ignoreAssignmentId,
  ).length;
  const hours = (count + 1) * (policy.shiftHours || SHIFT_HOURS);
  if (hours > employee.maxWeeklyHours) {
    return finding({
      severity: "critical",
      code: "max_hours",
      message: "השיבוץ יגרום לחריגה ממכסת השעות השבועית.",
      employeeId: employee.id,
    });
  }
  return null;
}

export function checkMaxShifts(
  employee: Employee,
  existing: Assignment[],
  ignoreAssignmentId?: string,
): ValidationFinding | null {
  const count = existing.filter(
    (a) => a.employeeId === employee.id && a.id !== ignoreAssignmentId,
  ).length;
  if (count + 1 > employee.maxWeeklyShifts) {
    return finding({
      severity: "critical",
      code: "max_shifts",
      message: "השיבוץ חורג ממספר המשמרות המרבי השבועי.",
      employeeId: employee.id,
    });
  }
  return null;
}

export function checkAvailability(
  employeeId: string,
  day: number,
  shift: ShiftType,
  availability?: EmployeeWeekAvailability,
): { hard: ValidationFinding | null; soft: ValidationFinding | null; statusHint: CompatibilityStatus | null } {
  const slot = getAvailabilityForSlot(availability, day, shift);
  if (slot === "unavailable") {
    return {
      hard: finding({
        severity: "critical",
        code: "availability_hard",
        message: "העובד לא הגיש זמינות למשמרת זו / סימן כלא זמין.",
        employeeId,
        day,
        shift,
      }),
      soft: null,
      statusHint: "red",
    };
  }
  if (slot === "unknown") {
    return {
      hard: null,
      soft: finding({
        severity: "medium",
        code: "availability_unknown",
        message: "העובד לא הגיש זמינות למשמרת זו.",
        employeeId,
        day,
        shift,
      }),
      statusHint: "gray",
    };
  }
  return { hard: null, soft: null, statusHint: null };
}

export function checkQualification(
  employee: Employee,
  unit: OperationalUnit,
): ValidationFinding | null {
  const missing = unit.requiredQualifications.filter(
    (q) => !employee.qualifications.includes(q),
  );
  if (missing.length === 0) return null;
  return finding({
    severity: "critical",
    code: "qualification",
    message: "העובד אינו מוסמך לפעילות הנדרשת.",
    employeeId: employee.id,
    unitId: unit.id,
  });
}

export function checkVehicleAuth(
  employee: Employee,
  vehicle: Vehicle | null,
): ValidationFinding | null {
  if (!vehicle) return null;
  if (!vehicle.available) {
    return finding({
      severity: "critical",
      code: "vehicle_unavailable",
      message: "הניידת אינה זמינה לשיבוץ.",
      employeeId: employee.id,
    });
  }
  const authorized =
    vehicle.authorizedEmployeeIds.includes(employee.id) ||
    employee.vehicleAuthIds.includes(vehicle.id);
  if (!authorized) {
    return finding({
      severity: "critical",
      code: "vehicle_auth",
      message: "העובד אינו מורשה לרכב הנדרש.",
      employeeId: employee.id,
    });
  }
  return null;
}

function checkSoftWorkload(
  employee: Employee,
  existing: Assignment[],
  ignoreAssignmentId?: string,
): ValidationFinding[] {
  const soft: ValidationFinding[] = [];
  const count = existing.filter(
    (a) => a.employeeId === employee.id && a.id !== ignoreAssignmentId,
  ).length;
  if (count + 1 > employee.targetWeeklyShifts) {
    soft.push(
      finding({
        severity: "medium",
        code: "above_target",
        message: "השיבוץ יעלה על יעד המשמרות השבועי.",
        employeeId: employee.id,
      }),
    );
  }
  return soft;
}

export function validateAssignment(
  employee: Employee,
  ctx: AssignmentContext,
): ValidationResult {
  const hard: ValidationFinding[] = [];
  const soft: ValidationFinding[] = [];
  const reasons: string[] = [];

  if (!employee.active) {
    hard.push(
      finding({
        severity: "critical",
        code: "inactive",
        message: "העובד אינו פעיל במערכת.",
        employeeId: employee.id,
      }),
    );
  }

  const overlap = checkOverlap(
    employee.id,
    ctx.day,
    ctx.shift,
    ctx.existingAssignments,
    ctx.ignoreAssignmentId,
  );
  if (overlap) hard.push(overlap);

  const rest = checkRestPeriod(
    employee.id,
    ctx.day,
    ctx.shift,
    ctx.existingAssignments,
    ctx.policy.minRestHours,
    ctx.ignoreAssignmentId,
  );
  if (rest) hard.push(rest);

  const maxHours = checkMaxHours(
    employee,
    ctx.existingAssignments,
    ctx.policy,
    ctx.ignoreAssignmentId,
  );
  if (maxHours) hard.push(maxHours);

  const maxShifts = checkMaxShifts(
    employee,
    ctx.existingAssignments,
    ctx.ignoreAssignmentId,
  );
  if (maxShifts) hard.push(maxShifts);

  const qual = checkQualification(employee, ctx.unit);
  if (qual) hard.push(qual);

  const vehicle = checkVehicleAuth(employee, ctx.vehicle);
  if (vehicle) hard.push(vehicle);

  const avail = checkAvailability(
    employee.id,
    ctx.day,
    ctx.shift,
    ctx.availability,
  );
  if (avail.hard) hard.push(avail.hard);
  if (avail.soft) soft.push(avail.soft);

  soft.push(
    ...checkSoftWorkload(
      employee,
      ctx.existingAssignments,
      ctx.ignoreAssignmentId,
    ),
  );

  for (const f of hard) reasons.push(f.message);
  for (const f of soft) reasons.push(f.message);

  const canAssign = hard.length === 0;
  let status: CompatibilityStatus = "green";
  if (!canAssign) status = "red";
  else if (avail.statusHint === "gray") status = "gray";
  else if (soft.length > 0) status = "orange";
  else status = "green";

  if (canAssign && status === "green") reasons.unshift("העובד עומד בכל דרישות השיבוץ.");

  return { hard, soft, canAssign, status, reasons };
}

export function getCompatibilityForEmployee(
  state: AppState,
  employeeId: string,
  slotId: string,
  options?: { ignoreAssignmentId?: string },
): ValidationResult {
  const employee = state.employees.find((e) => e.id === employeeId);
  const slot = state.slots.find((s) => s.id === slotId);
  if (!employee || !slot) {
    return {
      hard: [
        finding({
          severity: "critical",
          code: "missing_entity",
          message: "עובד או משבצת לא נמצאו.",
          employeeId,
        }),
      ],
      soft: [],
      canAssign: false,
      status: "red",
      reasons: ["עובד או משבצת לא נמצאו."],
    };
  }

  const unit = state.units.find((u) => u.id === slot.unitId);
  if (!unit) {
    return {
      hard: [
        finding({
          severity: "critical",
          code: "missing_unit",
          message: "יחידה לא נמצאה.",
          employeeId,
        }),
      ],
      soft: [],
      canAssign: false,
      status: "red",
      reasons: ["יחידה לא נמצאה."],
    };
  }

  const vehicle =
    state.vehicles.find((v) => unit.vehicleIds.includes(v.id)) ?? null;
  const availability = state.availabilities.find(
    (a) => a.employeeId === employeeId && a.weekId === slot.weekId,
  );
  const existingAssignments = state.assignments.filter(
    (a) => a.weekId === slot.weekId,
  );

  return validateAssignment(employee, {
    weekId: slot.weekId,
    unit,
    day: slot.dayIndex,
    shift: slot.shift,
    vehicle,
    existingAssignments,
    availability,
    policy: state.policy,
    ignoreAssignmentId: options?.ignoreAssignmentId,
  });
}