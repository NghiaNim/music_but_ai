import type { EventTasteAnnotation } from "@acme/db/schema";

/**
 * Trimmed user-profile shape the scorer needs. We only depend on the
 * derived taste columns so the scorer stays dependency-light and can
 * be unit-tested without a database.
 */
export interface ScorerProfile {
  emotionalOrientation: string | null;
  texturePreference: string | null;
  eraAffinities: string[];
  complexityTolerance: string | null;
  concertMotivation: string | null;
  crossGenreBridge: string | null;
}

export interface Candidate {
  id: string;
  source: "event" | "live_event";
  taste: EventTasteAnnotation | null;
  /** Optional: passed through for downstream UI. Not used for scoring. */
  passthrough?: Record<string, unknown>;
}

export interface ScoredCandidate extends Candidate {
  score: number;
  /**
   * Human-readable reason strings explaining the score. Surfaced in
   * the UI as "Why we're showing this" — turns recommendations from
   * a black box into a conversation.
   */
  reasons: string[];
}

/**
 * Tunable weights. Defaults follow the spec's starting points; we
 * expose them so future A/B tests can adjust without touching call
 * sites.
 */
export interface ScoringWeights {
  base: number;
  eraMatch: number;
  /** Cap on era stacking — prevents a 3-era user from getting +0.9. */
  eraMatchCap: number;
  textureMatch: number;
  moodMatch: number;
  complexityMatch: number;
  editorialBoost: number;
  similarUserPerHit: number;
  similarUserCap: number;
  similarSkipPenalty: number;
  premiereBonus: number;
}

export const DEFAULT_WEIGHTS: ScoringWeights = {
  base: 1.0,
  eraMatch: 0.3,
  eraMatchCap: 0.6,
  textureMatch: 0.2,
  moodMatch: 0.25,
  complexityMatch: 0.15,
  editorialBoost: 0.4,
  similarUserPerHit: 0.1,
  similarUserCap: 0.5,
  similarSkipPenalty: 0.5,
  premiereBonus: 0.1,
};

export interface ScoreContext {
  /** IDs of editorial-boosted candidates (from `rules.ts`). */
  editorialBoostedIds: Set<string>;
  /** Composers the user has skipped on heavily (negative signal). */
  skippedComposers: Set<string>;
  /**
   * For Method B (collaborative). Map candidate id → number of
   * similar users who engaged with it. Empty until we have ≥100 users.
   */
  similarUserHits: Map<string, number>;
  weights?: Partial<ScoringWeights>;
}

const ERA_LABEL: Record<string, string> = {
  baroque: "Baroque",
  classical_period: "Classical period",
  romantic: "Romantic",
  impressionist: "Impressionist",
  modern: "20th century",
  contemporary: "Contemporary",
};

const MOOD_LABEL: Record<string, string> = {
  catharsis: "cathartic",
  tranquility: "tranquil",
  intellectual: "structurally rich",
  energy: "energetic",
};

const TEXTURE_LABEL: Record<string, string> = {
  grand: "grand orchestral",
  intimate: "intimate chamber",
  vocal: "vocal-led",
  mixed: "blended",
};

/**
 * Score a single candidate against a profile. Pure function — no IO.
 * The `reasons` field captures *why* each delta was applied so the UI
 * can show explainable recommendations.
 */
export function scoreCandidate(
  candidate: Candidate,
  profile: ScorerProfile,
  context: ScoreContext,
): ScoredCandidate {
  const w = { ...DEFAULT_WEIGHTS, ...(context.weights ?? {}) };
  const reasons: string[] = [];
  let score = w.base;

  const taste = candidate.taste;

  if (taste?.era && profile.eraAffinities.includes(taste.era)) {
    // Stacking is naturally capped because we only ever match one era
    // per candidate, but we expose the cap for symmetry with the spec.
    const delta = Math.min(w.eraMatch, w.eraMatchCap);
    score += delta;
    reasons.push(`Matches your ${ERA_LABEL[taste.era] ?? taste.era} interest`);
  }

  if (taste?.texture && profile.texturePreference === taste.texture) {
    score += w.textureMatch;
    reasons.push(
      `${TEXTURE_LABEL[taste.texture] ?? taste.texture} setting fits you`,
    );
  }

  if (
    taste?.moodCluster &&
    profile.emotionalOrientation === taste.moodCluster
  ) {
    score += w.moodMatch;
    reasons.push(
      `Hits your ${MOOD_LABEL[taste.moodCluster] ?? taste.moodCluster} sweet spot`,
    );
  }

  if (taste?.complexity && profile.complexityTolerance === taste.complexity) {
    score += w.complexityMatch;
    // Don't surface complexity as a reason — too inside-baseball.
  }

  if (context.editorialBoostedIds.has(candidate.id)) {
    score += w.editorialBoost;
    reasons.push("Curator's pick for your taste");
  }

  const similarHits = context.similarUserHits.get(candidate.id) ?? 0;
  if (similarHits > 0) {
    const delta = Math.min(similarHits * w.similarUserPerHit, w.similarUserCap);
    score += delta;
    reasons.push(`Loved by ${similarHits} listeners like you`);
  }

  // Negative: penalize when a composer the user has clearly skipped on
  // appears here too. Defensive `?? []` — taste may be null on
  // never-tagged rows.
  const composerHits = (taste?.composers ?? []).filter((c) =>
    context.skippedComposers.has(c),
  );
  if (composerHits.length > 0) {
    score -= w.similarSkipPenalty;
    // Don't show the penalty reason — would feel passive-aggressive.
  }

  const tags =
    taste && Array.isArray(taste.tags) ? taste.tags : ([] as string[]);
  if (tags.some((tag) => tag === "premiere" || tag === "new_release")) {
    score += w.premiereBonus;
    reasons.push("Premiere or new release");
  }

  return {
    ...candidate,
    score: Number(score.toFixed(3)),
    reasons,
  };
}

/** Convenience: score and sort descending. */
export function scoreAndSort(
  candidates: Candidate[],
  profile: ScorerProfile,
  context: ScoreContext,
): ScoredCandidate[] {
  return candidates
    .map((c) => scoreCandidate(c, profile, context))
    .sort((a, b) => b.score - a.score);
}
