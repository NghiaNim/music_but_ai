import type { TRPCRouterRecord } from "@trpc/server";
import { z } from "zod/v4";

import { eq } from "@acme/db";
import { UserProfile } from "@acme/db/schema";

import { protectedProcedure } from "../trpc";

export const userProfileRouter = {
  get: protectedProcedure.query(async ({ ctx }) => {
    const profile = await ctx.db.query.UserProfile.findFirst({
      where: eq(UserProfile.userId, ctx.session.user.id),
    });

    if (!profile) {
      const [created] = await ctx.db
        .insert(UserProfile)
        .values({ userId: ctx.session.user.id })
        .returning();
      if (!created) {
        throw new Error("Failed to create user profile");
      }
      return created;
    }

    return profile;
  }),

  update: protectedProcedure
    .input(
      z.object({
        experienceLevel: z.enum(["new", "casual", "enthusiast"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.UserProfile.findFirst({
        where: eq(UserProfile.userId, ctx.session.user.id),
      });

      if (existing) {
        const [updated] = await ctx.db
          .update(UserProfile)
          .set(input)
          .where(eq(UserProfile.id, existing.id))
          .returning();
        if (!updated) {
          throw new Error("Failed to update user profile");
        }
        return updated;
      }

      const [created] = await ctx.db
        .insert(UserProfile)
        .values({ userId: ctx.session.user.id, ...input })
        .returning();
      if (!created) {
        throw new Error("Failed to create user profile");
      }
      return created;
    }),
} satisfies TRPCRouterRecord;
