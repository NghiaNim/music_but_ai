import { Suspense } from "react";

import { HydrateClient, prefetch, trpc } from "~/trpc/server";
import { EventFeed, EventFeedSkeleton } from "../_components/event-feed";

export default function EventsPage() {
  prefetch(trpc.event.all.queryOptions({}));

  return (
    <HydrateClient>
      <div className="mx-auto max-w-lg px-4 py-6">
        <h1 className="mb-1 text-2xl font-bold tracking-tight">Events</h1>
        <p className="text-muted-foreground mb-4 text-sm">
          Find your next classical music experience
        </p>
        <Suspense fallback={<EventFeedSkeleton />}>
          <EventFeed />
        </Suspense>
      </div>
    </HydrateClient>
  );
}
