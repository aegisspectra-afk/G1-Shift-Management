import { describe, expect, it } from "vitest";
import { createInitialState } from "../demo-data";
import { computeDashboardMetrics } from "../metrics";

describe("dashboard metrics", () => {
  it("updates after assignments change", () => {
    const state = createInitialState();
    const before = computeDashboardMetrics(state);
    const next = {
      ...state,
      assignments: state.assignments.filter((a) => a.weekId !== state.weekId),
    };
    const after = computeDashboardMetrics(next);
    expect(after.filledSlots).toBeLessThan(before.filledSlots);
  });

  it("reports planned and completed shifts separately", () => {
    const state = createInitialState();
    const metrics = computeDashboardMetrics(state);
    expect(typeof metrics.plannedCount).toBe("number");
    expect(typeof metrics.completedCount).toBe("number");
    expect(metrics.plannedCount + metrics.publishedCount).toBeGreaterThan(0);
  });
});