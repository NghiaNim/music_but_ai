export const POINTS_KEY = "classica-points";
// Stores "moduleSlug:unitId" strings, e.g. "instruments:families"
export const COMPLETED_KEY = "classica-completed-units";

export function unitKey(moduleSlug: string, unitId: string): string {
  return `${moduleSlug}:${unitId}`;
}

export function getStoredNumber(key: string): number {
  if (typeof window === "undefined") return 0;
  const v = window.localStorage.getItem(key);
  return v ? Number(v) || 0 : 0;
}

export function getCompletedSet(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(COMPLETED_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

export function countCompletedInModule(
  set: Set<string>,
  moduleSlug: string,
): number {
  let count = 0;
  for (const key of set) {
    if (key.startsWith(`${moduleSlug}:`)) count += 1;
  }
  return count;
}
