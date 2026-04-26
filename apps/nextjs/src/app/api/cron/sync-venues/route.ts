import { NextResponse } from "next/server";

import { syncAllVenuesToLiveEvents } from "@acme/api";
import { db } from "@acme/db/client";

import { env } from "~/env";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function authorizeCron(request: Request): boolean {
  const secret = env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

async function runSync() {
  const result = await syncAllVenuesToLiveEvents(db);
  const sourceHealth = result.results.reduce<
    Record<string, { upserted: number; removed: number; skipped: boolean; error: string | null }>
  >((acc, row) => {
    acc[row.source] = {
      upserted: row.upserted,
      removed: row.removed,
      skipped: !!row.skipped,
      error: row.error ?? null,
    };
    return acc;
  }, {});

  return NextResponse.json({
    ...result,
    sourceHealth,
  });
}

export async function GET(request: Request) {
  if (!authorizeCron(request)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  try {
    return await runSync();
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
