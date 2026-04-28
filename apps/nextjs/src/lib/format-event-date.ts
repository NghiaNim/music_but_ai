const LOCALE = "en-US" as const;

export function formatMonthShort(date: Date): string {
  return date.toLocaleDateString(LOCALE, { month: "short" });
}

export function formatWeekdayShort(date: Date): string {
  return date.toLocaleDateString(LOCALE, { weekday: "short" });
}

/** e.g. "Sat, May 2, 2026 · 7:30 PM" — compact feed / cards */
export function formatFriendlyDate(date: Date): string {
  const time = date.toLocaleTimeString(LOCALE, {
    hour: "numeric",
    minute: "2-digit",
  });
  const monthDayYear = date.toLocaleDateString(LOCALE, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `${formatWeekdayShort(date)}, ${monthDayYear} · ${time}`;
}

/** e.g. "Monday, May 2, 2026 at 7:30 PM" — event + live detail */
export function formatLongDateAtTime(date: Date): string {
  const datePart = date.toLocaleDateString(LOCALE, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const timePart = date.toLocaleTimeString(LOCALE, {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${datePart} at ${timePart}`;
}

/** Long date only (no time) — confirmations, etc. */
export function formatLongDateOnly(date: Date): string {
  return date.toLocaleDateString(LOCALE, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/** e.g. "May 2" — tight list rows */
export function formatShortMonthDay(date: Date): string {
  return date.toLocaleDateString(LOCALE, {
    month: "short",
    day: "numeric",
  });
}
