import { describe, expect, it } from "vitest";
import { createInitialState } from "../demo-data";
import { DEFAULT_SETTINGS } from "../constants";

describe("createInitialState settings", () => {
  it("always includes notifications settings", () => {
    const state = createInitialState();
    expect(state.settings).toBeDefined();
    expect(state.settings.notifications).toBe(DEFAULT_SETTINGS.notifications);
  });

  it("creates 9 units × 3 shifts × 7 days = 189 slots", () => {
    const state = createInitialState();
    expect(state.units.filter((u) => u.active)).toHaveLength(9);
    expect(state.slots.filter((s) => s.weekId === state.weekId)).toHaveLength(
      189,
    );
  });
});
