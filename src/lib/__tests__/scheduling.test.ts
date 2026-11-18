import { describe, expect, it, beforeEach } from "vitest";
import { DEFAULT_WEIGHTS } from "../constants";
import { createInitialState } from "../demo-data";
import { applySimulation } from "../scheduling/apply";
import { runSimulation } from "../scheduling/simulator";
import { resetUidCounter } from "../utils";

describe("scheduling simulation", () => {
  beforeEach(() => resetUidCounter());

  it("does not mutate the active schedule when simulating", () => {
    const state = createInitialState();
    const before = JSON.stringify(state.assignments);
    runSimulation(state, {
      weekId: state.weekId,
      unitIds: state.units.map((u) => u.id),
      weights: DEFAULT_WEIGHTS,
    });
    expect(JSON.stringify(state.assignments)).toBe(before);
    expect(state.pendingSimulation).toBeNull();
  });

  it("produces deterministic proposal id", () => {
    const state = createInitialState();
    const config = {
      weekId: state.weekId,
      unitIds: ["unit_gd3", "unit_gush_dan"],
      weights: DEFAULT_WEIGHTS,
    };
    const a = runSimulation(state, config);
    const b = runSimulation(state, config);
    expect(a.id).toBe(b.id);
  });

  it("applies simulation only after confirmation", () => {
    const state = createInitialState();
    const result = runSimulation(state, {
      weekId: state.weekId,
      unitIds: ["unit_gd3", "unit_gush_dan"],
      weights: DEFAULT_WEIGHTS,
    });
    const applied = applySimulation(state, result, { overwriteManual: false });
    expect(applied.state.assignments.length).toBeGreaterThanOrEqual(
      state.assignments.length,
    );
    expect(
      applied.state.auditLog.some((a) => a.action === "simulation_applied"),
    ).toBe(true);
  });

  it("does not silently overwrite manual assignments", () => {
    const state = createInitialState();
    const manuals = state.assignments.filter(
      (a) => a.source === "manual" && a.weekId === state.weekId,
    );
    const result = runSimulation(state, {
      weekId: state.weekId,
      unitIds: state.units.map((u) => u.id),
      weights: DEFAULT_WEIGHTS,
    });
    const applied = applySimulation(state, result, { overwriteManual: false });
    for (const m of manuals) {
      expect(applied.state.assignments.some((a) => a.id === m.id)).toBe(true);
    }
  });

  it("generates unfilled shift explanations", () => {
    const state = createInitialState();
    state.units = state.units.map((u) => ({
      ...u,
      requiredStaffing: { morning: 5, afternoon: 5, night: 5 },
    }));
    const result = runSimulation(state, {
      weekId: state.weekId,
      unitIds: ["unit_unit_9"],
      weights: DEFAULT_WEIGHTS,
    });
    expect(result.unfilled.length).toBeGreaterThan(0);
    expect(result.unfilled[0]!.reason.length).toBeGreaterThan(5);
  });
});