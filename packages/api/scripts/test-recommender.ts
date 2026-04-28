import { db } from "@acme/db/client";

import { buildRecommendations } from "../src/recommendations/index.ts";

const userIdArg = process.argv.find((a) => a.startsWith("--user="));
if (!userIdArg) {
  console.error(
    "Usage: pnpm -F @acme/api test-recommender -- --user=<userId>\n" +
      "Pick a userId from the `user` table that has a derived profile.",
  );
  process.exit(2);
}
const userId = userIdArg.slice(7);

const result = await buildRecommendations({ userId, limit: 20 }, db);
console.log(`hasProfile=${result.hasProfile}`);
console.log(`firedRules=${result.firedRuleIds.join(", ") || "(none)"}`);
console.log(`returned ${result.items.length} items\n`);

for (const [i, item] of result.items.entries()) {
  const title = item.event?.title ?? item.liveEvent?.title ?? "(unknown title)";
  const venue =
    item.event?.venue ?? item.liveEvent?.venueName ?? "(unknown venue)";
  const era = item.taste?.era ?? "—";
  const composers =
    item.taste?.composers && item.taste.composers.length > 0
      ? item.taste.composers.slice(0, 3).join(", ")
      : "—";
  console.log(
    `${String(i + 1).padStart(2)}. [${item.score.toFixed(2)}] ${title.slice(0, 60).padEnd(60)} (${item.source}, ${era}, ${composers})`,
  );
  if (item.reasons.length > 0) {
    console.log(`     ↳ ${item.reasons.join(" · ")}`);
  }
}

process.exit(0);
