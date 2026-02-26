import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod/v4";

import {
  computeExperienceLevel,
  generateOnboardingReply,
  getRandomTracksPerTier,
  ONBOARDING_QUESTIONS,
  textToSpeech,
} from "@acme/ai";
import { eq } from "@acme/db";
import { UserProfile } from "@acme/db/schema";

import { protectedProcedure, publicProcedure } from "../trpc";

export const onboardingRouter = {
  getQuestions: publicProcedure.query(() => {
    return {
      questions: [...ONBOARDING_QUESTIONS],
      tracks: getRandomTracksPerTier().map((t) => ({
        id: t.id,
        file: t.file,
        tier: t.tier,
      })),
    };
  }),

  reply: publicProcedure
    .input(
      z.object({
        questionIndex: z.number().min(0).max(0),
        userAnswer: z.string().min(1).max(2000),
        previousAnswers: z.array(z.string()),
      }),
    )
    .mutation(async ({ input }) => {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "OPENAI_API_KEY not configured",
        });
      }

      const text = await generateOnboardingReply({
        ...input,
        apiKey,
      });

      return { text };
    }),

  speak: publicProcedure
    .input(z.object({ text: z.string().min(1).max(2000) }))
    .mutation(async ({ input }) => {
      const apiKey = process.env.ELEVENLABS_STS_API_KEY;
      if (!apiKey) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "ELEVENLABS_STS_API_KEY not configured",
        });
      }

      try {
        const audioBuffer = await textToSpeech({
          apiKey,
          text: input.text,
        });

        const base64 = Buffer.from(audioBuffer).toString("base64");
        return { audio: base64 };
      } catch (err) {
        const msg = err instanceof Error ? err.message : "TTS failed";
        console.error("[onboarding.speak]", msg);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: msg,
        });
      }
    }),

  complete: protectedProcedure
    .input(
      z.object({
        answers: z.array(z.string()).min(1).max(3),
        ratings: z.object({
          easy: z.number().min(1).max(10),
          medium: z.number().min(1).max(10),
          hard: z.number().min(1).max(10),
        }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const experienceLevel = computeExperienceLevel(
        input.answers,
        input.ratings,
      );

      const existing = await ctx.db.query.UserProfile.findFirst({
        where: eq(UserProfile.userId, ctx.session.user.id),
      });

      if (existing) {
        await ctx.db
          .update(UserProfile)
          .set({
            onboardingCompleted: true,
            onboardingAnswers: input.answers,
            musicTasteEasy: input.ratings.easy,
            musicTasteMedium: input.ratings.medium,
            musicTasteHard: input.ratings.hard,
            experienceLevel,
          })
          .where(eq(UserProfile.id, existing.id));
      } else {
        await ctx.db.insert(UserProfile).values({
          userId: ctx.session.user.id,
          onboardingCompleted: true,
          onboardingAnswers: input.answers,
          musicTasteEasy: input.ratings.easy,
          musicTasteMedium: input.ratings.medium,
          musicTasteHard: input.ratings.hard,
          experienceLevel,
        });
      }

      return { experienceLevel };
    }),
} satisfies TRPCRouterRecord;
