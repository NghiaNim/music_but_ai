import type { VisualAnswers } from "@acme/validators";

/**
 * Questions are typed against `VisualAnswers` keys so a typo or
 * renamed enum is caught at compile time, not after a user finishes
 * the quiz with bad data.
 */

export type QuestionKey = keyof VisualAnswers;

interface BaseQuestion<K extends QuestionKey> {
  key: K;
  /** The single short prompt the user reads. */
  prompt: string;
  /** Tiny tagline rendered above the prompt — sets emotional tone. */
  intro: string;
  options: {
    /** The enum value persisted to the DB. */
    value: NonNullable<VisualAnswers[K]> extends readonly (infer T)[]
      ? T
      : NonNullable<VisualAnswers[K]>;
    label: string;
    description: string;
  }[];
}

interface SingleSelectQuestion<K extends QuestionKey> extends BaseQuestion<K> {
  kind: "single";
}

interface MultiSelectQuestion<K extends QuestionKey> extends BaseQuestion<K> {
  kind: "multi";
  /** When true, the user can advance with no selection. */
  skippable: boolean;
}

export type Question =
  | SingleSelectQuestion<"emotional_orientation">
  | SingleSelectQuestion<"texture">
  | MultiSelectQuestion<"eras">
  | SingleSelectQuestion<"complexity">
  | SingleSelectQuestion<"concert_motivation">;

export const QUESTIONS: Question[] = [
  {
    kind: "single",
    key: "emotional_orientation",
    intro: "First, the feeling.",
    prompt: "What do you most want from music?",
    options: [
      {
        value: "catharsis",
        label: "Catharsis",
        description: "Big emotions, drama — something that moves you deeply.",
      },
      {
        value: "tranquility",
        label: "Tranquility",
        description: "Calm, atmosphere — something to settle into.",
      },
      {
        value: "intellectual",
        label: "Intellectual engagement",
        description:
          "Structure, complexity — something to follow and untangle.",
      },
      {
        value: "energy",
        label: "Energy & momentum",
        description: "Forward motion, rhythm — something that drives you.",
      },
    ],
  },
  {
    kind: "single",
    key: "texture",
    intro: "Now, the shape of the sound.",
    prompt: "What kind of ensemble draws you in?",
    options: [
      {
        value: "grand",
        label: "Grand & orchestral",
        description: "Full symphony, sweeping soundscapes, big concert halls.",
      },
      {
        value: "intimate",
        label: "Intimate & chamber",
        description: "Solo piano, string quartet, small ensembles up close.",
      },
      {
        value: "vocal",
        label: "Vocal & voice-led",
        description: "Opera, choir, lieder — voice as the primary instrument.",
      },
      {
        value: "mixed",
        label: "Anything goes",
        description: "The music decides — no strong preference.",
      },
    ],
  },
  {
    kind: "multi",
    key: "eras",
    skippable: true,
    intro: "Eras you already love — pick any that resonate.",
    prompt: "Which eras pull you in?",
    options: [
      {
        value: "baroque",
        label: "Baroque",
        description: "Bach, Vivaldi, Handel — intricate, structured.",
      },
      {
        value: "classical_period",
        label: "Classical period",
        description: "Mozart, Haydn — balanced, elegant, clear.",
      },
      {
        value: "romantic",
        label: "Romantic",
        description: "Chopin, Brahms, Mahler — expressive, dramatic.",
      },
      {
        value: "impressionist",
        label: "Impressionist",
        description: "Debussy, Ravel, Fauré — atmospheric, colour-driven.",
      },
      {
        value: "modern",
        label: "20th century modern",
        description: "Stravinsky, Shostakovich — bold, challenging.",
      },
      {
        value: "contemporary",
        label: "Contemporary",
        description: "Living composers, premieres, new sounds.",
      },
    ],
  },
  {
    kind: "single",
    key: "complexity",
    intro: "How much complexity feels right?",
    prompt: "Where do you sit on accessible ↔ challenging?",
    options: [
      {
        value: "accessible",
        label: "Accessible & melodic",
        description: "Strong themes, tonal harmony, immediately beautiful.",
      },
      {
        value: "layered",
        label: "Layered & developmental",
        description: "I enjoy following structure as it unfolds.",
      },
      {
        value: "challenging",
        label: "Challenging & avant-garde",
        description: "Dissonance, atonality, experimentation welcome.",
      },
    ],
  },
  {
    kind: "single",
    key: "concert_motivation",
    intro: "Finally — what brings you to the hall?",
    prompt: "Why do you go to live concerts?",
    options: [
      {
        value: "emotional_event",
        label: "An emotional experience",
        description: "I want to feel something profound in the room.",
      },
      {
        value: "social",
        label: "A social occasion",
        description: "Date night, friends, celebration — the event matters.",
      },
      {
        value: "discovery",
        label: "Discovery & learning",
        description:
          "New repertoire, program notes, something I haven't heard.",
      },
      {
        value: "prestige",
        label: "Prestige & spectacle",
        description: "Famous soloists, iconic orchestras, a marquee event.",
      },
    ],
  },
];
