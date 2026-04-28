import type { Candidate, ScorerProfile } from "./score";

/**
 * Editorial rules — typed, hand-curated pathways that boost candidates
 * matching certain taste profiles. Intentionally a code module (not a
 * DB table or admin UI yet) so changes are reviewable in PRs.
 *
 * Each rule:
 *   - `applies` — does this rule fire for this profile?
 *   - `matches` — does this candidate match the rule's intent?
 *   - `label`  — short human description, surfaced in dev tools.
 *
 * A rule fires on a candidate iff `applies(profile) && matches(taste)`.
 * The pipeline collects every match and adds the editorial bonus once
 * per candidate (no double-stacking from multiple matching rules).
 */
export interface EditorialRule {
  id: string;
  label: string;
  applies: (profile: ScorerProfile) => boolean;
  matches: (
    taste: NonNullable<Candidate["taste"]>,
    candidate: Candidate,
  ) => boolean;
}

const tagsInclude = (tags: string[] | null | undefined, needles: string[]) =>
  Array.isArray(tags) && tags.some((t) => needles.includes(t));

const composerIs = (
  composers: string[] | null | undefined,
  surnames: string[],
) =>
  Array.isArray(composers) &&
  composers.some((c) => surnames.includes(c.split(" ").pop() ?? c));

export const EDITORIAL_RULES: EditorialRule[] = [
  {
    id: "film-bridge-cinematic",
    label:
      "Cross-genre bridge = film → boost cinematic late-romantic & 20th-c. orchestral works.",
    applies: (p) => p.crossGenreBridge === "film",
    matches: (taste) =>
      tagsInclude(taste.tags, ["film_score", "ballet_suite", "cinematic"]) ||
      composerIs(taste.composers, [
        "Korngold",
        "Prokofiev",
        "R. Strauss",
        "Williams",
        "Copland",
        "Stravinsky",
      ]),
  },
  {
    id: "catharsis-romantic-symphonic",
    label:
      "catharsis + romantic → boost late-romantic symphonies (Mahler, Brahms, late Beethoven).",
    applies: (p) =>
      p.emotionalOrientation === "catharsis" &&
      p.eraAffinities.includes("romantic"),
    matches: (taste) =>
      taste.texture === "grand" &&
      taste.moodCluster === "catharsis" &&
      composerIs(taste.composers, [
        "Mahler",
        "Brahms",
        "Beethoven",
        "Tchaikovsky",
        "Rachmaninoff",
        "Wagner",
      ]),
  },
  {
    id: "accessible-gateway",
    label:
      "complexity = accessible → prioritize gateway works for newer listeners.",
    applies: (p) => p.complexityTolerance === "accessible",
    matches: (taste) =>
      tagsInclude(taste.tags, ["gateway_repertoire", "well_known"]) ||
      composerIs(taste.composers, [
        "Vivaldi",
        "Mozart",
        "Beethoven",
        "Tchaikovsky",
        "Bach",
      ]),
  },
  {
    id: "intimate-chamber",
    label: "texture = intimate → boost chamber/recital programs.",
    applies: (p) => p.texturePreference === "intimate",
    matches: (taste) => taste.texture === "intimate",
  },
  {
    id: "discovery-contemporary",
    label:
      "motivation = discovery → surface premieres and contemporary programs.",
    applies: (p) => p.concertMotivation === "discovery",
    matches: (taste) =>
      taste.era === "contemporary" ||
      tagsInclude(taste.tags, [
        "premiere",
        "contemporary_premiere",
        "world_premiere",
        "new_release",
      ]),
  },
  {
    id: "prestige-marquee",
    label:
      "motivation = prestige → boost famous-soloist / iconic-orchestra programs.",
    applies: (p) => p.concertMotivation === "prestige",
    matches: (taste) =>
      tagsInclude(taste.tags, [
        "marquee",
        "virtuoso_showcase",
        "season_opener",
        "gala",
      ]),
  },
  {
    id: "intellectual-fugues",
    label:
      "intellectual mood → boost Bach/Beethoven late-period and structural works.",
    applies: (p) => p.emotionalOrientation === "intellectual",
    matches: (taste) =>
      composerIs(taste.composers, ["Bach", "Beethoven", "Schoenberg"]) ||
      tagsInclude(taste.tags, ["fugue", "late_works", "early_music"]),
  },
];

/**
 * Run every applicable rule and return the set of candidate IDs that
 * earned the editorial bonus. Operates on the candidate list once,
 * not per-rule, so it stays O(rules × candidates) regardless of fan-out.
 */
export function applyEditorialRules(
  candidates: Candidate[],
  profile: ScorerProfile,
): { boostedIds: Set<string>; firedRules: EditorialRule[] } {
  const firedRules = EDITORIAL_RULES.filter((r) => r.applies(profile));
  if (firedRules.length === 0) {
    return { boostedIds: new Set(), firedRules: [] };
  }

  const boostedIds = new Set<string>();
  for (const c of candidates) {
    if (!c.taste) continue;
    for (const rule of firedRules) {
      if (rule.matches(c.taste, c)) {
        boostedIds.add(c.id);
        break;
      }
    }
  }
  return { boostedIds, firedRules };
}
