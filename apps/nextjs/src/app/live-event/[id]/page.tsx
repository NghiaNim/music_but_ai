import { Suspense } from "react";

import { getSession } from "~/auth/server";
import { HydrateClient, prefetch, trpc } from "~/trpc/server";
import { EventDetailSkeleton } from "../../event/[id]/_components/event-detail";
import { LiveEventDetail } from "./_components/live-event-detail";

export default async function LiveEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  const isSignedIn = !!session;

  prefetch(trpc.liveEvent.byId.queryOptions({ id }));

  return (
    <HydrateClient>
      <Suspense fallback={<EventDetailSkeleton />}>
        <LiveEventDetail liveEventId={id} isSignedIn={isSignedIn} />
      </Suspense>
    </HydrateClient>
  );
}
