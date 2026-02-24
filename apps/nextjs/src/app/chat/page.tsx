import { HydrateClient } from "~/trpc/server";
import { ChatInterface } from "./_components/chat-interface";

export default function ChatPage() {
  return (
    <HydrateClient>
      <div className="fixed inset-0 top-12 bottom-16 flex flex-col">
        <ChatInterface />
      </div>
    </HydrateClient>
  );
}
