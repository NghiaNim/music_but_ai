import type { ScoredCandidate, ScorerProfile } from "./score";

export interface DiversityConstraints {
  /** Max items from the same era inside the top N. */
  maxPerEraInTop10: number;
  /** Max items from the same composer in the full top N. */
  maxPerComposerInTop20: number;
  /** Min items from outside the user's stated era affinities. */
  minDiscoveryInTop20: number;
  /** Top window we operate on. Items beyond this are returned as-is. */
  topN: number;
}

export const DEFAULT_CONSTRAINTS: DiversityConstraints = {
  maxPerEraInTop10: 3,
  maxPerComposerInTop20: 2,
  minDiscoveryInTop20: 2,
  topN: 20,
};

const UNKNOWN_ERA = "_unknown";

/**
 * After ranking, build a diverse top-N window from the entire ranked
 * list (not just the original top-N — we *want* to swap in lower-
 * ranked items if higher-ranked ones violate the caps).
 *
 * Algorithm (single pass over ranked, with two slot windows):
 *   - Top-10 slots: enforce era cap (≤3 per era) + composer cap.
 *   - Slots 11–20: enforce composer cap only.
 *   - Anything beyond passes through.
 *
 * Then a discovery quota pass swaps in items from outside the user's
 * stated era affinities if we don't already have enough.
 */
function violatesComposerCap(
  items: ScoredCandidate[],
  maxPerComposerInTop20: number,
  getComposers: (c: ScoredCandidate) => string[],
): boolean {
  const counts = new Map<string, number>();
  for (const c of items) {
    for (const comp of getComposers(c)) {
      const next = (counts.get(comp) ?? 0) + 1;
      if (next > maxPerComposerInTop20) return true;
      counts.set(comp, next);
    }
  }
  return false;
}

export function diversify(
  ranked: ScoredCandidate[],
  profile: ScorerProfile,
  constraints: DiversityConstraints = DEFAULT_CONSTRAINTS,
): ScoredCandidate[] {
  if (ranked.length === 0) return ranked;

  const topN = Math.min(constraints.topN, ranked.length);
  const top10Slots = Math.min(10, topN);

  if (process.env.DEBUG_DIVERSITY) {
    console.log(
      "[diversify] input eras (top 30):",
      ranked.slice(0, 30).map((c) => c.taste?.era ?? UNKNOWN_ERA),
    );
  }

  const eraCount = new Map<string, number>();
  const composerCount = new Map<string, number>();
  const top10: ScoredCandidate[] = [];
  const tail: ScoredCandidate[] = []; // slots 11..topN
  const used = new Set<string>(); // candidate ids already placed
  const composersForCandidate = (c: ScoredCandidate) =>
    c.taste?.composers ?? [];
  const composerCapHit = (c: ScoredCandidate) =>
    composersForCandidate(c).some(
      (composer) =>
        (composerCount.get(composer) ?? 0) >= constraints.maxPerComposerInTop20,
    );
  const bumpComposers = (c: ScoredCandidate) => {
    for (const composer of composersForCandidate(c)) {
      composerCount.set(composer, (composerCount.get(composer) ?? 0) + 1);
    }
  };

  // Single greedy pass: prefer placing in top-10 (more competitive),
  // fall back to tail slots otherwise. Items that fit nowhere just
  // wait in the leftover bucket.
  for (const cand of ranked) {
    if (top10.length >= top10Slots && tail.length >= topN - top10Slots) {
      break; // both windows full
    }

    const era = cand.taste?.era ?? "_unknown";
    const eraNow = eraCount.get(era) ?? 0;
    const composerOver = composerCapHit(cand);

    const fitsTop10 =
      top10.length < top10Slots &&
      eraNow < constraints.maxPerEraInTop10 &&
      !composerOver;
    if (fitsTop10) {
      top10.push(cand);
      eraCount.set(era, eraNow + 1);
      bumpComposers(cand);
      used.add(cand.id);
      continue;
    }

    const fitsTail = tail.length < topN - top10Slots && !composerOver;
    if (fitsTail) {
      tail.push(cand);
      bumpComposers(cand);
      used.add(cand.id);
    }
  }

  const accepted = [...top10, ...tail];

  // Discovery quota — require at least N items from outside the
  // user's stated era affinities. No-op if the user has none.
  const stated = new Set(profile.eraAffinities);
  if (stated.size > 0) {
    const isDiscovery = (c: ScoredCandidate) => {
      const era = c.taste?.era;
      return !era || !stated.has(era);
    };
    /** Only swap slots 11–20 so discovery quota cannot break top-10 era caps. */
    const tailSwapIndexOk = (idx: number) => idx >= top10Slots;

    // Greedy: pull discovery items further down `ranked` into the tail
    // slots, replacing lowest-scoring non-discovery tail entries. Each
    // swap skips if it would violate the composer ceiling.
    while (
      accepted.filter(isDiscovery).length < constraints.minDiscoveryInTop20
    ) {
      let improved = false;
      outer: for (const replacement of ranked) {
        if (used.has(replacement.id) || !isDiscovery(replacement))
          continue;
        const tailTargets = accepted
          .map((c, idx) => ({ c, idx }))
          .filter(
            ({ c, idx }) => tailSwapIndexOk(idx) && !isDiscovery(c),
          )
          .sort((a, b) => a.c.score - b.c.score);

        for (const tgt of tailTargets) {
          const candidateList = [...accepted];
          candidateList[tgt.idx] = replacement;
          if (
            violatesComposerCap(
              candidateList,
              constraints.maxPerComposerInTop20,
              composersForCandidate,
            )
          )
            continue;
          accepted[tgt.idx] = replacement;
          used.delete(tgt.c.id);
          used.add(replacement.id);
          improved = true;
          break outer;
        }
      }
      if (!improved) break;
    }
  }

  if (process.env.DEBUG_DIVERSITY) {
    console.log(
      "[diversify] final eras:",
      accepted.map((c) => c.taste?.era ?? UNKNOWN_ERA),
    );
  }

  // Return diversified top-N plus remaining ranked tail (for pagination).
  const remaining = ranked.filter((c) => !used.has(c.id));
  return [...accepted, ...remaining];
}
