import OpenAI from "openai";

import type {
  ClipComplexity,
  ClipEra,
  ClipMood,
  ClipTexture,
} from "./music-catalog";

/**
 * The shape this tagger returns. Mirrors `EventTasteAnnotation` from
 * @acme/db/schema — duplicated here to keep `packages/ai` free of
 * a dependency on the DB package.
 */
export interface InferredTaste {
  era: ClipEra | null;
  moodCluster: ClipMood | null;
  texture: ClipTexture | null;
  complexity: ClipComplexity | null;
  /** Free-form short tags the editorial-rules engine can match on. */
  tags: string[];
  /** Best-effort composer extraction from the program text. */
  composers: string[];
  /** ISO timestamp when this tagging ran. */
  taggedAt: string;
}

export interface TaggerInput {
  title: string;
  program?: string | null;
  description?: string | null;
  /** A genre hint already in the catalog (e.g. "opera", "chamber"). */
  genre?: string | null;
  /** Venue name — gives strong context for things like "Met Opera". */
  venueName?: string | null;
}

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

/**
 * Strict JSON schema we hand to OpenAI. `additionalProperties: false`
 * + every field listed in `required` are required by the OpenAI strict
 * mode contract — even nullable enums must be present.
 */
const tasteJsonSchema = {
  name: "event_taste",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    required: [
      "era",
      "moodCluster",
      "texture",
      "complexity",
      "tags",
      "composers",
    ],
    properties: {
      era: { type: ["string", "null"], enum: [...ERAS, null] },
      moodCluster: { type: ["string", "null"], enum: [...MOODS, null] },
      texture: { type: ["string", "null"], enum: [...TEXTURES, null] },
      complexity: {
        type: ["string", "null"],
        enum: [...COMPLEXITIES, null],
      },
      tags: {
        type: "array",
        items: { type: "string" },
        description:
          "Short editorial tags such as film_score, premiere, late_works, gateway_repertoire. Use snake_case. Up to 6.",
      },
      composers: {
        type: "array",
        items: { type: "string" },
        description:
          "Composer surnames present on the program. E.g. ['Mahler','Brahms']. Use canonical English spellings.",
      },
    },
  },
} as const;

const SYSTEM_PROMPT = `You are a classical music cataloger. You will receive a concert listing — title, program, description, optional genre and venue. Return strict JSON (no prose) describing the dominant taste profile of the concert.

You MUST make a best-guess inference using every signal available — title, venue, genre hint, and your knowledge of the typical repertoire of the venue. Only return null when no reasonable inference is possible (e.g. a generic title with no other context). A confident guess is more useful than null. Use these heuristics when explicit info is missing:

- Met Opera / opera in title → era: romantic (default), texture: vocal, mood: catharsis
- Ballet (Balanchine, Robbins, NYCB, ABT) → texture: grand, mood: catharsis, era: classical_period or romantic depending on score (Stravinsky → modern)
- Wind Orchestra / Brass Ensemble → texture: grand, era: classical_period to modern
- "Chamber" / "Quartet" / "Trio" → texture: intimate
- Conservatory student recital (Juilliard, MSM) → texture: intimate, complexity: layered
- Pre-concert lecture / Rush Hour Performance → still pick era/mood from the headline piece if mentioned

Era buckets (pick the dominant era; if mixed, pick the one that defines the listener experience — e.g. an all-Brahms program is "romantic"):
- baroque: Bach, Vivaldi, Handel, Pachelbel, Couperin, Telemann
- classical_period: Mozart, Haydn, early/mid Beethoven, C.P.E. Bach
- romantic: Chopin, Brahms, Schumann, Liszt, Tchaikovsky, Wagner, Mahler, Rachmaninoff, Verdi, Puccini, late Beethoven, Schubert
- impressionist: Debussy, Ravel, Fauré, Dukas
- modern: Stravinsky, Shostakovich, Bartók, Prokofiev, Schoenberg, R. Strauss, Satie, Copland
- contemporary: Adams, Glass, Reich, Pärt, Saariaho, living composers, premieres

moodCluster — what the audience comes for:
- catharsis: big emotion, drama, transcendence (most opera, most large symphonies)
- tranquility: calm, atmosphere, contemplation (Debussy, lieder, sacred choral)
- intellectual: structure, counterpoint, fugues, complexity to follow (Bach, late Beethoven quartets, serialism)
- energy: rhythmic drive, dance, momentum (most ballet, baroque concertos, Stravinsky)

texture:
- grand: full orchestra, large ensemble, ballet
- intimate: solo recital, chamber music, small ensemble
- vocal: opera, choral, lieder, voice as primary instrument
- mixed: only if genuinely ambiguous

complexity (for a curious newcomer):
- accessible: melodic, tonal, immediate (well-known repertoire, gateway works)
- layered: rewards close listening, classical-fluent audience (most chamber music, big symphonies)
- challenging: dissonant, atonal, avant-garde, requires effort (atonal, serial, very contemporary premieres)

tags: editorial booster tags like film_score, premiere, late_works, choral_masterwork, gateway_repertoire, virtuoso_showcase, early_music, ballet_suite, art_song, student_recital, masterclass. Use snake_case. Only include tags that are clearly true.

composers: surnames on the program. Empty array only if you genuinely cannot infer any.`;

export interface TaggerClientOptions {
  apiKey: string;
  /** Defaults to gpt-4o-mini — cheap and fast, plenty for classification. */
  model?: string;
}

/**
 * Tag a single event. Throws on OpenAI errors so callers can decide
 * whether to retry. The batched runner below catches per-event so one
 * bad row never blocks the whole catalog.
 */
export async function inferEventTaste(
  input: TaggerInput,
  options: TaggerClientOptions,
): Promise<InferredTaste> {
  const client = new OpenAI({ apiKey: options.apiKey });

  const userPrompt = [
    `Title: ${input.title}`,
    input.venueName ? `Venue: ${input.venueName}` : null,
    input.genre ? `Genre hint: ${input.genre}` : null,
    input.program ? `Program:\n${input.program}` : null,
    input.description ? `Description:\n${input.description}` : null,
  ]
    .filter(Boolean)
    .join("\n\n");

  const response = await client.chat.completions.create({
    model: options.model ?? "gpt-4o-mini",
    temperature: 0.2,
    max_tokens: 400,
    response_format: { type: "json_schema", json_schema: tasteJsonSchema },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
  });

  const raw = response.choices[0]?.message.content?.trim();
  if (!raw) {
    throw new Error("Tagger returned empty content");
  }
  const parsed = JSON.parse(raw) as Omit<InferredTaste, "taggedAt">;
  return {
    ...parsed,
    tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 6) : [],
    composers: Array.isArray(parsed.composers)
      ? parsed.composers.slice(0, 12)
      : [],
    taggedAt: new Date().toISOString(),
  };
}

/**
 * Run the tagger over `inputs` with bounded concurrency. Per-item
 * failures are surfaced as `null` in the returned array (same index)
 * so the caller can persist what succeeded.
 */
export async function inferEventTasteBatch(
  inputs: TaggerInput[],
  options: TaggerClientOptions & {
    concurrency?: number;
    onProgress?: (done: number, total: number) => void;
  },
): Promise<(InferredTaste | null)[]> {
  const concurrency = Math.max(1, options.concurrency ?? 4);
  const results = Array.from(
    { length: inputs.length },
    (): InferredTaste | null => null,
  );
  let cursor = 0;
  let done = 0;

  const worker = async () => {
    while (cursor < inputs.length) {
      const i = cursor++;
      const input = inputs[i];
      if (!input) continue;
      try {
        results[i] = await inferEventTaste(input, options);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn(`[taste-tagger] failed for "${input.title}": ${message}`);
        results[i] = null;
      } finally {
        done++;
        options.onProgress?.(done, inputs.length);
      }
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(concurrency, inputs.length) }, worker),
  );

  return results;
}
