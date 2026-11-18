export type ShiftType = "morning" | "afternoon" | "night";
export type ScheduleViewMode = "weekly" | "daily";
export type OperationalRole = "סייר" | "מפקד ניידת" | "רכז" | "מדריך";
export type ManagementPermission =
  | "עובד"
  | "מנהל צוות"
  | "מנהל גזרה"
  | "מנהל מערכת";
export type Qualification =
  | "סיור"
  | "אבטחה"
  | "נהיגה מבצעית"
  | "נשק"
  | "הדרכה"
  | "פיקוד ניידת";
export type VehicleType = "ניידת סיור" | "ניידת אבטחה" | "רכב הדרכה";
export type AvailabilityStatus = "available" | "unavailable";
export type AssignmentStatus = "planned" | "published" | "completed";
export type ScheduleStatus = "draft" | "published";
export type CompatibilityStatus = "green" | "orange" | "red" | "gray";
export type FindingSeverity = "critical" | "high" | "medium" | "info";

export type Employee = {
  id: string;
  name: string;
  role: OperationalRole;
  managementPermission: ManagementPermission;
  primaryUnitId: string;
  additionalUnitIds: string[];
  qualifications: Qualification[];
  vehicleAuthIds: string[];
  minWeeklyShifts: number;
  targetWeeklyShifts: number;
  maxWeeklyShifts: number;
  maxWeeklyHours: number;
  active: boolean;
};

export type OperationalUnit = {
  id: string;
  name: string;
  area: string;
  requiredStaffing: Record<ShiftType, number>;
  vehicleIds: string[];
  requiredQualifications: Qualification[];
  active: boolean;
};

export type Vehicle = {
  id: string;
  name: string;
  unitId: string;
  type: VehicleType;
  authorizedEmployeeIds: string[];
  available: boolean;
};

export type ShiftSlot = {
  id: string;
  weekId: string;
  unitId: string;
  day: string;
  dayIndex: number;
  shift: ShiftType;
};

export type Assignment = {
  id: string;
  weekId: string;
  unitId: string;
  day: number;
  shift: ShiftType;
  slotId: string;
  employeeId: string;
  vehicleId: string | null;
  status: AssignmentStatus;
  source: "manual" | "simulation" | "system";
  createdAt: string;
  updatedAt: string;
};

export type AvailabilityEntry = {
  day: number;
  shift: ShiftType;
  status: AvailabilityStatus;
};

export type EmployeeWeekAvailability = {
  employeeId: string;
  weekId: string;
  submitted: boolean;
  entries: AvailabilityEntry[];
};

export type SimulationWeights = {
  coverage: number;
  availability: number;
  fairness: number;
  avoidOvertime: number;
  minimumShifts: number;
  primaryUnit: number;
};

export type SchedulePolicy = {
  minRestHours: number;
  shiftHours: number;
  weekdayRules: {
    minMorning: number;
    minAfternoon: number;
    minNight: number;
    minTotal: number;
    minDistinctDays: number;
  };
  weekendRules: {
    fullWeekendsRequiredPerMonth: number;
  };
  defaultSoftWeights: SimulationWeights;
};

export type SimulationConfig = {
  weekId: string;
  unitIds: string[];
  weights: SimulationWeights;
};

export type UnfilledShiftExplanation = {
  weekId: string;
  unitId: string;
  day: number;
  shift: ShiftType;
  required: number;
  filled: number;
  reason: string;
};

export type SimulationMetrics = {
  coveragePercent: number;
  filledSlots: number;
  unfilledSlots: number;
  expectedOvertimeHours: number;
  employeesBelowMinimum: number;
  employeesAboveTarget: number;
  employeesWithNoAssignments: number;
  hardViolations: number;
  softWarnings: number;
};

export type ValidationFinding = {
  id: string;
  severity: FindingSeverity;
  code: string;
  message: string;
  employeeId?: string;
  assignmentId?: string;
  unitId?: string;
  day?: number;
  shift?: ShiftType;
};

export type ValidationResult = {
  hard: ValidationFinding[];
  soft: ValidationFinding[];
  canAssign: boolean;
  status: CompatibilityStatus;
  reasons: string[];
};

export type SimulationResult = {
  id: string;
  createdAt: string;
  config: SimulationConfig;
  proposedAssignments: Assignment[];
  untouchedManualAssignmentIds: string[];
  unfilled: UnfilledShiftExplanation[];
  metrics: SimulationMetrics;
  softWarnings: ValidationFinding[];
};

export type AuditAction =
  | "assignment_created"
  | "assignment_changed"
  | "simulation_generated"
  | "simulation_applied"
  | "demo_reset";

export type AuditEntry = {
  id: string;
  action: AuditAction;
  user: string;
  timestamp: string;
  previousValue: string | null;
  newValue: string | null;
  reason?: string;
};

export type ManagerProfile = {
  id: string;
  name: string;
  role: string;
};

export type AppSettings = {
  notifications: boolean;
};

export type AppState = {
  version: number;
  manager: ManagerProfile;
  weekId: string;
  scheduleViewMode: ScheduleViewMode;
  dailyViewDay: string;
  employees: Employee[];
  units: OperationalUnit[];
  vehicles: Vehicle[];
  slots: ShiftSlot[];
  assignments: Assignment[];
  availabilities: EmployeeWeekAvailability[];
  auditLog: AuditEntry[];
  policy: SchedulePolicy;
  scheduleStatus: ScheduleStatus;
  pendingSimulation: SimulationResult | null;
  settings: AppSettings;
};

export type DashboardMetrics = {
  weekId: string;
  totalEmployees: number;
  activeUnits: number;
  requiredSlots: number;
  filledSlots: number;
  unfilledSlots: number;
  coveragePercent: number;
  employeesBelowTarget: number;
  employeesWithNoAssignments: number;
  expectedOvertimeHours: number;
  warnings: string[];
  plannedCount: number;
  publishedCount: number;
  completedCount: number;
};