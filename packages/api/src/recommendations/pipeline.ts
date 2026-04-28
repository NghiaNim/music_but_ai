import { and, asc, desc, eq, gte, isNull, or } from "@acme/db";
import { db } from "@acme/db/client";
import { Event, LiveEvent, UserMusicEvent, UserProfile } from "@acme/db/schema";

import type { Candidate, ScoredCandidate, ScorerProfile } from "./score";
import { diversify } from "./diversity";
import { applyEditorialRules } from "./rules";
import { scoreAndSort } from "./score";

type Database = typeof db;
type EventRow = typeof Event.$inferSelect;
type LiveEventRow = typeof LiveEvent.$inferSelect;

export interface RecommendationsInput {
  userId: string;
  /** Surface limit. Diversity filter operates on a window of `topN` (≤ 20). */
  limit?: number;
}

export interface RecommendationItem extends ScoredCandidate {
  /** Hydrated row for whichever table this came from. */
  event: EventRow | null;
  liveEvent: LiveEventRow | null;
}

export interface RecommendationsOutput {
  items: RecommendationItem[];
  /** Empty when the user has no profile — caller should fall back to popular. */
  hasProfile: boolean;
  /** For dev/debug — which editorial rules fired for this user. */
  firedRuleIds: string[];
}

/**
 * Pull all upcoming, non-cancelled candidates from both catalogs in
 * parallel. We deliberately do NOT pre-filter by taste here — the
 * scorer + diversity filter need the full surface to reason about
 * discovery and stretch picks.
 *
 * Cap the candidate pool at ~400 to keep the in-memory pass cheap.
 * If the catalog grows past this we'll need a smarter pre-filter.
 */
async function loadCandidates(database: Database): Promise<{
  events: EventRow[];
  liveEvents: LiveEventRow[];
}> {
  const now = new Date();
  const [events, liveEvents] = await Promise.all([
    database
      .select()
      .from(Event)
      .where(and(eq(Event.publicationStatus, "active"), gte(Event.date, now)))
      .orderBy(asc(Event.date), asc(Event.id))
      .limit(150),
    database
      .select()
      .from(LiveEvent)
      .where(
        and(
          eq(LiveEvent.cancelled, false),
          // Keep both dated future events and undated rows (Met Opera
          // often lacks parsed dates; we still want to surface them).
          or(gte(LiveEvent.date, now), isNull(LiveEvent.date)),
        ),
      )
      .orderBy(asc(LiveEvent.date), asc(LiveEvent.id))
      .limit(250),
  ]);
  return { events, liveEvents };
}

function eventToCandidate(row: EventRow): Candidate {
  return { id: row.id, source: "event", taste: row.taste ?? null };
}
function liveEventToCandidate(row: LiveEventRow): Candidate {
  return { id: row.id, source: "live_event", taste: row.taste ?? null };
}

/**
 * Many venues (NYCB especially) list every individual performance of
 * the same production as its own `LiveEvent` row. For recommendations,
 * the user cares about *what to see*, not *which night* — collapse to
 * one row per `(venue, normalized title)`, keeping the earliest
 * upcoming date.
 *
 * Defensive: only dedupes within the same source. Two community
 * `Event` rows with the same title from different hosts stay separate.
 */
function normalizeProductionKey(title: string, venue: string | null) {
  return `${(venue ?? "").trim().toLowerCase()}::${title
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^a-z0-9 ]/g, "")}`;
}

function dedupeLiveEventsByProduction(rows: LiveEventRow[]): LiveEventRow[] {
  const earliest = new Map<string, LiveEventRow>();
  for (const row of rows) {
    const key = normalizeProductionKey(row.title, row.venueName);
    const existing = earliest.get(key);
    if (!existing) {
      earliest.set(key, row);
      continue;
    }
    const existingTime = existing.date?.getTime() ?? Number.MAX_SAFE_INTEGER;
    const candidateTime = row.date?.getTime() ?? Number.MAX_SAFE_INTEGER;
    if (candidateTime < existingTime) {
      earliest.set(key, row);
    }
  }
  return [...earliest.values()];
}

function profileToScorer(
  profile: typeof UserProfile.$inferSelect,
): ScorerProfile {
  return {
    emotionalOrientation: profile.emotionalOrientation,
    texturePreference: profile.texturePreference,
    eraAffinities: profile.eraAffinities ?? [],
    complexityTolerance: profile.complexityTolerance,
    concertMotivation: profile.concertMotivation,
    crossGenreBridge: profile.crossGenreBridge,
  };
}

/**
 * Build the negative-signal set: composers the user has skipped on
 * heavily. Reads the recent event log; capped at the last 90 days.
 *
 * Defensive: returns an empty set on any error — better to under-
 * weight than to crash the recommender.
 */
function composerFromClipSkipMetadata(metadata: unknown): string | null {
  if (
    typeof metadata !== "object" ||
    metadata === null ||
    !("composer" in metadata) ||
    typeof (metadata as { composer: unknown }).composer !== "string"
  ) {
    return null;
  }
  return (metadata as { composer: string }).composer;
}

async function loadSkippedComposers(
  database: Database,
  userId: string,
): Promise<Set<string>> {
  try {
    const since = new Date();
    since.setDate(since.getDate() - 90);

    const rows = await database
      .select({
        metadata: UserMusicEvent.metadata,
      })
      .from(UserMusicEvent)
      .where(
        and(
          eq(UserMusicEvent.userId, userId),
          eq(UserMusicEvent.eventType, "clip_skip"),
          gte(UserMusicEvent.createdAt, since),
        ),
      )
      .orderBy(desc(UserMusicEvent.createdAt))
      .limit(200);

    const counts = new Map<string, number>();
    for (const row of rows) {
      const composer = composerFromClipSkipMetadata(row.metadata);
      if (!composer) continue;
      counts.set(composer, (counts.get(composer) ?? 0) + 1);
    }

    // Threshold: 3+ skips on the same composer counts as a real signal.
    return new Set(
      [...counts.entries()].filter(([, n]) => n >= 3).map(([c]) => c),
    );
  } catch (err) {
    console.warn(
      "[recommendations] could not load skipped composers:",
      err instanceof Error ? err.message : String(err),
    );
    return new Set();
  }
}

/**
 * Main entry point. Defensive throughout:
 *   - returns `hasProfile: false` if the user hasn't onboarded yet
 *   - swallows non-fatal errors in side data (skipped composers,
 *     similar users) so a missing index never breaks the home feed
 *
 * Skip penalties only apply once `clip_skip` rows with `composer` in
 * `metadata` are logged (planned client/logger path — until then harmless).
 */
export async function buildRecommendations(
  input: RecommendationsInput,
  database: Database = db,
): Promise<RecommendationsOutput> {
  const limit = Math.min(Math.max(input.limit ?? 20, 1), 20);

  const profileRow = await database.query.UserProfile.findFirst({
    where: eq(UserProfile.userId, input.userId),
  });

  if (!profileRow?.archetype) {
    return { items: [], hasProfile: false, firedRuleIds: [] };
  }

  const [{ events, liveEvents }, skippedComposers] = await Promise.all([
    loadCandidates(database),
    loadSkippedComposers(database, input.userId),
  ]);

  const dedupedLive = dedupeLiveEventsByProduction(liveEvents);

  const eventById = new Map(events.map((e) => [e.id, e]));
  const liveById = new Map(dedupedLive.map((e) => [e.id, e]));

  const candidates: Candidate[] = [
    ...events.map(eventToCandidate),
    ...dedupedLive.map(liveEventToCandidate),
  ];

  const scorer = profileToScorer(profileRow);

  const { boostedIds, firedRules } = applyEditorialRules(candidates, scorer);

  const ranked = scoreAndSort(candidates, scorer, {
    editorialBoostedIds: boostedIds,
    skippedComposers,
    similarUserHits: new Map(), // Method B deferred until ≥100 users.
  });

  const diversified = diversify(ranked, scorer);

  const items: RecommendationItem[] = diversified.slice(0, limit).map((c) => ({
    ...c,
    event: c.source === "event" ? (eventById.get(c.id) ?? null) : null,
    liveEvent: c.source === "live_event" ? (liveById.get(c.id) ?? null) : null,
  }));

  return {
    items,
    hasProfile: true,
    firedRuleIds: firedRules.map((r) => r.id),
  };
}
