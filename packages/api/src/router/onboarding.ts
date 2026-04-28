import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod/v4";

import type { ClipReaction, VisualAnswers } from "@acme/validators";
import {
  computeExperienceLevel,
  generateOnboardingReply,
  getRandomTracksPerTier,
  MUSIC_CATALOG,
  ONBOARDING_QUESTIONS,
  pickClipsForOnboarding,
  textToSpeech,
} from "@acme/ai";
import { and, eq } from "@acme/db";
import {
  OnboardingSession,
  UserMusicEvent,
  UserProfile,
} from "@acme/db/schema";
import {
  SaveClipReactionsSchema,
  SaveVisualAnswersSchema,
  VisualAnswersSchema,
} from "@acme/validators";

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
   * Force-creates a brand new in-progress session, marking any prior
   * in-progress one as `complete` first (the unique index requires
   * exactly one in-progress per user). Used by the "Re-take the taste
   * quiz" affordance on `/profile/taste`.
   */
  restartSession: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const existing = await ctx.db.query.OnboardingSession.findFirst({
      where: and(
        eq(OnboardingSession.userId, userId),
        eq(OnboardingSession.status, "in_progress"),
      ),
    });
    if (existing) {
      // Don't lose the data — mark complete so /profile/taste still
      // resolves the user's prior answers in the recommender's negative-
      // signal pass via UserMusicEvent rows.
      await ctx.db
        .update(OnboardingSession)
        .set({ status: "complete", completedAt: new Date() })
        .where(eq(OnboardingSession.id, existing.id));
    }

    const [created] = await ctx.db
      .insert(OnboardingSession)
      .values({ userId, phase: "voice", status: "in_progress" })
      .returning();
    if (!created) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to restart onboarding session",
      });
    }
    return created;
  }),

  /**
   * Saves the Tanny voice conversation transcript to the session
   * and advances `phase` from "voice" → "visual". Idempotent: if
   * the user re-records, the latest transcript wins. Skipping the
   * voice phase calls this with an empty string (or never; the
   * UI just advances the phase locally).
   */
  saveVoiceTranscript: protectedProcedure
    .input(
      z.object({
        sessionId: z.string().uuid(),
        // Generous cap — typical 60-90s Tanny chat is ~500-1500
        // chars, but ElevenLabs/WebSpeech can bloat with retries.
        transcript: z.string().min(1).max(8000),
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
          message: "Cannot save voice transcript on a finished session",
        });
      }

      // Only auto-advance the phase if we're still on "voice".
      // A returning-mid-quiz user shouldn't get bumped backward
      // if they re-record from a later stage.
      const nextPhase: typeof session.phase =
        session.phase === "voice" ? "visual" : session.phase;

      const [updated] = await ctx.db
        .update(OnboardingSession)
        .set({
          voiceTranscript: input.transcript.trim(),
          phase: nextPhase,
        })
        .where(eq(OnboardingSession.id, session.id))
        .returning();

      return updated;
    }),

  /**
   * Skips the voice phase outright — no transcript, just advance
   * `phase` from "voice" → "visual". Idempotent and a no-op if
   * the user has already moved past voice.
   */
  skipVoicePhase: protectedProcedure
    .input(z.object({ sessionId: z.string().uuid() }))
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

      if (session.phase !== "voice" || session.status === "complete") {
        return session;
      }

      const [updated] = await ctx.db
        .update(OnboardingSession)
        .set({ phase: "visual" })
        .where(eq(OnboardingSession.id, session.id))
        .returning();

      return updated;
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

  /**
   * Returns 7 clips for the post-visual phase. Picks span the
   * `(era × moodCluster)` grid with a tilt toward the user's stated
   * preferences (so we get sharper signal where they care) but
   * always keeps ~30% stretch picks for discovery.
   *
   * **Blind by design:** we strip era/mood labels from the response.
   * If the user knows a piece is "romantic" they'll judge against the
   * label, not the music — and our taste signal goes muddy.
   */
  getClips: protectedProcedure
    .input(z.object({ sessionId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const session = await ctx.db.query.OnboardingSession.findFirst({
        where: and(
          eq(OnboardingSession.id, input.sessionId),
          eq(OnboardingSession.userId, ctx.session.user.id),
        ),
      });
      if (!session) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Onboarding session not found",
        });
      }

      const visual = (session.visualAnswers ?? {}) as VisualAnswers;
      const picks = pickClipsForOnboarding({
        count: 7,
        prior: {
          eras: visual.eras,
          emotionalOrientation: visual.emotional_orientation,
        },
      });

      // Randomize so the cell-coverage order isn't visible to the
      // user (they'd otherwise notice the curated narrative arc).
      const shuffled = [...picks].sort(() => Math.random() - 0.5);

      return {
        clips: shuffled.map((t) => ({
          id: String(t.id),
          composer: t.composer,
          title: t.title,
          file: t.file,
          // Intentionally NOT returning era/moodCluster.
        })),
      };
    }),

  /**
   * Persists clip reactions on the session AND fans them out into the
   * append-only `UserMusicEvent` log. Advances `phase` to `reveal`.
   *
   * Idempotent: re-calling overwrites the session's `clipReactions`
   * but does NOT replay the event log inserts (we can't easily dedupe
   * those without a unique constraint, so we accept that a network
   * retry would double-count — better to overweight a real signal
   * than lose it). The UI guards against retries for normal flows.
   */
  saveClipReactions: protectedProcedure
    .input(SaveClipReactionsSchema)
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

      // Convert wire shape → persisted shape. The DB column was
      // typed before the tap-reaction UI existed, so we collapse
      // `reaction` (love/ok/not_for_me) into the `voiceReaction`
      // string slot. `clipDurationMs` rides on `UserMusicEvent`
      // metadata instead.
      const persistedReactions = input.reactions.map((r) => ({
        clipId: r.clipId,
        listenedMs: r.listenedMs,
        skipped: r.skipped,
        replayed: r.replayed,
        voiceReaction: r.reaction ?? null,
      }));

      // Phase advances to `complete` (the work of the clips phase is
      // done) but `status` stays `in_progress` until `tasteProfile.
      // derive` actually persists a profile.
      await ctx.db
        .update(OnboardingSession)
        .set({
          clipReactions: persistedReactions,
          phase: "complete",
        })
        .where(eq(OnboardingSession.id, session.id));

      // Fan out into the implicit-signal log. Each reaction yields up
      // to 3 events (play, plus skip/complete, plus replay if any).
      // We do this best-effort: a logging failure shouldn't block the
      // user's onboarding completion.
      try {
        const rows = buildMusicEventRows(userId, input.reactions);
        if (rows.length > 0) {
          await ctx.db.insert(UserMusicEvent).values(rows);
        }
      } catch (err) {
        console.warn(
          "[onboarding.saveClipReactions] event log write failed:",
          err instanceof Error ? err.message : String(err),
        );
      }

      return { ok: true as const, count: input.reactions.length };
    }),
} satisfies TRPCRouterRecord;

/**
 * Convert clip reactions into the rows we append to `UserMusicEvent`.
 * Every clip gets a `clip_play` event; skipped clips get a
 * `clip_skip`, finished clips get a `clip_complete`, replayed clips
 * get a `clip_replay`. Composer + listenedMs in metadata is enough
 * for the recommender's negative-signal calculation.
 */
function buildMusicEventRows(userId: string, reactions: ClipReaction[]) {
  // Build a server-side lookup so we can attach composer + era + mood
  // to every event row. The recommender's negative-signal pass reads
  // `metadata.composer`; without this, skipped composers wouldn't get
  // penalized.
  const trackById = new Map(MUSIC_CATALOG.map((t) => [String(t.id), t]));

  const rows: (typeof UserMusicEvent.$inferInsert)[] = [];
  for (const r of reactions) {
    const track = trackById.get(r.clipId);
    const baseMetadata = {
      listenedMs: r.listenedMs,
      clipDurationMs: r.clipDurationMs,
      reaction: r.reaction ?? null,
      composer: track?.composer ?? null,
      era: track?.era ?? null,
      moodCluster: track?.moodCluster ?? null,
    };

    rows.push({
      userId,
      eventType: "clip_play",
      entityType: "clip",
      entityId: r.clipId,
      metadata: baseMetadata,
    });

    if (r.skipped) {
      rows.push({
        userId,
        eventType: "clip_skip",
        entityType: "clip",
        entityId: r.clipId,
        metadata: baseMetadata,
      });
    } else {
      rows.push({
        userId,
        eventType: "clip_complete",
        entityType: "clip",
        entityId: r.clipId,
        metadata: baseMetadata,
      });
    }

    if (r.replayed) {
      rows.push({
        userId,
        eventType: "clip_replay",
        entityType: "clip",
        entityId: r.clipId,
        metadata: baseMetadata,
      });
    }
  }
  return rows;
}
