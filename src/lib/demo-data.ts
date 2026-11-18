import {
  DEFAULT_SCHEDULE_POLICY,
  DEFAULT_SETTINGS,
  DEMO_TIMESTAMP,
  DEMO_WEEK_ID,
  SHIFT_TYPES,
  STORAGE_VERSION,
} from "./constants";
import type {
  AppState,
  Assignment,
  Employee,
  EmployeeWeekAvailability,
  OperationalUnit,
  ShiftSlot,
  ShiftType,
  Vehicle,
} from "./types";
import { dayIndexFromIso, shiftWeek, weekDaysFromSunday } from "./week-utils";

function staffing(n = 1): Record<ShiftType, number> {
  return { morning: n, afternoon: n, night: n };
}

export function createUnits(): OperationalUnit[] {
  return [
    {
      id: "unit_shfela_2",
      name: "שפלה 2",
      area: "שפלה",
      requiredStaffing: staffing(1),
      vehicleIds: ["veh_s2_1"],
      requiredQualifications: ["סיור", "נהיגה מבצעית"],
      active: true,
    },
    {
      id: "unit_shfela_3",
      name: "שפלה 3",
      area: "שפלה",
      requiredStaffing: staffing(1),
      vehicleIds: ["veh_s3_1"],
      requiredQualifications: ["סיור"],
      active: true,
    },
    {
      id: "unit_north",
      name: "אבטחה צפון",
      area: "צפון",
      requiredStaffing: staffing(1),
      vehicleIds: ["veh_n_1", "veh_n_2"],
      requiredQualifications: ["אבטחה", "נשק"],
      active: true,
    },
    {
      id: "unit_gd1",
      name: 'ג"ד 1',
      area: "מרכז",
      requiredStaffing: staffing(1),
      vehicleIds: ["veh_gd1_1", "veh_gd1_2"],
      requiredQualifications: ["סיור", "נהיגה מבצעית"],
      active: true,
    },
    {
      id: "unit_gd3",
      name: 'ג"ד 3',
      area: "מרכז",
      requiredStaffing: staffing(1),
      vehicleIds: ["veh_gd3_1"],
      requiredQualifications: ["סיור"],
      active: true,
    },
    {
      id: "unit_gush_dan",
      name: "מרכז גוש דן",
      area: "מרכז גוש דן",
      requiredStaffing: staffing(1),
      vehicleIds: ["veh_gush_1"],
      requiredQualifications: ["סיור"],
      active: true,
    },
    {
      id: "unit_shfela_1",
      name: "שפלה 1",
      area: "שפלה",
      requiredStaffing: staffing(1),
      vehicleIds: ["veh_s1_1"],
      requiredQualifications: ["סיור"],
      active: true,
    },
    {
      id: "unit_center_2",
      name: "מרכז 2",
      area: "מרכז",
      requiredStaffing: staffing(1),
      vehicleIds: ["veh_c2_1"],
      requiredQualifications: ["סיור"],
      active: true,
    },
    {
      id: "unit_unit_9",
      name: "יחידה 9",
      area: "מרכז",
      requiredStaffing: staffing(1),
      vehicleIds: ["veh_u9_1"],
      requiredQualifications: ["סיור"],
      active: true,
    },
  ];
}

export function createVehicles(): Vehicle[] {
  return [
    { id: "veh_s2_1", name: "ניידת שפלה-21", unitId: "unit_shfela_2", type: "ניידת סיור", authorizedEmployeeIds: [], available: true },
    { id: "veh_s3_1", name: "ניידת שפלה-31", unitId: "unit_shfela_3", type: "ניידת סיור", authorizedEmployeeIds: [], available: true },
    { id: "veh_n_1", name: "ניידת צפון-1", unitId: "unit_north", type: "ניידת אבטחה", authorizedEmployeeIds: [], available: true },
    { id: "veh_n_2", name: "ניידת צפון-2", unitId: "unit_north", type: "ניידת אבטחה", authorizedEmployeeIds: [], available: true },
    { id: "veh_gd1_1", name: 'ניידת ג"ד1-א', unitId: "unit_gd1", type: "ניידת סיור", authorizedEmployeeIds: [], available: true },
    { id: "veh_gd1_2", name: 'ניידת ג"ד1-ב', unitId: "unit_gd1", type: "ניידת סיור", authorizedEmployeeIds: [], available: true },
    { id: "veh_gd3_1", name: 'ניידת ג"ד3', unitId: "unit_gd3", type: "ניידת סיור", authorizedEmployeeIds: [], available: true },
    { id: "veh_gush_1", name: "ניידת גוש דן", unitId: "unit_gush_dan", type: "ניידת סיור", authorizedEmployeeIds: [], available: true },
    { id: "veh_s1_1", name: "ניידת שפלה-11", unitId: "unit_shfela_1", type: "ניידת סיור", authorizedEmployeeIds: [], available: true },
    { id: "veh_c2_1", name: "ניידת מרכז-2", unitId: "unit_center_2", type: "ניידת סיור", authorizedEmployeeIds: [], available: true },
    { id: "veh_u9_1", name: "ניידת יחידה-9", unitId: "unit_unit_9", type: "ניידת סיור", authorizedEmployeeIds: [], available: true },
  ];
}

const NAMES = [
  "יואב כהן", "נועה לוי", "איתי מזרחי", "שירה אברהם", "דניאל פרץ",
  "מאיה דהן", "עומר ביטון", "תמר אזולאי", "אריאל שמעון", "ליאור חדד",
  "יעל רוזן", "גיא אשכנזי", "הילה סופר", "רועי מלכה", "מיכל ברק",
  "עמית קדוש", "נטע פרידמן", "אורי נחום", "דנה שמש", "אלון גבאי",
  "קרן לוין", "יונתן סבג", "עדי מור", "בן אליהו", "רותם כץ",
];

const UNIT_IDS = [
  "unit_shfela_2",
  "unit_shfela_3",
  "unit_north",
  "unit_gd1",
  "unit_gd3",
  "unit_gush_dan",
  "unit_shfela_1",
  "unit_center_2",
  "unit_unit_9",
];

function buildEmployees(vehicles: Vehicle[]): Employee[] {
  return NAMES.map((name, i) => {
    const primaryUnitId = UNIT_IDS[i % UNIT_IDS.length]!;
    const vehForUnit = vehicles.filter((v) => v.unitId === primaryUnitId);
    const vehicleAuthIds = vehForUnit.slice(0, 2).map((v) => v.id);
    const isCommander = i % 7 === 0;
    const isCoordinator = i % 11 === 0;
    const isTrainer = i % 13 === 0;
    const qualifications: Employee["qualifications"] = ["סיור"];
    if (primaryUnitId === "unit_north") {
      qualifications.push("אבטחה", "נשק");
    }
    if (vehicleAuthIds.length) qualifications.push("נהיגה מבצעית");
    if (isCommander) qualifications.push("פיקוד ניידת");
    if (isTrainer) qualifications.push("הדרכה");

    return {
      id: `emp_${String(i + 1).padStart(2, "0")}`,
      name,
      role: isTrainer ? "מדריך" : isCommander ? "מפקד ניידת" : isCoordinator ? "רכז" : "סייר",
      managementPermission: isCoordinator ? "מנהל גזרה" : isCommander ? "מנהל צוות" : "עובד",
      primaryUnitId,
      additionalUnitIds: [UNIT_IDS[(i + 3) % UNIT_IDS.length]!].filter(
        (id) => id !== primaryUnitId,
      ),
      qualifications,
      vehicleAuthIds,
      minWeeklyShifts: 3,
      targetWeeklyShifts: 5,
      maxWeeklyShifts: 6,
      maxWeeklyHours: 48,
      active: i !== 23,
    };
  });
}

function syncVehicleAuth(vehicles: Vehicle[], employees: Employee[]): Vehicle[] {
  return vehicles.map((v) => ({
    ...v,
    authorizedEmployeeIds: employees
      .filter((e) => e.vehicleAuthIds.includes(v.id))
      .map((e) => e.id),
  }));
}

function patternEntries(
  kind: "full" | "weekdays" | "partial" | "nights" | "empty",
): EmployeeWeekAvailability["entries"] {
  const entries: EmployeeWeekAvailability["entries"] = [];
  const shifts: ShiftType[] = SHIFT_TYPES;
  for (let day = 0; day < 7; day++) {
    for (const shift of shifts) {
      let status: "available" | "unavailable" = "unavailable";
      if (kind === "full") status = "available";
      else if (kind === "weekdays" && day <= 4) status = "available";
      else if (kind === "partial" && (day + shifts.indexOf(shift)) % 2 === 0)
        status = "available";
      else if (kind === "nights" && shift === "night") status = "available";
      entries.push({ day, shift, status });
    }
  }
  return entries;
}

function createAvailabilities(
  employees: Employee[],
  weekId: string,
): EmployeeWeekAvailability[] {
  const kinds: Array<"full" | "weekdays" | "partial" | "nights" | "empty"> = [
    "full",
    "weekdays",
    "partial",
    "nights",
    "full",
  ];
  return employees.map((e, i) => {
    const missing = i % 9 === 0;
    return {
      employeeId: e.id,
      weekId,
      submitted: !missing,
      entries: missing ? [] : patternEntries(kinds[i % kinds.length]!),
    };
  });
}

/** Always creates all 3 shifts × 7 days for every active unit (9×3×7 = 189). */
export function buildSlots(units: OperationalUnit[], weekId: string): ShiftSlot[] {
  const days = weekDaysFromSunday(weekId);
  const slots: ShiftSlot[] = [];
  for (const unit of units.filter((u) => u.active)) {
    for (const day of days) {
      const dayIndex = dayIndexFromIso(weekId, day);
      for (const shift of SHIFT_TYPES) {
        slots.push({
          id: `${unit.id}-${day}-${shift}`,
          weekId,
          unitId: unit.id,
          day,
          dayIndex,
          shift,
        });
      }
    }
  }
  return slots;
}

function createAssignments(
  employees: Employee[],
  units: OperationalUnit[],
  vehicles: Vehicle[],
  slots: ShiftSlot[],
  weekId: string,
  now: string,
): Assignment[] {
  const assignments: Assignment[] = [];
  const days = weekDaysFromSunday(weekId);
  const seeds: Array<{ slotId: string; empIndex: number }> = [
    { slotId: `unit_gd1-${days[0]}-morning`, empIndex: 0 },
    { slotId: `unit_gd1-${days[0]}-afternoon`, empIndex: 4 },
    { slotId: `unit_gd3-${days[1]}-morning`, empIndex: 1 },
    { slotId: `unit_gd3-${days[1]}-night`, empIndex: 2 },
    { slotId: `unit_shfela_2-${days[2]}-morning`, empIndex: 6 },
    { slotId: `unit_shfela_3-${days[2]}-afternoon`, empIndex: 7 },
    { slotId: `unit_north-${days[3]}-morning`, empIndex: 8 },
    { slotId: `unit_gush_dan-${days[0]}-morning`, empIndex: 5 },
    { slotId: `unit_unit_9-${days[4]}-afternoon`, empIndex: 14 },
  ];

  const slotById = new Map(slots.map((s) => [s.id, s]));
  let n = 0;
  for (const seed of seeds) {
    const slot = slotById.get(seed.slotId);
    const employee = employees[seed.empIndex];
    if (!slot || !employee?.active) continue;
    const unit = units.find((u) => u.id === slot.unitId)!;
    const vehicle = vehicles.find((v) => v.id === unit.vehicleIds[0]) ?? null;
    n += 1;
    assignments.push({
      id: `asg_seed_${n}`,
      weekId,
      unitId: slot.unitId,
      day: slot.dayIndex,
      shift: slot.shift,
      slotId: slot.id,
      employeeId: employee.id,
      vehicleId:
        vehicle && employee.vehicleAuthIds.includes(vehicle.id)
          ? vehicle.id
          : null,
      status: n % 5 === 0 ? "published" : "planned",
      source: "manual",
      createdAt: now,
      updatedAt: now,
    });
  }

  const prev = shiftWeek(weekId, -1);
  assignments.push({
    id: "asg_completed_1",
    weekId: prev,
    unitId: "unit_gd1",
    day: 0,
    shift: "morning",
    slotId: `hist-${prev}`,
    employeeId: employees[0]!.id,
    vehicleId: "veh_gd1_1",
    status: "completed",
    source: "manual",
    createdAt: now,
    updatedAt: now,
  });

  return assignments;
}

export function createInitialState(): AppState {
  const weekId = DEMO_WEEK_ID;
  const now = DEMO_TIMESTAMP;
  const units = createUnits();
  let vehicles = createVehicles();
  const employees = buildEmployees(vehicles);
  vehicles = syncVehicleAuth(vehicles, employees);
  const slots = buildSlots(units, weekId);
  const availabilities = createAvailabilities(employees, weekId);
  const assignments = createAssignments(
    employees,
    units,
    vehicles,
    slots,
    weekId,
    now,
  );
  const days = weekDaysFromSunday(weekId);

  return {
    version: STORAGE_VERSION,
    manager: {
      id: "mgr_01",
      name: "עדי מנהלת",
      role: "מנהלת סידור משמרות",
    },
    weekId,
    scheduleViewMode: "weekly",
    dailyViewDay: days[0]!,
    employees,
    units,
    vehicles,
    slots,
    assignments,
    availabilities,
    auditLog: [
      {
        id: "aud_1",
        action: "assignment_created",
        user: "עדי מנהלת",
        timestamp: now,
        previousValue: null,
        newValue: 'יואב כהן → ג"ד 1 בוקר',
      },
      {
        id: "aud_2",
        action: "simulation_generated",
        user: "עדי מנהלת",
        timestamp: now,
        previousValue: null,
        newValue: "סימולציה לדוגמה",
        reason: "בדיקת כיסוי שבועי",
      },
    ],
    policy: {
      ...DEFAULT_SCHEDULE_POLICY,
      defaultSoftWeights: { ...DEFAULT_SCHEDULE_POLICY.defaultSoftWeights },
    },
    scheduleStatus: "draft",
    pendingSimulation: null,
    settings: { ...DEFAULT_SETTINGS },
  };
}
