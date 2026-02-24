import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod/v4";

import { and, desc, eq } from "@acme/db";
import { UserEvent } from "@acme/db/schema";

import { protectedProcedure } from "../trpc";

export const userEventRouter = {
  myEvents: protectedProcedure.query(({ ctx }) => {
    return ctx.db.query.UserEvent.findMany({
      where: eq(UserEvent.userId, ctx.session.user.id),
      with: { event: true },
      orderBy: [desc(UserEvent.createdAt)],
    });
  }),

  statusForEvent: protectedProcedure
    .input(z.object({ eventId: z.string().uuid() }))
    .query(({ ctx, input }) => {
      return ctx.db.query.UserEvent.findFirst({
        where: and(
          eq(UserEvent.userId, ctx.session.user.id),
          eq(UserEvent.eventId, input.eventId),
        ),
      });
    }),

  toggle: protectedProcedure
    .input(
      z.object({
        eventId: z.string().uuid(),
        status: z.enum(["saved", "attended"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.UserEvent.findFirst({
        where: and(
          eq(UserEvent.userId, ctx.session.user.id),
          eq(UserEvent.eventId, input.eventId),
          eq(UserEvent.status, input.status),
        ),
      });

      if (existing) {
        await ctx.db.delete(UserEvent).where(eq(UserEvent.id, existing.id));
        return { action: "removed" as const };
      }

      await ctx.db.insert(UserEvent).values({
        userId: ctx.session.user.id,
        eventId: input.eventId,
        status: input.status,
      });
      return { action: "added" as const };
    }),

  saveReflection: protectedProcedure
    .input(
      z.object({
        userEventId: z.string().uuid(),
        reflection: z.string().max(280),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(UserEvent)
        .set({ reflection: input.reflection })
        .where(
          and(
            eq(UserEvent.id, input.userEventId),
            eq(UserEvent.userId, ctx.session.user.id),
          ),
        )
        .returning();
      return updated;
    }),
} satisfies TRPCRouterRecord;
