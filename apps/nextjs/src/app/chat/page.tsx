import { Suspense } from "react";

import { HydrateClient, prefetch, trpc } from "~/trpc/server";
import { ChatInterface } from "./_components/chat-interface";

export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ eventId?: string }>;
}) {
  const { eventId } = await searchParams;
  if (eventId) {
    prefetch(trpc.event.byId.queryOptions({ id: eventId }));
  }

  return (
    <HydrateClient>
      <div className="flex h-full flex-col">
        <Suspense>
          <ChatInterface />
        </Suspense>
      </div>
    </HydrateClient>
  );
}
