import { db } from "@acme/db/client";

import { tagCatalog } from "../src/catalog-tagger.ts";

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error("OPENAI_API_KEY missing — set it in .env.");
  process.exit(2);
}

const force = process.argv.includes("--force");
const refreshNulls = process.argv.includes("--refresh-nulls");
const maxRowsArg = process.argv.find((a) => a.startsWith("--max="));
const maxRows = maxRowsArg ? Number(maxRowsArg.slice(6)) : 200;

console.log(
  `[tag-catalog] starting — force=${force} refreshNulls=${refreshNulls} maxRows=${maxRows}`,
);

const result = await tagCatalog({ apiKey, maxRows, force, refreshNulls }, db);

console.log(
  `[tag-catalog] done in ${result.durationMs}ms — scanned=${result.scanned} tagged=${result.tagged} failed=${result.failed}`,
);

process.exit(result.failed === result.scanned && result.scanned > 0 ? 1 : 0);
