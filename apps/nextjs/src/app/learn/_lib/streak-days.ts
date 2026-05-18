export function computeDaysOnApp(
  createdAt: Date | undefined,
  asOf = new Date(),
): number {
  if (createdAt == null) return 0;
  return Math.max(
    1,
    Math.floor(
      (asOf.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24),
    ),
  );
}
