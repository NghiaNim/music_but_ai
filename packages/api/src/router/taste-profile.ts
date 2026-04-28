import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod/v4";

import type {
  ClipReactionForDerivation,
  TasteProfile,
  VisualAnswers,
} from "@acme/ai";
import {
  deriveTasteProfile,
  heuristicTasteProfile,
  MUSIC_CATALOG,
} from "@acme/ai";
import { and, eq } from "@acme/db";
import { OnboardingSession, UserProfile } from "@acme/db/schema";

import { bustRecommendationsCache } from "../recs-cache-bust";
import { protectedProcedure } from "../trpc";

// ─── Validators (mirror the AI module's enums) ──────────

const eraEnum = z.enum([
  "baroque",
  "classical_period",
  "romantic",
  "impressionist",
  "modern",
  "contemporary",
]);
const moodEnum = z.enum(["catharsis", "tranquility", "intellectual", "energy"]);
const textureEnum = z.enum(["grand", "intimate", "vocal", "mixed"]);
const complexityEnum = z.enum(["accessible", "layered", "challenging"]);
const motivationEnum = z.enum([
  "emotional_event",
  "social",
  "discovery",
  "prestige",
]);
const bridgeEnum = z.enum([
  "film",
  "jazz",
  "world",
  "pop_rock",
  "already_classical",
  "mixed",
]);

const updateInputSchema = z
  .object({
    archetype: z.string().min(1).max(100),
    badgeEmoji: z.string().min(1).max(16),
    tags: z.array(z.string().max(40)).min(1).max(6),
    emotionalOrientation: moodEnum,
    texturePreference: textureEnum,
    eraAffinities: z.array(eraEnum).min(1).max(6),
    complexityTolerance: complexityEnum,
    concertMotivation: motivationEnum,
    crossGenreBridge: bridgeEnum,
    profileSummary: z.string().min(1).max(2000),
    profileCards: z
      .array(
        z.object({
          label: z.string().min(1).max(40),
          value: z.string().min(1).max(200),
        }),
      )
      .max(6),
  })
  .partial();

// ─── Helpers ────────────────────────────────────────────

function profileToColumns(profile: TasteProfile) {
  return {
    archetype: profile.archetype,
    badgeEmoji: profile.badgeEmoji,
    tags: profile.tags,
    emotionalOrientation: profile.emotionalOrientation,
    texturePreference: profile.texturePreference,
    eraAffinities: profile.eraAffinities,
    complexityTolerance: profile.complexityTolerance,
    concertMotivation: profile.concertMotivation,
    crossGenreBridge: profile.crossGenreBridge,
    profileSummary: profile.profileSummary,
    profileCards: profile.profileCards,
  };
}

// Loose-typed visual answers come straight from the JSONB column;
// validate them at the trust boundary so we can hand a safe shape
// down to the AI module.
const visualAnswersSchema = z
  .object({
    emotional_orientation: moodEnum.optional(),
    texture: textureEnum.optional(),
    eras: z.array(eraEnum).optional(),
    complexity: complexityEnum.optional(),
    concert_motivation: motivationEnum.optional(),
    bridge: bridgeEnum.optional(),
  })
  .passthrough();

/**
 * Hydrate the JSONB clip-reaction shape (just clipId + behavior) into
 * the rich shape the derivation prompt needs (era, mood, human label).
 * Unknown clipIds are dropped — better to skip a row than poison the
 * prompt with `[unknown, unknown]`.
 */
function hydrateReactions(
  raw: {
    clipId: string;
    listenedMs: number;
    skipped: boolean;
    replayed: boolean;
    voiceReaction: string | null;
  }[],
): ClipReactionForDerivation[] {
  const byId = new Map<string, (typeof MUSIC_CATALOG)[number]>();
  for (const t of MUSIC_CATALOG) byId.set(String(t.id), t);

  const hydrated: ClipReactionForDerivation[] = [];
  for (const r of raw) {
    const track = byId.get(String(r.clipId));
    if (!track) continue;
    hydrated.push({
      label: `${track.composer} — ${track.title}`,
      era: track.era,
      moodCluster: track.moodCluster,
      skipped: r.skipped,
      replayed: r.replayed,
      listenedSeconds: Math.max(0, Math.round(r.listenedMs / 1000)),
      voiceReaction: r.voiceReaction ?? null,
    });
  }
  return hydrated;
}

// ─── Router ─────────────────────────────────────────────

export const tasteProfileRouter = {
  /**
   * Returns the user's current taste profile or `null` if they have
   * never completed onboarding.
   */
  get: protectedProcedure.query(async ({ ctx }) => {
    const profile = await ctx.db.query.UserProfile.findFirst({
      where: eq(UserProfile.userId, ctx.session.user.id),
    });
    if (!profile?.archetype) return null;
    return profile;
  }),

  /**
   * Derive a profile from an `OnboardingSession` row, persist it on
   * the user's `UserProfile`, mark the session complete.
   *
   * Idempotent: re-running on a complete session returns the existing
   * profile without burning another OpenAI call.
   */
  derive: protectedProcedure
    .input(z.object({ sessionId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
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

      const existingProfile = await ctx.db.query.UserProfile.findFirst({
        where: eq(UserProfile.userId, ctx.session.user.id),
      });

      // Idempotency: if this session was already finalized AND the
      // user already has a derived profile, just return it.
      if (
        session.status === "complete" &&
        existingProfile?.archetype &&
        existingProfile.tasteOnboardingCompletedAt
      ) {
        return { profile: existingProfile, source: "cached" as const };
      }

      const visual: VisualAnswers = visualAnswersSchema.parse(
        session.visualAnswers ?? {},
      );
      const clipReactions = hydrateReactions(session.clipReactions ?? []);

      const apiKey = process.env.OPENAI_API_KEY;

      const { profile, source } = apiKey
        ? await deriveTasteProfile(
            {
              voiceTranscript: session.voiceTranscript,
              visualAnswers: visual,
              clipReactions,
            },
            { apiKey },
          )
        : {
            profile: heuristicTasteProfile({
              voiceTranscript: session.voiceTranscript,
              visualAnswers: visual,
              clipReactions,
            }),
            source: "heuristic" as const,
          };

      const now = new Date();
      const profileColumns = profileToColumns(profile);

      let saved;
      if (existingProfile) {
        const [row] = await ctx.db
          .update(UserProfile)
          .set({
            ...profileColumns,
            lastDerivedAt: now,
            tasteOnboardingCompletedAt:
              existingProfile.tasteOnboardingCompletedAt ?? now,
          })
          .where(eq(UserProfile.id, existingProfile.id))
          .returning();
        saved = row;
      } else {
        const [row] = await ctx.db
          .insert(UserProfile)
          .values({
            userId: ctx.session.user.id,
            ...profileColumns,
            lastDerivedAt: now,
            tasteOnboardingCompletedAt: now,
          })
          .returning();
        saved = row;
      }

      await ctx.db
        .update(OnboardingSession)
        .set({
          phase: "complete",
          status: "complete",
          completedAt: now,
        })
        .where(eq(OnboardingSession.id, session.id));

      // Bust the recs cache so the next read picks up the new profile.
      void bustRecommendationsCache(ctx.session.user.id);

      return { profile: saved, source };
    }),

  /**
   * Manual user correction. Only updates fields the user explicitly
   * passed. Critically, we do NOT touch `lastDerivedAt` — that way
   * the periodic re-derivation scheduler does not immediately
   * overwrite the user's edit.
   */
  update: protectedProcedure
    .input(updateInputSchema)
    .mutation(async ({ ctx, input }) => {
      if (Object.keys(input).length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No fields to update",
        });
      }
      const existing = await ctx.db.query.UserProfile.findFirst({
        where: eq(UserProfile.userId, ctx.session.user.id),
      });
      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Complete onboarding before editing your profile",
        });
      }
      const [row] = await ctx.db
        .update(UserProfile)
        .set(input)
        .where(eq(UserProfile.id, existing.id))
        .returning();

      void bustRecommendationsCache(ctx.session.user.id);

      return row;
    }),
} satisfies TRPCRouterRecord;
