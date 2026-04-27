import { db } from "@acme/db/client";

import { syncAllVenuesToLiveEvents } from "../src/live-event-sync.ts";

const result = await syncAllVenuesToLiveEvents(db);

console.log(
  `Venue sync complete: upserted ${result.totalUpserted}, removed stale ${result.totalRemoved}`,
);
console.log(
  `  Summary: ${result.summary.succeeded} ok, ${result.summary.skipped} skipped (0 rows), ${result.summary.failed} failed`,
);
for (const r of result.results) {
  const line =
    r.status === "failed"
      ? `ERROR ${r.error ?? "?"}`
      : r.status === "skipped"
        ? "skipped (no rows scraped)"
        : `upserted=${r.upserted} removed=${r.removed}`;
  console.log(`  ${r.source} [${r.status}, ${r.durationMs}ms]: ${line}`);
}
if (result.summary.failures.length > 0) {
  console.error("Failures:", result.summary.failures);
}

process.exit(result.allSucceeded ? 0 : 1);
