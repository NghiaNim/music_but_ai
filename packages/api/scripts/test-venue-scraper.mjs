import { scrapeAllVenues } from "../src/venue-scraper.ts";

const events = await scrapeAllVenues();

console.log(`total_events=${events.length}`);

const bySource = events.reduce((acc, event) => {
  acc[event.source] = (acc[event.source] ?? 0) + 1;
  return acc;
}, {});

for (const [source, count] of Object.entries(bySource)) {
  console.log(`${source}=${count}`);
}

for (const event of events.slice(0, 8)) {
  console.log(`- [${event.source}] ${event.title} -> ${event.buyUrl}`);
}
