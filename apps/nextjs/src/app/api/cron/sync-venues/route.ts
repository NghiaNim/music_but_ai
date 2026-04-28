import { after, NextResponse } from "next/server";

import { syncAllVenuesToLiveEvents, tagUntaggedCatalog } from "@acme/api";
import { db } from "@acme/db/client";

import { env } from "~/env";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function authorizeCron(request: Request): boolean {
  const secret = env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

function venuePayload(
  result: Awaited<ReturnType<typeof syncAllVenuesToLiveEvents>>,
) {
  const sourceHealth = result.results.reduce<
    Record<
      string,
      {
        status: string;
        upserted: number;
        removed: number;
        skipped: boolean;
        error: string | null;
        durationMs: number;
      }
    >
  >((acc, row) => {
    acc[row.source] = {
      status: row.status,
      upserted: row.upserted,
      removed: row.removed,
      skipped: row.status === "skipped",
      error: row.error ?? null,
      durationMs: row.durationMs,
    };
    return acc;
  }, {});

  return {
    ...result,
    sourceHealth,
  };
}

function logVenueSyncComplete(
  result: Awaited<ReturnType<typeof syncAllVenuesToLiveEvents>>,
) {
  const line = JSON.stringify({
    type: "venue-sync-complete",
    at: new Date().toISOString(),
    allSucceeded: result.allSucceeded,
    summary: result.summary,
    totals: {
      upserted: result.totalUpserted,
      removed: result.totalRemoved,
    },
  });
  console.log(line);
  if (!result.allSucceeded) {
    console.error(
      "venue-sync: one or more venues failed",
      result.summary.failures,
    );
  }
}

async function runSyncAndRespond() {
  const result = await syncAllVenuesToLiveEvents(db);
  logVenueSyncComplete(result);
  // Tag any newly-upserted rows. Best-effort, non-blocking: we still
  // return the venue sync payload immediately and let tagging run in
  // the background.
  after(() => tagUntaggedCatalog(db));
  return NextResponse.json(venuePayload(result));
}

export async function GET(request: Request) {
  if (!authorizeCron(request)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const asyncMode =
    new URL(request.url).searchParams.get("async") === "1" ||
    new URL(request.url).searchParams.get("background") === "1";

  if (asyncMode) {
    after(async () => {
      try {
        const result = await syncAllVenuesToLiveEvents(db);
        logVenueSyncComplete(result);
        await tagUntaggedCatalog(db);
      } catch (err) {
        console.error(
          JSON.stringify({
            type: "venue-sync-error",
            at: new Date().toISOString(),
            error: err instanceof Error ? err.message : String(err),
          }),
        );
      }
    });

    return NextResponse.json(
      {
        accepted: true,
        async: true,
        message:
          "Venue sync started in the background. Scrapers still run in parallel; this only returns before they finish. Check hosting logs for venue-sync-complete JSON.",
        summary: null,
        hint: "Omit ?async=1 to wait for the full JSON body (needs HTTP client timeout ≥ server maxDuration).",
      },
      { status: 202 },
    );
  }

  try {
    return await runSyncAndRespond();
  } catch (err) {
    console.error("sync-venues cron failed", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Sync failed" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  return GET(request);
}
