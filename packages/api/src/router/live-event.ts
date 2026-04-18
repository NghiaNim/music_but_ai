import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod/v4";

import { and, asc, eq, gte, ilike, isNull, or } from "@acme/db";
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

export const liveEventRouter = {
  all: publicProcedure.input(LiveEventFilters).query(({ ctx, input }) => {
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

    return ctx.db.query.LiveEvent.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: [asc(LiveEvent.date)],
      limit: 100,
    });
  }),
} satisfies TRPCRouterRecord;
