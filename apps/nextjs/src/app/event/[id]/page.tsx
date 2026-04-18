import { Suspense } from "react";

import { getSession } from "~/auth/server";
import { HydrateClient, prefetch, trpc } from "~/trpc/server";
import { EventDetail, EventDetailSkeleton } from "./_components/event-detail";

export default async function EventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await getSession();
  const isSignedIn = !!session;
  const viewerId = session?.user.id ?? null;

  prefetch(trpc.event.byId.queryOptions({ id }));

  return (
    <HydrateClient>
      <Suspense fallback={<EventDetailSkeleton />}>
        <EventDetail
          eventId={id}
          isSignedIn={isSignedIn}
          viewerId={viewerId}
        />
      </Suspense>
    </HydrateClient>
  );
}
