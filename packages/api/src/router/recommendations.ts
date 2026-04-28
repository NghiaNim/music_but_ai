import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod/v4";

import { buildRecommendations } from "../recommendations";
import { protectedProcedure } from "../trpc";

/**
 * Cache-key fragment a Next.js route can use with `unstable_cache`:
 *
 * ```ts
 * import { recsCacheTag } from "@acme/api";
 * const cached = unstable_cache(
 *   () => caller.recommendations.forUser({ limit: 20 }),
 *   ["recs", userId, lastDerivedAt?.toISOString() ?? "none"],
 *   { tags: [recsCacheTag(userId)], revalidate: 21600 },
 * );
 * ```
 *
 * Mutations (`tasteProfile.update`, `tasteProfile.derive`,
 * `userEvent.toggle`, ticket purchase) call `revalidateTag(recsCacheTag(userId))`
 * to bust the cache when the inputs that produced it change.
 */
export function recsCacheTag(userId: string): string {
  return `recs:${userId}`;
}

export const recommendationsRouter = {
  /**
   * Returns the user's ranked, diversified recommendations across both
   * `Event` and `LiveEvent`. Each item carries a `score` and human-
   * readable `reasons` so the UI can render explainable cards.
   *
   * If the user has no derived taste profile, `hasProfile` is false
   * and `items` is empty — the caller should render the popular feed
   * instead and surface the onboarding nudge.
   */
  forUser: protectedProcedure
    .input(
      z
        .object({
          limit: z.number().int().min(1).max(20).default(20),
        })
        .default({ limit: 20 }),
    )
    .query(({ ctx, input }) => {
      return buildRecommendations(
        { userId: ctx.session.user.id, limit: input.limit },
        ctx.db,
      );
    }),
} satisfies TRPCRouterRecord;
