import { db } from "@acme/db/client";
import { LiveEvent } from "@acme/db/schema";

import { scrapeAllVenues } from "../src/venue-scraper.ts";

function parseDate(dateText) {
  if (!dateText) return null;
  const parsed = new Date(dateText);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

async function syncLiveEvents() {
  const scraped = await scrapeAllVenues();

  if (scraped.length === 0) {
    console.warn("No events scraped; skipping DB write.");
    return;
  }

  await db.transaction(async (tx) => {
    await tx.delete(LiveEvent);
    await tx.insert(LiveEvent).values(
      scraped.map((event) => ({
        source: event.source,
        title: event.title,
        dateText: event.dateText,
        date: parseDate(event.dateText),
        venueName: event.venueName,
        location: event.location,
        eventUrl: event.eventUrl,
        buyUrl: event.buyUrl,
        raw: event,
      })),
    );
  });

  const counts = scraped.reduce((acc, event) => {
    acc[event.source] = (acc[event.source] ?? 0) + 1;
    return acc;
  }, {});

  console.log(`Synced ${scraped.length} live events`);
  for (const [source, count] of Object.entries(counts)) {
    console.log(`- ${source}: ${count}`);
  }
}

const runOnce = process.argv.includes("--once");
const pollMinutes = Number(process.env.LIVE_EVENT_POLL_MINUTES ?? "60");

await syncLiveEvents();

if (!runOnce) {
  const ms = Math.max(1, pollMinutes) * 60 * 1000;
  console.log(`Polling every ${pollMinutes} minute(s)...`);
  setInterval(() => {
    syncLiveEvents().catch((err) => {
      console.error("Poll run failed:", err);
    });
  }, ms);
}
