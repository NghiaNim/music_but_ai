import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod/v4";

import { and, asc, eq, gte, ilike, isNull, or, sql } from "@acme/db";
import { LiveEvent } from "@acme/db/schema";

import { publicProcedure } from "../trpc";

const LiveEventFilters = z.object({
  search: z.string().optional(),
  source: z
    .enum(["carnegie_hall", "met_opera", "juilliard", "msm"])
    .optional(),
  genre: z
    .enum([
      "orchestral",
      "opera",
      "chamber",
      "solo_recital",
      "choral",
      "ballet",
      "jazz",
    ])
    .optional(),
  upcomingOnly: z.boolean().default(true),
});

const LiveEventPageInput = LiveEventFilters.extend({
  /** Page size (we fetch one extra row to detect `hasMore`). */
  limit: z.number().min(1).max(50).default(15),
  /** Row offset; driven by `useInfiniteQuery` / `cursor` from the previous page. */
  cursor: z.number().min(0).default(0),
});

function buildLiveEventWhere(
  input: z.infer<typeof LiveEventPageInput>,
): ReturnType<typeof and> | undefined {
  const conditions = [];

  if (input.upcomingOnly) {
    const now = new Date();
    const upcoming = or(gte(LiveEvent.date, now), isNull(LiveEvent.date));
    if (upcoming) conditions.push(upcoming);
  }
  if (input.source) conditions.push(eq(LiveEvent.source, input.source));
  if (input.genre) conditions.push(eq(LiveEvent.genre, input.genre));
  if (input.search) {
    const searchCond = or(
      ilike(LiveEvent.title, `%${input.search}%`),
      ilike(LiveEvent.venueName, `%${input.search}%`),
    );
    if (searchCond) conditions.push(searchCond);
  }

  conditions.push(eq(LiveEvent.cancelled, false));

  return conditions.length > 0 ? and(...conditions) : undefined;
}

export const liveEventRouter = {
  byId: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const row = await ctx.db.query.LiveEvent.findFirst({
        where: and(eq(LiveEvent.id, input.id), eq(LiveEvent.cancelled, false)),
      });
      if (!row) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
      }
      return row;
    }),

  /**
   * Paginated live venue feed. Use with `infiniteQueryOptions` on the client.
   * Ordering: dated events soonest-first, then rows with no parsed date (e.g. Met).
   */
  page: publicProcedure.input(LiveEventPageInput).query(async ({ ctx, input }) => {
    const where = buildLiveEventWhere(input);
    const take = input.limit + 1;

    const rows = await ctx.db.query.LiveEvent.findMany({
      where,
      orderBy: [
        asc(sql`${LiveEvent.date} IS NULL`),
        asc(LiveEvent.date),
        asc(LiveEvent.id),
      ],
      limit: take,
      offset: input.cursor,
    });

    const hasMore = rows.length > input.limit;
    const items = hasMore ? rows.slice(0, input.limit) : rows;
    const nextCursor = hasMore ? input.cursor + input.limit : null;

    return { items, nextCursor };
  }),
} satisfies TRPCRouterRecord;
