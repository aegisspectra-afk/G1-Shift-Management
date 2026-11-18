import { describe, expect, it, beforeEach } from "vitest";
import { createInitialState } from "../demo-data";
import {
  checkMaxHours,
  checkOverlap,
  checkRestPeriod,
  checkVehicleAuth,
  validateAssignment,
} from "../validation/engine";
import { resetUidCounter } from "../utils";

describe("validation engine", () => {
  beforeEach(() => resetUidCounter());

  const state = createInitialState();
  const unit = state.units.find((u) => u.id === "unit_gd1")!;
  const employee = state.employees.find((e) => e.id === "emp_01")!;
  const vehicle = state.vehicles.find((v) => v.id === "veh_gd1_1")!;

  it("blocks overlapping shifts", () => {
    const existing = state.assignments.filter(
      (a) => a.employeeId === employee.id && a.weekId === state.weekId,
    );
    if (existing.length === 0) {
      existing.push({
        id: "tmp",
        weekId: state.weekId,
        unitId: unit.id,
        day: 0,
        shift: "morning",
        slotId: "tmp",
        employeeId: employee.id,
        vehicleId: vehicle.id,
        status: "planned",
        source: "manual",
        createdAt: "",
        updatedAt: "",
      });
    }
    const hit = checkOverlap(employee.id, existing[0]!.day, existing[0]!.shift, existing);
    expect(hit).not.toBeNull();
  });

  it("blocks missing qualification", () => {
    const north = state.units.find((u) => u.id === "unit_north")!;
    const regular = state.employees.find((e) => e.id === "emp_02")!;
    const result = validateAssignment(regular, {
      weekId: state.weekId,
      unit: north,
      day: 1,
      shift: "morning",
      vehicle: null,
      existingAssignments: [],
      availability: {
        employeeId: regular.id,
        weekId: state.weekId,
        submitted: true,
        entries: [{ day: 1, shift: "morning", status: "available" }],
      },
      policy: state.policy,
    });
    expect(result.canAssign).toBe(false);
    expect(result.hard.some((h) => h.code === "qualification")).toBe(true);
  });

  it("blocks missing vehicle authorization", () => {
    const outsider = { ...employee, id: "emp_xx", vehicleAuthIds: [] as string[] };
    const hit = checkVehicleAuth(outsider, vehicle);
    expect(hit?.code).toBe("vehicle_auth");
  });

  it("blocks hard availability restriction", () => {
    const result = validateAssignment(employee, {
      weekId: state.weekId,
      unit,
      day: 2,
      shift: "night",
      vehicle,
      existingAssignments: [],
      availability: {
        employeeId: employee.id,
        weekId: state.weekId,
        submitted: true,
        entries: [{ day: 2, shift: "night", status: "unavailable" }],
      },
      policy: state.policy,
    });
    expect(result.canAssign).toBe(false);
    expect(result.status).toBe("red");
  });

  it("enforces maximum weekly hours", () => {
    const loaded = { ...employee, maxWeeklyHours: 8 };
    const existing = [
      {
        id: "a1",
        weekId: state.weekId,
        unitId: unit.id,
        day: 0,
        shift: "morning" as const,
        slotId: "s1",
        employeeId: loaded.id,
        vehicleId: null,
        status: "planned" as const,
        source: "manual" as const,
        createdAt: "",
        updatedAt: "",
      },
    ];
    expect(checkMaxHours(loaded, existing, state.policy)).not.toBeNull();
  });

  it("enforces rest period policy", () => {
    const existing = [
      {
        id: "a1",
        weekId: state.weekId,
        unitId: unit.id,
        day: 0,
        shift: "night" as const,
        slotId: "s1",
        employeeId: employee.id,
        vehicleId: null,
        status: "planned" as const,
        source: "manual" as const,
        createdAt: "",
        updatedAt: "",
      },
    ];
    const hit = checkRestPeriod(employee.id, 1, "morning", existing, state.policy.minRestHours);
    expect(hit).not.toBeNull();
  });

  it("marks soft warnings for manager review", () => {
    const result = validateAssignment(employee, {
      weekId: state.weekId,
      unit,
      day: 1,
      shift: "morning",
      vehicle,
      existingAssignments: [],
      availability: undefined,
      policy: state.policy,
    });
    expect(result.status === "gray" || result.soft.length > 0).toBe(true);
  });
});