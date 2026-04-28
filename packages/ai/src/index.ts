export {
  generateBeginnerNotes,
  streamDiscoveryResponse,
  streamLearningResponse,
} from "./concierge";
export type {
  ChatMessage,
  DiscoveryConciergeInput,
  LearningConciergeInput,
} from "./concierge";
export type { EventContext } from "./prompts";

export {
  getRandomTracksPerTier,
  MUSIC_CATALOG,
  pickClipsForOnboarding,
} from "./music-catalog";
export type {
  ClipComplexity,
  ClipEra,
  ClipMood,
  ClipTexture,
  MusicTier,
  MusicTrack,
} from "./music-catalog";

export { inferEventTaste, inferEventTasteBatch } from "./taste-tagger";
export type {
  InferredTaste,
  TaggerClientOptions,
  TaggerInput,
} from "./taste-tagger";

export { deriveTasteProfile, heuristicTasteProfile } from "./taste-profile";
export type {
  ClipReactionForDerivation,
  ConcertMotivation,
  CrossGenreBridge,
  DeriveOptions,
  DeriveTasteProfileInput,
  TasteProfile,
  VisualAnswers,
} from "./taste-profile";

export {
  computeExperienceLevel,
  generateOnboardingReply,
  ONBOARDING_QUESTIONS,
} from "./onboarding";
export type { OnboardingReplyInput } from "./onboarding";

export { textToSpeech } from "./tts";
export type { TTSOptions } from "./tts";
