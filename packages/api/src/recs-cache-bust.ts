import { recsCacheTag } from "./router/recommendations";

/**
 * Best-effort cache invalidation for the per-user recommendations
 * cache. Calls Next.js's `revalidateTag` when running inside a Next
 * server runtime; silently no-ops elsewhere (Expo, scripts, tests).
 *
 * Defensive: any error is swallowed and logged. A failed cache bust
 * is a minor freshness issue, never worth failing a user mutation.
 */
export async function bustRecommendationsCache(userId: string): Promise<void> {
  try {
    // `next/cache` is only available when this code runs inside Next.
    // We don't want @acme/api to declare a hard dependency on Next
    // (it's also imported by Expo, scripts, etc.), so we resolve the
    // module dynamically and tolerate it being missing at compile + run.
    const mod = (await import(
      // @ts-expect-error — `next/cache` is not a dep of @acme/api;
      // present at runtime only when running inside the Next.js app.
      "next/cache"
    )) as { revalidateTag?: (tag: string) => void };
    mod.revalidateTag?.(recsCacheTag(userId));
  } catch (err) {
    if (process.env.DEBUG_RECS_CACHE) {
      console.warn(
        "[recs-cache] no-op:",
        err instanceof Error ? err.message : String(err),
      );
    }
  }
}
