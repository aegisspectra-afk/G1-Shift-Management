import { describe, expect, it } from "vitest";
import {
  evaluateMonthlyWeekendAvailability,
  evaluateWeeklyWeekdayRequirements,
  isFullWeekend,
} from "../availability-rules";
import { createInitialState } from "../demo-data";
import type { AvailabilityEntry } from "../types";

function allAvailable(): AvailabilityEntry[] {
  const entries: AvailabilityEntry[] = [];
  for (let day = 0; day < 7; day++) {
    for (const shift of ["morning", "afternoon", "night"] as const) {
      entries.push({ day, shift, status: "available" });
    }
  }
  return entries;
}

describe("availability rules", () => {
  const policy = createInitialState().policy;

  it("calculates monthly weekend availability correctly", () => {
    expect(isFullWeekend(allAvailable())).toBe(true);

    const month = [
      {
        employeeId: "e1",
        weekId: "2026-11-01",
        submitted: true,
        entries: allAvailable(),
      },
      {
        employeeId: "e1",
        weekId: "2026-11-08",
        submitted: true,
        entries: allAvailable(),
      },
    ];
    const result = evaluateMonthlyWeekendAvailability(month, policy);
    expect(result.ok).toBe(true);
    expect(result.fullWeekends).toBe(2);
  });

  it("evaluates weekday weekly requirements", () => {
    const ok = evaluateWeeklyWeekdayRequirements(allAvailable(), policy);
    expect(ok.ok).toBe(true);

    const weak = evaluateWeeklyWeekdayRequirements(
      [{ day: 0, shift: "morning", status: "available" }],
      policy,
    );
    expect(weak.ok).toBe(false);
  });
});