import type { ConfusionEvent, Mode } from "./types";

function storageKey(mode: Mode): string {
  return `classbridge-confusion-log-${mode}`;
}

/** Migrate legacy unscoped key into mock once */
function migrateLegacy(mode: Mode): ConfusionEvent[] {
  if (typeof window === "undefined") return [];
  if (mode !== "mock") return [];
  const legacy = localStorage.getItem("classbridge-confusion-log");
  if (!legacy) return [];
  try {
    const parsed = JSON.parse(legacy) as ConfusionEvent[];
    if (!Array.isArray(parsed)) return [];
    const tagged = parsed.map((e) => ({
      ...e,
      modeOrigin: (e.modeOrigin ?? "mock") as Mode,
    }));
    localStorage.setItem(storageKey("mock"), JSON.stringify(tagged));
    localStorage.removeItem("classbridge-confusion-log");
    return tagged;
  } catch {
    return [];
  }
}

export function loadEvents(mode: Mode): ConfusionEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(mode));
    if (!raw) return migrateLegacy(mode);
    const parsed = JSON.parse(raw) as ConfusionEvent[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map((e) => ({
      ...e,
      modeOrigin: e.modeOrigin ?? mode,
    }));
  } catch {
    return [];
  }
}

export function saveEvents(mode: Mode, events: ConfusionEvent[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(storageKey(mode), JSON.stringify(events));
}

export function clearEvents(mode: Mode): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(storageKey(mode));
}

export function conceptCounts(
  events: ConfusionEvent[],
): { conceptId: string; conceptLabel: string; count: number }[] {
  const map = new Map<string, { conceptLabel: string; count: number }>();
  for (const e of events) {
    const prev = map.get(e.conceptId);
    if (prev) {
      prev.count += 1;
    } else {
      map.set(e.conceptId, { conceptLabel: e.conceptLabel, count: 1 });
    }
  }
  return [...map.entries()]
    .map(([conceptId, v]) => ({
      conceptId,
      conceptLabel: v.conceptLabel,
      count: v.count,
    }))
    .sort((a, b) => b.count - a.count);
}
