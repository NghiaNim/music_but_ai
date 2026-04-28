import type { InferredTaste, TaggerInput } from "@acme/ai";
import type { EventTasteAnnotation } from "@acme/db/schema";
import { inferEventTasteBatch } from "@acme/ai";
import { eq, isNull, lt, or, sql } from "@acme/db";
import { db } from "@acme/db/client";
import { Event, LiveEvent } from "@acme/db/schema";

type Database = typeof db;

/**
 * Re-tag rows whose annotation is older than this. 60 days is generous
 * — events themselves rarely change after publication, but our tagger
 * prompt does, so an occasional refresh is worth the API spend.
 */
const STALE_AFTER_DAYS = 60;

export interface CatalogTaggerOptions {
  apiKey: string;
  /** Cap how many rows we hit per run, to keep cron jobs predictable. */
  maxRows?: number;
  /** OpenAI concurrency. */
  concurrency?: number;
  /** Skip the staleness check and re-tag everything. */
  force?: boolean;
  /**
   * Re-tag rows whose era came back null on a previous run. Cheaper
   * than `force` when iterating on the prompt.
   */
  refreshNulls?: boolean;
}

export interface CatalogTaggerResult {
  scanned: number;
  tagged: number;
  failed: number;
  durationMs: number;
}

const STALE_TIMESTAMP_SQL = sql`(NOW() - INTERVAL '${sql.raw(
  String(STALE_AFTER_DAYS),
)} days')`;

function eventInputFor(row: typeof Event.$inferSelect): TaggerInput {
  return {
    title: row.title,
    program: row.program,
    description: row.description,
    genre: row.genre,
    venueName: row.venue,
  };
}

function liveInputFor(row: typeof LiveEvent.$inferSelect): TaggerInput {
  // LiveEvent has no rich `program` text; the title + venue + genre is
  // usually enough for the tagger to bucket era/mood correctly.
  return {
    title: row.title,
    program: null,
    description: null,
    genre: row.genre,
    venueName: row.venueName ?? null,
  };
}

function asAnnotation(t: InferredTaste): EventTasteAnnotation {
  return {
    era: t.era,
    moodCluster: t.moodCluster,
    texture: t.texture,
    complexity: t.complexity,
    tags: t.tags,
    composers: t.composers,
    taggedAt: t.taggedAt,
  };
}

async function tagTable<TRow extends { id: string }>(args: {
  rows: TRow[];
  toInput: (row: TRow) => TaggerInput;
  persist: (id: string, taste: EventTasteAnnotation) => Promise<unknown>;
  apiKey: string;
  concurrency: number;
  label: string;
}): Promise<{ tagged: number; failed: number }> {
  if (args.rows.length === 0) return { tagged: 0, failed: 0 };

  const inputs = args.rows.map(args.toInput);
  const inferred = await inferEventTasteBatch(inputs, {
    apiKey: args.apiKey,
    concurrency: args.concurrency,
    onProgress: (done, total) => {
      if (done === total || done % 10 === 0) {
        console.log(`[catalog-tagger] ${args.label} ${done}/${total}`);
      }
    },
  });

  let tagged = 0;
  let failed = 0;
  await Promise.all(
    inferred.map(async (taste, i) => {
      const row = args.rows[i];
      if (!row) return;
      if (!taste) {
        failed++;
        return;
      }
      try {
        await args.persist(row.id, asAnnotation(taste));
        tagged++;
      } catch (err) {
        failed++;
        const message = err instanceof Error ? err.message : String(err);
        console.warn(
          `[catalog-tagger] persist failed for ${args.label} ${row.id}: ${message}`,
        );
      }
    }),
  );

  return { tagged, failed };
}

/**
 * Tag every untagged or stale row in `Event` and `LiveEvent`. Safe to
 * run repeatedly — only hits OpenAI for rows that need it.
 *
 * Designed to be invoked from:
 *   - the CLI (`pnpm -F @acme/api tag-catalog`)
 *   - the venue sync API route, fire-and-forget after upsert
 */
export async function tagCatalog(
  options: CatalogTaggerOptions,
  database: Database = db,
): Promise<CatalogTaggerResult> {
  const started = Date.now();
  const maxRows = options.maxRows ?? 200;
  const concurrency = options.concurrency ?? 4;

  // "Refresh nulls" = re-tag rows where the era field came back null.
  // Useful when the prompt is improved and we want to retry low-info
  // rows without burning API tokens on already-good rows.
  const refreshNulls = options.refreshNulls ?? false;

  const stalePredicate = options.force
    ? sql`TRUE`
    : refreshNulls
      ? or(isNull(Event.taste), sql`${Event.taste} ->> 'era' IS NULL`)
      : or(
          isNull(Event.taste),
          lt(
            sql`(${Event.taste} ->> 'taggedAt')::timestamptz`,
            STALE_TIMESTAMP_SQL,
          ),
        );

  const events = await database
    .select()
    .from(Event)
    .where(stalePredicate)
    .limit(maxRows);

  const liveStalePredicate = options.force
    ? sql`TRUE`
    : refreshNulls
      ? or(isNull(LiveEvent.taste), sql`${LiveEvent.taste} ->> 'era' IS NULL`)
      : or(
          isNull(LiveEvent.taste),
          lt(
            sql`(${LiveEvent.taste} ->> 'taggedAt')::timestamptz`,
            STALE_TIMESTAMP_SQL,
          ),
        );

  const remaining = Math.max(0, maxRows - events.length);
  const liveRows =
    remaining === 0
      ? []
      : await database
          .select()
          .from(LiveEvent)
          .where(liveStalePredicate)
          .limit(remaining);

  const eventResult = await tagTable({
    rows: events,
    toInput: eventInputFor,
    persist: (id, taste) =>
      database.update(Event).set({ taste }).where(eq(Event.id, id)),
    apiKey: options.apiKey,
    concurrency,
    label: "Event",
  });

  const liveResult = await tagTable({
    rows: liveRows,
    toInput: liveInputFor,
    persist: (id, taste) =>
      database.update(LiveEvent).set({ taste }).where(eq(LiveEvent.id, id)),
    apiKey: options.apiKey,
    concurrency,
    label: "LiveEvent",
  });

  return {
    scanned: events.length + liveRows.length,
    tagged: eventResult.tagged + liveResult.tagged,
    failed: eventResult.failed + liveResult.failed,
    durationMs: Date.now() - started,
  };
}
