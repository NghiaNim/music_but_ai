import { NextResponse } from "next/server";

import { syncAllVenuesToLiveEvents } from "@acme/api";
import { db } from "@acme/db/client";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function authorizeCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

async function runSync() {
  const result = await syncAllVenuesToLiveEvents(db);
  return NextResponse.json(result);
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
