import { and, eq, isNull, notInArray, sql } from "@acme/db";
import { db } from "@acme/db/client";
import { Event, LiveEvent } from "@acme/db/schema";

import type { ScrapedEvent, ScrapedVenue } from "./venue-scraper";
import { tagCatalog } from "./catalog-tagger";
import {
  scrapeCarnegieHall,
  scrapeJuilliard,
  scrapeMetOpera,
  scrapeMSM,
  scrapeNycBallet,
  scrapeNyPhil,
} from "./venue-scraper";

type Database = typeof db;

interface VenueDefaults {
  venueName: string;
  location: string;
}

const VENUE_DEFAULTS: Record<ScrapedVenue, VenueDefaults> = {
  carnegie_hall: { venueName: "Carnegie Hall", location: "New York, NY" },
  met_opera: { venueName: "Metropolitan Opera", location: "New York, NY" },
  juilliard: { venueName: "The Juilliard School", location: "New York, NY" },
  msm: { venueName: "Manhattan School of Music", location: "New York, NY" },
  ny_phil: { venueName: "New York Philharmonic", location: "New York, NY" },
  nycballet: { venueName: "New York City Ballet", location: "New York, NY" },
};

const SCRAPERS: Record<ScrapedVenue, () => Promise<ScrapedEvent[]>> = {
  carnegie_hall: scrapeCarnegieHall,
  met_opera: scrapeMetOpera,
  juilliard: scrapeJuilliard,
  msm: scrapeMSM,
  ny_phil: scrapeNyPhil,
  nycballet: scrapeNycBallet,
};

export const ALL_VENUE_SOURCES: ScrapedVenue[] = [
  "carnegie_hall",
  "met_opera",
  "juilliard",
  "msm",
  "ny_phil",
  "nycballet",
];

function parseScrapedDate(dateText: string | undefined): Date | null {
  if (!dateText?.trim()) return null;

  const raw = dateText.replace(/\s+/g, " ").trim();
  const direct = new Date(raw);
  if (!Number.isNaN(direct.getTime())) return direct;

  // NYCB often returns ranges like:
  // "Wed Apr 22 - Fri May 8, 2026"
  // Parse first day and carry over year from the right side.
  const rangeWithYear =
    /^([A-Za-z]{3}\s+[A-Za-z]{3}\s+\d{1,2})\s*-\s*[A-Za-z]{3}\s+[A-Za-z]{3}\s+\d{1,2},\s*(\d{4})$/.exec(
      raw,
    );
  if (rangeWithYear) {
    const left = `${rangeWithYear[1]}, ${rangeWithYear[2]}`;
    const parsedLeft = new Date(left);
    if (!Number.isNaN(parsedLeft.getTime())) return parsedLeft;
  }

  // Common feeds append details after a separator:
  // "Apr 27, 2026 12:00 pm - Apr 30, 2026 12:00 pm"
  // "May 10, 2026 | Alice Tully Hall"
  const firstSegment = raw.split(/\s[-|]\s/)[0]?.trim();
  if (!firstSegment) return null;
  const year = /\b((?:19|20)\d{2})\b/.exec(raw)?.[1];
  const firstWithYear =
    year && !/\b(?:19|20)\d{2}\b/.test(firstSegment)
      ? `${firstSegment}, ${year}`
      : firstSegment;
  const parsedFirst = new Date(firstWithYear);
  return Number.isNaN(parsedFirst.getTime()) ? null : parsedFirst;
}

function stripCancellationTitlePrefix(title: string): string {
  return title.replace(/^\s*(canceled|cancelled)\s*:\s*/i, "").trim() || title;
}

function inferGenreFromTitle(
  source: ScrapedVenue,
  title: string,
): (typeof LiveEvent.$inferInsert)["genre"] {
  // Met productions are opera by default; title-only inference often mislabels
  // items like "La Boheme" as solo recital.
  if (source === "met_opera") return "opera";
  const t = stripCancellationTitlePrefix(title).toLowerCase();
  if (t.includes("opera")) return "opera";
  if (t.includes("jazz")) return "jazz";
  if (t.includes("ballet")) return "ballet";
  if (t.includes("choral") || t.includes("chorus")) return "choral";
  if (t.includes("chamber")) return "chamber";
  if (t.includes("orchestr") || t.includes("symphony")) return "orchestral";
  return "solo_recital";
}

export type VenueSyncStatus = "success" | "skipped" | "failed";

export interface VenueSyncResult {
  source: ScrapedVenue;
  /** `success` = rows persisted; `skipped` = scraper returned 0 rows (no DB wipe); `failed` = scraper threw. */
  status: VenueSyncStatus;
  upserted: number;
  removed: number;
  /** @deprecated use `status === "skipped"` */
  skipped?: boolean;
  error?: string;
  durationMs: number;
}

export interface SyncAllVenuesSummary {
  venueCount: number;
  succeeded: number;
  skipped: number;
  failed: number;
  failures: { source: ScrapedVenue; error: string }[];
}

/**
 * Upsert one venue's scraped events into LiveEvent and delete rows for that
 * source that were not seen in the latest scrape. If the scraper returns zero
 * rows we treat it as "skip" rather than wiping the table — protects against
 * transient anti-bot blocks.
 */
export async function syncVenueToLiveEvents(
  source: ScrapedVenue,
  database: Database = db,
): Promise<VenueSyncResult> {
  const scraper = SCRAPERS[source];
  const defaults = VENUE_DEFAULTS[source];
  const started = Date.now();

  let scraped: ScrapedEvent[];
  try {
    scraped = await scraper();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      source,
      status: "failed",
      upserted: 0,
      removed: 0,
      error: message,
      durationMs: Date.now() - started,
    };
  }

  if (scraped.length === 0) {
    return {
      source,
      status: "skipped",
      upserted: 0,
      removed: 0,
      skipped: true,
      durationMs: Date.now() - started,
    };
  }

  const now = new Date();
  const urls = scraped.map((s) => s.eventUrl);

  for (const s of scraped) {
    const values = {
      source,
      title: s.title.slice(0, 512),
      cancelled: s.cancelled ?? false,
      date: parseScrapedDate(s.dateText),
      dateText: s.dateText,
      venueName: s.venueName ?? defaults.venueName,
      location: s.location ?? defaults.location,
      imageUrl: s.posterImageUrl,
      genre: s.genreHint ?? inferGenreFromTitle(source, s.title),
      eventUrl: s.eventUrl,
      buyUrl: s.buyUrl,
      raw: s,
      lastSeenAt: now,
    };

    await database
      .insert(LiveEvent)
      .values(values)
      .onConflictDoUpdate({
        target: LiveEvent.eventUrl,
        set: {
          title: values.title,
          cancelled: values.cancelled,
          date: values.date,
          dateText: values.dateText,
          venueName: values.venueName,
          location: values.location,
          imageUrl: values.imageUrl,
          genre: values.genre,
          buyUrl: values.buyUrl,
          raw: values.raw,
          lastSeenAt: now,
          updatedAt: now,
        },
      });
  }

  const removedRows = await database
    .delete(LiveEvent)
    .where(
      and(eq(LiveEvent.source, source), notInArray(LiveEvent.eventUrl, urls)),
    )
    .returning({ id: LiveEvent.id });

  return {
    source,
    status: "success",
    upserted: scraped.length,
    removed: removedRows.length,
    durationMs: Date.now() - started,
  };
}

/**
 * Run every venue scraper **in parallel** (`Promise.allSettled`) and persist
 * each source independently. NY Phil, NYCB, etc. do not await each other;
 * a slow or failing scraper only affects its own `VenueSyncResult` row.
 */
function buildSyncSummary(results: VenueSyncResult[]): SyncAllVenuesSummary {
  const failures = results
    .filter((r) => r.status === "failed" && r.error)
    .map((r) => ({ source: r.source, error: r.error ?? "unknown error" }));
  return {
    venueCount: results.length,
    succeeded: results.filter((r) => r.status === "success").length,
    skipped: results.filter((r) => r.status === "skipped").length,
    failed: results.filter((r) => r.status === "failed").length,
    failures,
  };
}

export async function syncAllVenuesToLiveEvents(
  database: Database = db,
): Promise<{
  totalUpserted: number;
  totalRemoved: number;
  results: VenueSyncResult[];
  summary: SyncAllVenuesSummary;
  allSucceeded: boolean;
}> {
  await database
    .update(LiveEvent)
    .set({ cancelled: true, updatedAt: new Date() })
    .where(
      and(
        eq(LiveEvent.cancelled, false),
        sql`trim(${LiveEvent.title}) ~* '^\\s*(canceled|cancelled)\\s*:'`,
      ),
    );

  const settled = await Promise.allSettled(
    ALL_VENUE_SOURCES.map((source) => syncVenueToLiveEvents(source, database)),
  );

  const results: VenueSyncResult[] = settled.map((r, i) => {
    const source = ALL_VENUE_SOURCES[i];
    if (!source) {
      throw new Error(`Unknown venue source index: ${i}`);
    }
    if (r.status === "fulfilled") return r.value;
    return {
      source,
      status: "failed" as const,
      upserted: 0,
      removed: 0,
      error: r.reason instanceof Error ? r.reason.message : String(r.reason),
      durationMs: 0,
    };
  });

  const summary = buildSyncSummary(results);

  return {
    totalUpserted: results.reduce((sum, r) => sum + r.upserted, 0),
    totalRemoved: results.reduce((sum, r) => sum + r.removed, 0),
    results,
    summary,
    allSucceeded: summary.failed === 0,
  };
}

/**
 * Run the catalog tagger over any rows still missing taste annotations
 * across BOTH `Event` (community-posted) and `LiveEvent` (scraped).
 *
 * Defensive design notes:
 *   - The pre-check intentionally covers both tables. Earlier we only
 *     checked `LiveEvent`, which short-circuited and silently left
 *     untagged community Events behind once all LiveEvents were tagged.
 *   - Best-effort throughout: errors are logged but never thrown.
 *     Taste tags are useful but must never block listing an event.
 *
 * Caller decides whether to await: cron routes typically `void`-call
 * this inside `after()` so the HTTP response returns fast.
 */
export async function tagUntaggedCatalog(
  database: Database = db,
): Promise<void> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn(
      "[live-event-sync] OPENAI_API_KEY missing — skipping taste tagging",
    );
    return;
  }

  const [liveRow] = await database
    .select({ count: sql<number>`count(*)::int` })
    .from(LiveEvent)
    .where(isNull(LiveEvent.taste));
  const [eventRow] = await database
    .select({ count: sql<number>`count(*)::int` })
    .from(Event)
    .where(isNull(Event.taste));

  const untagged = (liveRow?.count ?? 0) + (eventRow?.count ?? 0);
  if (untagged === 0) return;

  try {
    const result = await tagCatalog({ apiKey, maxRows: 100 }, database);
    console.log(
      `[live-event-sync] taste-tagged ${result.tagged}/${result.scanned} (failed=${result.failed}, ${result.durationMs}ms)`,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`[live-event-sync] taste tagging failed: ${message}`);
  }
}

/** @deprecated use `tagUntaggedCatalog` — same behavior, accurate name. */
export const tagUntaggedLiveEvents = tagUntaggedCatalog;

/** Backward-compat: previous public name. */
export async function syncMsmPerformancesToLiveEvents(
  database: Database = db,
): Promise<{ upserted: number; removed: number }> {
  const r = await syncVenueToLiveEvents("msm", database);
  return { upserted: r.upserted, removed: r.removed };
}
