import OpenAI from "openai";

import type {
  ClipComplexity,
  ClipEra,
  ClipMood,
  ClipTexture,
} from "./music-catalog";

// ─── Public types ───────────────────────────────────────

export type ConcertMotivation =
  | "emotional_event"
  | "social"
  | "discovery"
  | "prestige";

export type CrossGenreBridge =
  | "film"
  | "jazz"
  | "world"
  | "pop_rock"
  | "already_classical"
  | "mixed";

export interface TasteProfile {
  archetype: string;
  badgeEmoji: string;
  /** 4–6 short phrases (1–3 words each). */
  tags: string[];
  emotionalOrientation: ClipMood;
  texturePreference: ClipTexture;
  eraAffinities: ClipEra[];
  complexityTolerance: ClipComplexity;
  concertMotivation: ConcertMotivation;
  crossGenreBridge: CrossGenreBridge;
  profileSummary: string;
  profileCards: { label: string; value: string }[];
}

/**
 * Visual-card answers as captured by the onboarding UI. The keys here
 * are the canonical wire format — the visual-cards component speaks
 * exactly this shape so we never need a translation layer.
 */
export interface VisualAnswers {
  emotional_orientation?: ClipMood;
  texture?: ClipTexture;
  eras?: ClipEra[];
  complexity?: ClipComplexity;
  concert_motivation?: ConcertMotivation;
  bridge?: CrossGenreBridge;
}

export interface ClipReactionForDerivation {
  /** Composer + title — whatever identifies the clip in human terms. */
  label: string;
  era: ClipEra;
  moodCluster: ClipMood;
  /** True if the user skipped before the natural end. */
  skipped: boolean;
  /** True if they replayed (strong positive signal). */
  replayed: boolean;
  /** Listen duration in seconds (rounded for readability). */
  listenedSeconds: number;
  /** Optional voice reaction transcript. */
  voiceReaction?: string | null;
}

export interface DeriveTasteProfileInput {
  voiceTranscript?: string | null;
  visualAnswers: VisualAnswers;
  clipReactions: ClipReactionForDerivation[];
}

export interface DeriveOptions {
  apiKey: string;
  model?: string;
}

// ─── OpenAI strict JSON schema ──────────────────────────

const ERAS: ClipEra[] = [
  "baroque",
  "classical_period",
  "romantic",
  "impressionist",
  "modern",
  "contemporary",
];
const MOODS: ClipMood[] = [
  "catharsis",
  "tranquility",
  "intellectual",
  "energy",
];
const TEXTURES: ClipTexture[] = ["grand", "intimate", "vocal", "mixed"];
const COMPLEXITIES: ClipComplexity[] = ["accessible", "layered", "challenging"];
const MOTIVATIONS: ConcertMotivation[] = [
  "emotional_event",
  "social",
  "discovery",
  "prestige",
];
const BRIDGES: CrossGenreBridge[] = [
  "film",
  "jazz",
  "world",
  "pop_rock",
  "already_classical",
  "mixed",
];

const tasteProfileSchema = {
  name: "taste_profile",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: [
      "archetype",
      "badgeEmoji",
      "tags",
      "emotionalOrientation",
      "texturePreference",
      "eraAffinities",
      "complexityTolerance",
      "concertMotivation",
      "crossGenreBridge",
      "profileSummary",
      "profileCards",
    ],
    properties: {
      archetype: {
        type: "string",
        description:
          "2-4 word evocative archetype name capturing their overall taste personality. Title case. Example: 'Late Romantic Wanderer'.",
      },
      badgeEmoji: {
        type: "string",
        description:
          "A single emoji that visually represents the archetype. Just the emoji character.",
      },
      tags: {
        type: "array",
        items: { type: "string" },
        description:
          "4-6 short phrases (1-3 words each) that together describe the user's taste fingerprint. Title Case. Example: ['Late Romantic','Intimate','Catharsis','Discovery-driven'].",
      },
      emotionalOrientation: { type: "string", enum: MOODS },
      texturePreference: { type: "string", enum: TEXTURES },
      eraAffinities: {
        type: "array",
        items: { type: "string", enum: ERAS },
        description: "1-3 era buckets the user gravitates toward.",
      },
      complexityTolerance: { type: "string", enum: COMPLEXITIES },
      concertMotivation: { type: "string", enum: MOTIVATIONS },
      crossGenreBridge: { type: "string", enum: BRIDGES },
      profileSummary: {
        type: "string",
        description:
          "2-3 warm, specific sentences. Mention concrete composers or styles they will love. Address the listener directly ('you').",
      },
      profileCards: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["label", "value"],
          properties: {
            label: { type: "string" },
            value: { type: "string" },
          },
        },
        description:
          "Exactly four cards in this fixed order: 'Emotional style', 'Preferred texture', 'Era affinity', 'Concert motivation'. Each VALUE must be a short evocative human phrase, NOT the raw enum string. Good examples — Emotional style: 'Catharsis-seeker', 'Quiet contemplation', 'Architectural minds'. Preferred texture: 'Grand orchestral sweep', 'Intimate chamber', 'Voice-led'. Era affinity: 'Late Romantic + early 20th c.', 'Baroque clarity'. Concert motivation: 'Profound emotional experience', 'Discovery-driven'. BAD: just returning 'catharsis' or 'grand'.",
      },
    },
  },
} as const;

const SYSTEM_PROMPT = `You are a classical music taste analyst for a concert marketplace. You will receive onboarding signals — a free-form voice transcript (optional), explicit visual-card answers, and a list of clip reactions (which the user listened to, skipped, or replayed). Your job is to synthesize a structured taste profile.

Weight the signals as follows:
- Clip reactions are the richest signal. A replay or full listen on a romantic-catharsis piece is much stronger evidence than a card tap. A skip is a real negative signal — let it pull eraAffinities away from that bucket.
- Voice transcript is rich and specific — extract specific composer/genre mentions and let them refine the profile.
- Visual cards are explicit but coarse — use them as a frame, not the final word. If the cards say "romantic" but every romantic clip was skipped while modern clips were replayed, trust the clips.

Tone for archetype, tags, summary: warm, specific, concrete. Avoid generic adjectives like "passionate" or "diverse". Mention real composers when you can. Talk like a thoughtful friend, not a marketing brochure.

Return STRICT JSON matching the schema. Do not invent fields. Do not include markdown.`;

// ─── Heuristic fallback ─────────────────────────────────

const ERA_LABEL: Record<ClipEra, string> = {
  baroque: "Baroque",
  classical_period: "Classical",
  romantic: "Romantic",
  impressionist: "Impressionist",
  modern: "20th Century",
  contemporary: "Contemporary",
};
const MOOD_LABEL: Record<ClipMood, string> = {
  catharsis: "Catharsis-seeker",
  tranquility: "Calm-seeker",
  intellectual: "Structure-lover",
  energy: "Momentum-seeker",
};
const TEXTURE_LABEL: Record<ClipTexture, string> = {
  grand: "Grand orchestral",
  intimate: "Intimate chamber",
  vocal: "Vocal-led",
  mixed: "Open to anything",
};

const ARCHETYPE_BY_MOOD: Record<ClipMood, string> = {
  catharsis: "Emotional Voyager",
  tranquility: "Quiet Listener",
  intellectual: "Structural Thinker",
  energy: "Rhythmic Spirit",
};
const BADGE_BY_MOOD: Record<ClipMood, string> = {
  catharsis: "🌊",
  tranquility: "🌙",
  intellectual: "🧭",
  energy: "⚡",
};

/**
 * Build a profile from visual-card answers alone, no AI involved.
 * Used when:
 *   - OpenAI is unreachable / no API key configured
 *   - The derivation API call fails after retry
 *   - We want a guaranteed-fast preview during the reveal animation
 *
 * Always returns *something* — onboarding must always complete.
 */
export function heuristicTasteProfile(
  input: DeriveTasteProfileInput,
): TasteProfile {
  const a = input.visualAnswers;
  const mood: ClipMood = a.emotional_orientation ?? "catharsis";
  const texture: ClipTexture = a.texture ?? "mixed";
  const eras: ClipEra[] =
    a.eras && a.eras.length > 0 ? a.eras : (["romantic"] as ClipEra[]);
  const primaryEra: ClipEra = eras[0] ?? "romantic";
  const complexity: ClipComplexity = a.complexity ?? "layered";
  const motivation: ConcertMotivation =
    a.concert_motivation ?? "emotional_event";
  const bridge: CrossGenreBridge = a.bridge ?? "mixed";

  const archetypeBase = ARCHETYPE_BY_MOOD[mood];
  const eraTag =
    ERA_LABEL[primaryEra] !== "Contemporary"
      ? `${ERA_LABEL[primaryEra]} ${archetypeBase}`
      : archetypeBase;

  return {
    archetype: eraTag,
    badgeEmoji: BADGE_BY_MOOD[mood],
    tags: [
      ERA_LABEL[primaryEra],
      TEXTURE_LABEL[texture].split(" ")[0] ?? "Open",
      MOOD_LABEL[mood].split("-")[0] ?? "Listening",
      complexity === "accessible"
        ? "Melodic"
        : complexity === "challenging"
          ? "Adventurous"
          : "Discerning",
    ],
    emotionalOrientation: mood,
    texturePreference: texture,
    eraAffinities: eras,
    complexityTolerance: complexity,
    concertMotivation: motivation,
    crossGenreBridge: bridge,
    profileSummary:
      `You're drawn to ${MOOD_LABEL[mood].toLowerCase()} performances — ${TEXTURE_LABEL[texture].toLowerCase()} settings ` +
      `with ${ERA_LABEL[primaryEra].toLowerCase()} repertoire fit you best. ` +
      `We'll point you toward concerts that feel emotionally honest first, then expand outward.`,
    profileCards: [
      { label: "Emotional style", value: MOOD_LABEL[mood] },
      { label: "Preferred texture", value: TEXTURE_LABEL[texture] },
      {
        label: "Era affinity",
        value: eras.map((e) => ERA_LABEL[e]).join(" + "),
      },
      {
        label: "Concert motivation",
        value:
          motivation === "emotional_event"
            ? "Profound emotional experience"
            : motivation === "social"
              ? "Shared occasion"
              : motivation === "discovery"
                ? "Discovery & learning"
                : "Marquee spectacle",
      },
    ],
  };
}

// ─── Main entry ─────────────────────────────────────────

function buildUserPrompt(input: DeriveTasteProfileInput): string {
  const a = input.visualAnswers;
  const lines: string[] = [];

  if (input.voiceTranscript?.trim()) {
    lines.push(
      `# Voice conversation transcript\n${input.voiceTranscript.trim()}`,
    );
  } else {
    lines.push(`# Voice conversation transcript\n(none — user skipped voice)`);
  }

  lines.push(`# Visual card answers
- Emotional orientation: ${a.emotional_orientation ?? "(not answered)"}
- Texture preference: ${a.texture ?? "(not answered)"}
- Era affinities: ${a.eras?.join(", ") ?? "(not answered)"}
- Complexity tolerance: ${a.complexity ?? "(not answered)"}
- Concert motivation: ${a.concert_motivation ?? "(not answered)"}
- Musical background bridge: ${a.bridge ?? "(not answered)"}`);

  if (input.clipReactions.length > 0) {
    const formatted = input.clipReactions
      .map((c) => {
        const verdict = c.replayed
          ? "REPLAYED (strong positive)"
          : c.skipped
            ? `SKIPPED at ${c.listenedSeconds}s (negative)`
            : `listened ${c.listenedSeconds}s`;
        const reaction = c.voiceReaction ? ` — said: "${c.voiceReaction}"` : "";
        return `- ${c.label} [${c.era}, ${c.moodCluster}]: ${verdict}${reaction}`;
      })
      .join("\n");
    lines.push(`# Clip reactions\n${formatted}`);
  } else {
    lines.push(`# Clip reactions\n(none — user skipped this phase)`);
  }

  return lines.join("\n\n");
}

/**
 * Derive a structured taste profile from raw onboarding signals.
 *
 * Always returns a profile. Strategy:
 *   1. Call OpenAI with strict JSON schema. If it succeeds, return.
 *   2. If OpenAI errors / no API key, return the heuristic fallback so
 *      the user never gets stuck on the reveal screen.
 */
export async function deriveTasteProfile(
  input: DeriveTasteProfileInput,
  options: DeriveOptions,
): Promise<{ profile: TasteProfile; source: "ai" | "heuristic" }> {
  const client = new OpenAI({ apiKey: options.apiKey });

  try {
    const response = await client.chat.completions.create({
      model: options.model ?? "gpt-4o-mini",
      temperature: 0.4,
      max_tokens: 800,
      response_format: { type: "json_schema", json_schema: tasteProfileSchema },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(input) },
      ],
    });

    const raw = response.choices[0]?.message.content?.trim();
    if (!raw) {
      throw new Error("Derivation returned empty content");
    }
    const profile = JSON.parse(raw) as TasteProfile;
    // Defensive trim — cap tags/cards in case the model goes long.
    profile.tags = profile.tags.slice(0, 6);
    profile.profileCards = profile.profileCards.slice(0, 4);
    return { profile, source: "ai" };
  } catch (err) {
    console.warn(
      "[taste-profile] AI derivation failed, falling back to heuristic:",
      err instanceof Error ? err.message : String(err),
    );
    return { profile: heuristicTasteProfile(input), source: "heuristic" };
  }
}
