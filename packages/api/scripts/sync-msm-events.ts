import { db } from "@acme/db/client";

import { syncMsmPerformancesToLiveEvents } from "../src/msm-sync.ts";

const result = await syncMsmPerformancesToLiveEvents(db);
console.log(
  `MSM sync complete: upserted ${result.upserted}, removed stale ${result.removed}`,
);
process.exit(0);
