import { Suspense } from "react";

import { HydrateClient } from "~/trpc/server";
import { ChatInterface } from "./_components/chat-interface";

export default function ChatPage() {
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
