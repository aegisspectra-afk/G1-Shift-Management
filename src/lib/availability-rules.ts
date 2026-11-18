import { SHIFTS } from "./constants";
import type {
  AvailabilityEntry,
  EmployeeWeekAvailability,
  SchedulePolicy,
  ShiftType,
} from "./types";
import { isWeekendDayIndex } from "./week-utils";

function countByShift(
  entries: AvailabilityEntry[],
  filter: (day: number) => boolean,
) {
  const available = entries.filter(
    (e) => filter(e.day) && e.status === "available",
  );
  return {
    morning: available.filter((e) => e.shift === "morning").length,
    afternoon: available.filter((e) => e.shift === "afternoon").length,
    night: available.filter((e) => e.shift === "night").length,
    total: available.length,
    distinctDays: new Set(available.map((e) => e.day)).size,
  };
}

export function evaluateWeeklyWeekdayRequirements(
  entries: AvailabilityEntry[],
  policy: SchedulePolicy,
) {
  const counts = countByShift(entries, (day) => !isWeekendDayIndex(day));
  const { weekdayRules: r } = policy;
  const failures: string[] = [];
  if (counts.morning < r.minMorning) failures.push("חסרות זמינויות בוקר בימי חול");
  if (counts.afternoon < r.minAfternoon) failures.push("חסרות זמינויות צהריים בימי חול");
  if (counts.night < r.minNight) failures.push("חסרות זמינויות לילה בימי חול");
  if (counts.total < r.minTotal) failures.push("סה״כ זמינויות בימי חול נמוך");
  if (counts.distinctDays < r.minDistinctDays) failures.push("כיסוי ימים חלקי");
  return { ok: failures.length === 0, counts, failures };
}

export function isFullWeekend(entries: AvailabilityEntry[], fridayIndex = 5) {
  const saturday = fridayIndex + 1;
  return SHIFTS.every(
    (shift) =>
      entries.some((e) => e.day === fridayIndex && e.shift === shift.type && e.status === "available") &&
      entries.some((e) => e.day === saturday && e.shift === shift.type && e.status === "available"),
  );
}

export function countFullWeekendsInMonth(monthAvailabilities: EmployeeWeekAvailability[]) {
  return monthAvailabilities.filter((w) => w.submitted && isFullWeekend(w.entries)).length;
}

export function evaluateMonthlyWeekendAvailability(
  monthAvailabilities: EmployeeWeekAvailability[],
  policy: SchedulePolicy,
) {
  const full = countFullWeekendsInMonth(monthAvailabilities);
  const required = policy.weekendRules.fullWeekendsRequiredPerMonth;
  const failures: string[] = [];
  if (full < required) failures.push(`חסרים סופי שבוע מלאים בחודש (${full}/${required})`);
  return { ok: failures.length === 0, fullWeekends: full, required, failures };
}

export function getAvailabilityForSlot(
  week: EmployeeWeekAvailability | undefined,
  day: number,
  shift: ShiftType,
): "available" | "unavailable" | "unknown" {
  if (!week || !week.submitted) return "unknown";
  const entry = week.entries.find((e) => e.day === day && e.shift === shift);
  if (!entry) return "unknown";
  return entry.status;
}

export function getEmployeeWeekAvailability(
  availabilities: EmployeeWeekAvailability[],
  employeeId: string,
  weekId: string,
) {
  return availabilities.find((a) => a.employeeId === employeeId && a.weekId === weekId);
}