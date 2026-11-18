import { addDays, addWeeks, format, startOfWeek } from "date-fns";
import { he } from "date-fns/locale";

/** Parse yyyy-MM-dd as local calendar day (avoids UTC off-by-one). */
function parseLocalDay(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

export function weekDaysFromSunday(weekId: string): string[] {
  const start = startOfWeek(parseLocalDay(weekId), { weekStartsOn: 0 });
  return Array.from({ length: 7 }, (_, i) =>
    format(addDays(start, i), "yyyy-MM-dd"),
  );
}

export function dayIndexFromIso(weekId: string, dayIso: string): number {
  const start = startOfWeek(parseLocalDay(weekId), { weekStartsOn: 0 }).getTime();
  return Math.round((parseLocalDay(dayIso).getTime() - start) / 86_400_000);
}

export function formatDayHe(day: string): string {
  return format(parseLocalDay(day), "EEEE d/M", { locale: he });
}

export function formatWeekRange(weekId: string): string {
  const days = weekDaysFromSunday(weekId);
  const from = format(parseLocalDay(days[0]), "d MMM", { locale: he });
  const to = format(parseLocalDay(days[6]), "d MMM yyyy", { locale: he });
  return `${from} – ${to}`;
}

export function shiftWeek(weekId: string, delta: number): string {
  return format(
    addWeeks(startOfWeek(parseLocalDay(weekId), { weekStartsOn: 0 }), delta),
    "yyyy-MM-dd",
  );
}

export function nextDay(day: string): string {
  return format(addDays(parseLocalDay(day), 1), "yyyy-MM-dd");
}

export function prevDay(day: string): string {
  return format(addDays(parseLocalDay(day), -1), "yyyy-MM-dd");
}

export function isWeekendDayIndex(day: number): boolean {
  return day === 5 || day === 6;
}
