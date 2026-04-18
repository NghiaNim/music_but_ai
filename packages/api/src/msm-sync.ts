import { and, eq, notInArray } from "@acme/db";
import { db } from "@acme/db/client";
import { LiveEvent } from "@acme/db/schema";

import { scrapeMSM } from "./venue-scraper";

function parseMsmDate(dateText: string | undefined): Date | null {
  if (!dateText?.trim()) return null;
  const primary = dateText.includes(" - ")
    ? dateText.split(" - ")[0]!.trim()
    : dateText.trim();
  const parsed = new Date(primary);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function inferGenreFromTitle(
  title: string,
): (typeof LiveEvent.$inferInsert)["genre"] {
  const t = title.toLowerCase();
  if (t.includes("opera")) return "opera";
  if (t.includes("jazz")) return "jazz";
  if (t.includes("ballet")) return "ballet";
  if (t.includes("choral") || t.includes("chorus")) return "choral";
  if (t.includes("chamber")) return "chamber";
  if (t.includes("orchestr") || t.includes("symphony")) return "orchestral";
  return "solo_recital";
}

export async function syncMsmPerformancesToLiveEvents(
  database: typeof db = db,
): Promise<{ upserted: number; removed: number }> {
  const scraped = await scrapeMSM();

  if (scraped.length === 0) {
    return { upserted: 0, removed: 0 };
  }

  const now = new Date();
  const urls = scraped.map((s) => s.eventUrl);

  for (const s of scraped) {
    const values: typeof LiveEvent.$inferInsert = {
      source: "msm",
      title: s.title.slice(0, 512),
      date: parseMsmDate(s.dateText),
      dateText: s.dateText,
      venueName: s.venueName ?? "Manhattan School of Music",
      location: s.location ?? "New York, NY",
      imageUrl: s.posterImageUrl,
      genre: inferGenreFromTitle(s.title),
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
    .where(and(eq(LiveEvent.source, "msm"), notInArray(LiveEvent.eventUrl, urls)))
    .returning({ id: LiveEvent.id });

  return { upserted: scraped.length, removed: removedRows.length };
}
