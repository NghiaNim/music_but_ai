import { Suspense } from "react";

import { getSession } from "~/auth/server";
import { HydrateClient, prefetch, trpc } from "~/trpc/server";
import { EventDetail, EventDetailSkeleton } from "./_components/event-detail";

export default async function EventPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ preview?: string }>;
}) {
  const { id } = await params;
  const { preview } = await searchParams;

  const session = await getSession();
  const isSignedIn = !!session;
  const viewerId = session?.user.id ?? null;
  const previewAsAttendee = preview === "1";

  prefetch(trpc.event.byId.queryOptions({ id }));

  return (
    <HydrateClient>
      <Suspense fallback={<EventDetailSkeleton />}>
        <EventDetail
          eventId={id}
          isSignedIn={isSignedIn}
          viewerId={viewerId}
          previewAsAttendee={previewAsAttendee}
        />
      </Suspense>
    </HydrateClient>
  );
}
