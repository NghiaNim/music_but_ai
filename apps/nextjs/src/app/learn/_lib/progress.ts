import {
  COMPLETED_KEY,
  getStoredNumber as parseStoredNumber,
  parseCompletedUnits,
  POINTS_KEY,
  unitKey,
} from "@acme/validators";

export { COMPLETED_KEY, POINTS_KEY, unitKey };

export function getStoredNumber(key: string): number {
  if (typeof window === "undefined") return 0;
  const v = window.localStorage.getItem(key);
  return parseStoredNumber(v);
}

export function getCompletedSet(): Set<string> {
  if (typeof window === "undefined") return new Set();
  const raw = window.localStorage.getItem(COMPLETED_KEY);
  return parseCompletedUnits(raw);
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
