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
import { and, eq } from "@acme/db";
import { OnboardingSession, UserProfile } from "@acme/db/schema";
import { SaveVisualAnswersSchema, VisualAnswersSchema } from "@acme/validators";

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

  // ─── New taste-onboarding session lifecycle ────────────────────
  // These power the visual-cards / clips / reveal flow under
  // `/onboarding/taste`. Distinct from the legacy voice flow above
  // (which we'll deprecate once the new flow is whole).

  /**
   * Returns the user's in-progress session, or creates a fresh one if
   * none exists. Idempotent: re-calling resumes the same session, so
   * a reload mid-quiz picks up where the user left off.
   *
   * If the user already has a *completed* session, we still return it
   * — the UI can use that signal to redirect to `/profile/taste`.
   */
  getOrCreateSession: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const inProgress = await ctx.db.query.OnboardingSession.findFirst({
      where: and(
        eq(OnboardingSession.userId, userId),
        eq(OnboardingSession.status, "in_progress"),
      ),
      orderBy: (s, { desc }) => [desc(s.createdAt)],
    });

    if (inProgress) return inProgress;

    const completed = await ctx.db.query.OnboardingSession.findFirst({
      where: and(
        eq(OnboardingSession.userId, userId),
        eq(OnboardingSession.status, "complete"),
      ),
      orderBy: (s, { desc }) => [desc(s.completedAt)],
    });
    if (completed) return completed;

    try {
      const [created] = await ctx.db
        .insert(OnboardingSession)
        .values({ userId, phase: "voice", status: "in_progress" })
        .returning();
      if (!created) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create onboarding session",
        });
      }
      return created;
    } catch (err: unknown) {
      const pg = err as { code?: string };
      if (pg.code !== "23505") throw err;
      const concurrent = await ctx.db.query.OnboardingSession.findFirst({
        where: and(
          eq(OnboardingSession.userId, userId),
          eq(OnboardingSession.status, "in_progress"),
        ),
        orderBy: (s, { desc }) => [desc(s.createdAt)],
      });
      if (concurrent) return concurrent;
      throw err;
    }
  }),

  /**
   * Persists a partial set of visual answers. Merges into existing
   * `visualAnswers` so callers can save after every tap (powers the
   * resume-on-reload behaviour).
   *
   * If `markVisualComplete` is true, advances `phase` to "clips".
   * The UI sets this flag only after Q5.
   */
  saveVisualAnswers: protectedProcedure
    .input(
      SaveVisualAnswersSchema.extend({
        markVisualComplete: z.boolean().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const session = await ctx.db.query.OnboardingSession.findFirst({
        where: and(
          eq(OnboardingSession.id, input.sessionId),
          eq(OnboardingSession.userId, userId),
        ),
      });
      if (!session) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Onboarding session not found",
        });
      }

      if (session.status === "complete") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot update answers for a finished onboarding session",
        });
      }

      // Merge with whatever's already persisted (defensive — a
      // dropped network packet shouldn't lose the user's earlier
      // answers).
      const merged = VisualAnswersSchema.parse({
        ...(session.visualAnswers ?? {}),
        ...input.answers,
      });

      const nextPhase: typeof session.phase = input.markVisualComplete
        ? "clips"
        : session.phase === "voice"
          ? "visual"
          : session.phase;

      const [updated] = await ctx.db
        .update(OnboardingSession)
        .set({ visualAnswers: merged, phase: nextPhase })
        .where(eq(OnboardingSession.id, session.id))
        .returning();

      return updated;
    }),
} satisfies TRPCRouterRecord;
