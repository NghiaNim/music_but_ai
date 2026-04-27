import { and, eq, notInArray, sql } from "@acme/db";
import { db } from "@acme/db/client";
import { LiveEvent } from "@acme/db/schema";

import type { ScrapedEvent, ScrapedVenue } from "./venue-scraper";
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
  const parsedFirst = new Date(firstSegment);
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

export interface VenueSyncResult {
  source: ScrapedVenue;
  upserted: number;
  removed: number;
  skipped?: boolean;
  error?: string;
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

  let scraped: ScrapedEvent[];
  try {
    scraped = await scraper();
  } catch (err) {
    return {
      source,
      upserted: 0,
      removed: 0,
      error: err instanceof Error ? err.message : String(err),
    };
  }

  if (scraped.length === 0) {
    return { source, upserted: 0, removed: 0, skipped: true };
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

  return { source, upserted: scraped.length, removed: removedRows.length };
}

/**
 * Run every venue scraper concurrently and persist results. Failures in one
 * venue never block the others.
 */
export async function syncAllVenuesToLiveEvents(
  database: Database = db,
): Promise<{
  totalUpserted: number;
  totalRemoved: number;
  results: VenueSyncResult[];
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
      upserted: 0,
      removed: 0,
      error: r.reason instanceof Error ? r.reason.message : String(r.reason),
    };
  });

  return {
    totalUpserted: results.reduce((sum, r) => sum + r.upserted, 0),
    totalRemoved: results.reduce((sum, r) => sum + r.removed, 0),
    results,
  };
}

/** Backward-compat: previous public name. */
export async function syncMsmPerformancesToLiveEvents(
  database: Database = db,
): Promise<{ upserted: number; removed: number }> {
  const r = await syncVenueToLiveEvents("msm", database);
  return { upserted: r.upserted, removed: r.removed };
}
