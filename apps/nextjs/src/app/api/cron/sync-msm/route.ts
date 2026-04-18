import { NextResponse } from "next/server";

import { syncMsmPerformancesToLiveEvents } from "@acme/api";
import { db } from "@acme/db/client";

function authorizeCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!authorizeCron(request)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const result = await syncMsmPerformancesToLiveEvents(db);
    return NextResponse.json(result);
  } catch (err) {
    console.error("sync-msm cron failed", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Sync failed" },
      { status: 500 },
    );
  }
}
