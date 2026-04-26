import type { TRPCRouterRecord } from "@trpc/server";

import { desc, eq } from "@acme/db";
import { CreateWaitlistSignupSchema, WaitlistSignup } from "@acme/db/schema";

import { publicProcedure } from "../trpc";

export const waitlistRouter = {
  join: publicProcedure
    .input(CreateWaitlistSignupSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.WaitlistSignup.findFirst({
        where: eq(WaitlistSignup.email, input.email),
      });
      if (existing) {
        return { status: "already_joined" as const };
      }

      await ctx.db.insert(WaitlistSignup).values(input);
      return { status: "joined" as const };
    }),

  latest: publicProcedure.query(({ ctx }) => {
    return ctx.db.query.WaitlistSignup.findMany({
      orderBy: desc(WaitlistSignup.createdAt),
      limit: 50,
    });
  }),
} satisfies TRPCRouterRecord;
