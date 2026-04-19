import { db } from "@acme/db/client";

import { syncAllVenuesToLiveEvents } from "../src/live-event-sync.ts";

const result = await syncAllVenuesToLiveEvents(db);

console.log(
  `Venue sync complete: upserted ${result.totalUpserted}, removed stale ${result.totalRemoved}`,
);
for (const r of result.results) {
  const status = r.error
    ? `ERROR ${r.error}`
    : r.skipped
      ? "skipped (no rows scraped)"
      : `upserted=${r.upserted} removed=${r.removed}`;
  console.log(`  ${r.source}: ${status}`);
}

process.exit(0);
