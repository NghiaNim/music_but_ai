import type {
  ClipComplexity,
  ClipEra,
  ClipMood,
  ClipTexture,
} from "./music-catalog";

/** Shared enum members for OpenAI strict JSON schemas (catalog tagger + taste profile). */
export const OPENAI_CLIP_ERAS: ClipEra[] = [
  "baroque",
  "classical_period",
  "romantic",
  "impressionist",
  "modern",
  "contemporary",
];

export const OPENAI_CLIP_MOODS: ClipMood[] = [
  "catharsis",
  "tranquility",
  "intellectual",
  "energy",
];

export const OPENAI_CLIP_TEXTURES: ClipTexture[] = [
  "grand",
  "intimate",
  "vocal",
  "mixed",
];

export const OPENAI_CLIP_COMPLEXITIES: ClipComplexity[] = [
  "accessible",
  "layered",
  "challenging",
];
