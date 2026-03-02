import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod/v4";

import { and, desc, eq, gte, ilike, lte, or } from "@acme/db";
import { Event } from "@acme/db/schema";
import { EventFiltersSchema } from "@acme/validators";

import { protectedProcedure, publicProcedure } from "../trpc";

export const eventRouter = {
  all: publicProcedure.input(EventFiltersSchema).query(({ ctx, input }) => {
    const conditions = [];

    if (input.search) {
      conditions.push(
        or(
          ilike(Event.title, `%${input.search}%`),
          ilike(Event.venue, `%${input.search}%`),
          ilike(Event.program, `%${input.search}%`),
        ),
      );
    }
    if (input.genre) {
      conditions.push(eq(Event.genre, input.genre));
    }
    if (input.difficulty) {
      conditions.push(eq(Event.difficulty, input.difficulty));
    }
    if (input.dateFrom) {
      conditions.push(gte(Event.date, input.dateFrom));
    }
    if (input.dateTo) {
      conditions.push(lte(Event.date, input.dateTo));
    }

    return ctx.db.query.Event.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: [desc(Event.date)],
      limit: 50,
    });
  }),

  byId: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(({ ctx, input }) => {
      return ctx.db.query.Event.findFirst({
        where: eq(Event.id, input.id),
      });
    }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(512),
        date: z.coerce.date(),
        venue: z.string().min(1).max(512),
        venueAddress: z.string().optional(),
        program: z.string().min(1),
        description: z.string().min(1),
        difficulty: z.enum(["beginner", "intermediate", "advanced"]),
        genre: z.enum([
          "orchestral",
          "opera",
          "chamber",
          "solo_recital",
          "choral",
          "ballet",
          "jazz",
        ]),
        imageUrl: z.string().url().optional(),
        ticketUrl: z.string().url().optional(),
      }),
    )
    .mutation(({ ctx, input }) => {
      return ctx.db
        .insert(Event)
        .values({
          ...input,
          createdBy: ctx.session.user.id,
        })
        .returning();
    }),
} satisfies TRPCRouterRecord;
