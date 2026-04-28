import { z } from "zod/v4";

/**
 * Shared Zod schemas for the new taste-onboarding flow.
 * Mirrors `VisualAnswers` from `@acme/ai/taste-profile` so the UI,
 * the tRPC router, and the AI derivation layer all agree on the
 * shape — type errors are caught at the boundary, not at runtime.
 */

export const EmotionalOrientationSchema = z.enum([
  "catharsis",
  "tranquility",
  "intellectual",
  "energy",
]);
export type EmotionalOrientation = z.infer<typeof EmotionalOrientationSchema>;

export const TexturePreferenceSchema = z.enum([
  "grand",
  "intimate",
  "vocal",
  "mixed",
]);
export type TexturePreference = z.infer<typeof TexturePreferenceSchema>;

export const EraAffinitySchema = z.enum([
  "baroque",
  "classical_period",
  "romantic",
  "impressionist",
  "modern",
  "contemporary",
]);
export type EraAffinity = z.infer<typeof EraAffinitySchema>;

export const ComplexityToleranceSchema = z.enum([
  "accessible",
  "layered",
  "challenging",
]);
export type ComplexityTolerance = z.infer<typeof ComplexityToleranceSchema>;

export const ConcertMotivationSchema = z.enum([
  "emotional_event",
  "social",
  "discovery",
  "prestige",
]);
export type ConcertMotivation = z.infer<typeof ConcertMotivationSchema>;

export const CrossGenreBridgeSchema = z.enum([
  "film",
  "jazz",
  "world",
  "pop_rock",
  "already_classical",
  "mixed",
]);
export type CrossGenreBridge = z.infer<typeof CrossGenreBridgeSchema>;

/**
 * Partial because users save progressively — the router merges each
 * save with what was already there, allowing reload-resume.
 */
export const VisualAnswersSchema = z.object({
  emotional_orientation: EmotionalOrientationSchema.optional(),
  texture: TexturePreferenceSchema.optional(),
  eras: z.array(EraAffinitySchema).optional(),
  complexity: ComplexityToleranceSchema.optional(),
  concert_motivation: ConcertMotivationSchema.optional(),
  bridge: CrossGenreBridgeSchema.optional(),
});
export type VisualAnswers = z.infer<typeof VisualAnswersSchema>;

export const SaveVisualAnswersSchema = z.object({
  sessionId: z.string().uuid(),
  answers: VisualAnswersSchema,
});
export type SaveVisualAnswersInput = z.infer<typeof SaveVisualAnswersSchema>;
