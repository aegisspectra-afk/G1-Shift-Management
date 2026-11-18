import type { FindingSeverity, ShiftType, SimulationWeights } from "./types";

export const STORAGE_KEY = "g1-shift-management-v1";
export const STORAGE_VERSION = 3;
export const DEMO_WEEK_ID = "2026-11-15";
export const DEMO_TIMESTAMP = "2026-11-18T10:00:00.000Z";

export const DEFAULT_SETTINGS = { notifications: true } as const;

export const SHIFT_TYPES: ShiftType[] = ["morning", "afternoon", "night"];

export const SHIFT_LABELS: Record<ShiftType, string> = {
  morning: "בוקר",
  afternoon: "צהריים",
  night: "לילה",
};

export const SHIFT_TIME_LABELS: Record<ShiftType, string> = {
  morning: "05:00–13:00",
  afternoon: "13:00–21:00",
  night: "21:00–05:00",
};

export const SHIFTS: {
  type: ShiftType;
  label: string;
  startHour: number;
  endHour: number;
}[] = [
  { type: "morning", label: "בוקר", startHour: 5, endHour: 13 },
  { type: "afternoon", label: "צהריים", startHour: 13, endHour: 21 },
  { type: "night", label: "לילה", startHour: 21, endHour: 29 },
];

export const DAYS = [
  { index: 0, label: "ראשון" },
  { index: 1, label: "שני" },
  { index: 2, label: "שלישי" },
  { index: 3, label: "רביעי" },
  { index: 4, label: "חמישי" },
  { index: 5, label: "שישי" },
  { index: 6, label: "שבת" },
] as const;

export const DEFAULT_WEIGHTS: SimulationWeights = {
  coverage: 30,
  availability: 25,
  fairness: 15,
  avoidOvertime: 15,
  minimumShifts: 10,
  primaryUnit: 5,
};

export const SHIFT_HOURS = 8;

export const DEFAULT_SCHEDULE_POLICY = {
  minRestHours: 8,
  shiftHours: SHIFT_HOURS,
  weekdayRules: {
    minMorning: 2,
    minAfternoon: 2,
    minNight: 2,
    minTotal: 6,
    minDistinctDays: 4,
  },
  weekendRules: { fullWeekendsRequiredPerMonth: 2 },
  defaultSoftWeights: { ...DEFAULT_WEIGHTS },
};

export const SEVERITY_LABELS: Record<FindingSeverity, string> = {
  critical: "קריטי",
  high: "גבוה",
  medium: "בינוני",
  info: "מידע",
};

export const COMPAT_STATUS_CLASSES: Record<
  "green" | "orange" | "red" | "gray",
  string
> = {
  green: "bg-emerald-100 text-emerald-800 border-emerald-200",
  orange: "bg-amber-100 text-amber-800 border-amber-200",
  red: "bg-rose-100 text-rose-800 border-rose-200",
  gray: "bg-slate-100 text-slate-700 border-slate-200",
};
