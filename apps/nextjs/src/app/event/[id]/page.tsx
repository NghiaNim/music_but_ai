import { Suspense } from "react";

import { HydrateClient, prefetch, trpc } from "~/trpc/server";
import { EventDetail, EventDetailSkeleton } from "./_components/event-detail";

export default async function EventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  prefetch(trpc.event.byId.queryOptions({ id }));

  return (
    <HydrateClient>
      <Suspense fallback={<EventDetailSkeleton />}>
        <EventDetail eventId={id} />
      </Suspense>
    </HydrateClient>
  );
}
