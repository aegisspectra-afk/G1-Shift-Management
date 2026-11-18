import { DEFAULT_SETTINGS, STORAGE_KEY, STORAGE_VERSION } from "./constants";
import { createInitialState } from "./demo-data";
import type { AppState } from "./types";

function mergeDefaults(partial: Partial<AppState> | null | undefined): AppState {
  const fresh = createInitialState();
  if (!partial || typeof partial !== "object") return fresh;

  return {
    ...fresh,
    ...partial,
    version: STORAGE_VERSION,
    manager: partial.manager ?? fresh.manager,
    settings: {
      ...DEFAULT_SETTINGS,
      ...(partial.settings ?? {}),
    },
    policy: partial.policy ?? fresh.policy,
    employees: partial.employees ?? fresh.employees,
    units: partial.units ?? fresh.units,
    vehicles: partial.vehicles ?? fresh.vehicles,
    slots: partial.slots ?? fresh.slots,
    assignments: partial.assignments ?? fresh.assignments,
    availabilities: partial.availabilities ?? fresh.availabilities,
    auditLog: partial.auditLog ?? fresh.auditLog,
    scheduleViewMode: partial.scheduleViewMode ?? "weekly",
    dailyViewDay: partial.dailyViewDay ?? fresh.dailyViewDay,
    weekId: partial.weekId ?? fresh.weekId,
    scheduleStatus: partial.scheduleStatus ?? fresh.scheduleStatus,
    pendingSimulation: partial.pendingSimulation ?? null,
  };
}

function isCoherent(state: AppState): boolean {
  if (!state.units?.length || !state.slots?.length) return false;
  const unitIds = new Set(state.units.map((u) => u.id));
  const sample = state.slots.slice(0, 20);
  return sample.every((slot) => unitIds.has(slot.unitId));
}

export function loadState(): AppState {
  if (typeof window === "undefined") return createInitialState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialState();
    const parsed = JSON.parse(raw) as Partial<AppState>;
    if (parsed.version !== STORAGE_VERSION) return createInitialState();
    const merged = mergeDefaults(parsed);
    return isCoherent(merged) ? merged : createInitialState();
  } catch {
    return createInitialState();
  }
}

export function saveState(state: AppState): void {
  if (typeof window === "undefined") return;
  const safe = mergeDefaults(state);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(safe));
}

export function clearState(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}