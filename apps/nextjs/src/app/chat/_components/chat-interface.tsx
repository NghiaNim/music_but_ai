"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";

import { cn } from "@acme/ui";
import { Button } from "@acme/ui/button";
import { Input } from "@acme/ui/input";
import { toast } from "@acme/ui/toast";

import { useTRPC } from "~/trpc/react";

const BUY_TICKET_REGEX = /\[BUY_TICKET:([a-f0-9-]+)\]/g;

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function ChatInterface() {
  const searchParams = useSearchParams();
  const eventId = searchParams.get("eventId") ?? undefined;
  const initialMode =
    searchParams.get("mode") === "learning" ? "learning" : "discovery";

  const initialQuery = searchParams.get("q") ?? "";

  const [mode, setMode] = useState<"discovery" | "learning">(initialMode);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState(initialQuery);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const trpc = useTRPC();

  const sendMessage = useMutation(
    trpc.chat.send.mutationOptions({
      onSuccess: (data) => {
        if (data.sessionId) setSessionId(data.sessionId);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.response },
        ]);
      },
      onError: (err) => {
        console.error("[chat.send] Error:", err.data?.code, err.message);
        toast.error(err.message || "Something went wrong");
        setMessages((prev) => prev.slice(0, -1));
      },
    }),
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const content = inputValue.trim();
    if (!content || sendMessage.isPending) return;

    const newMessages: Message[] = [...messages, { role: "user", content }];
    setMessages(newMessages);
    setInputValue("");

    sendMessage.mutate({
      sessionId,
      eventId,
      mode,
      content,
      history: messages,
    });
  };

  return (
    <div className="flex h-full flex-col">
      <header className="border-b px-4 py-3">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">AI Mentor</h1>
            <p className="text-muted-foreground text-xs">
              {mode === "discovery"
                ? "Help me find a concert"
                : "Help me understand this event"}
            </p>
          </div>
          {!eventId && (
            <div className="flex gap-1 rounded-lg border p-1">
              <button
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  mode === "discovery"
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted",
                )}
                onClick={() => setMode("discovery")}
              >
                Discover
              </button>
              <button
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  mode === "learning"
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted",
                )}
                onClick={() => setMode("learning")}
              >
                Learn
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-lg px-4 py-6">
          {messages.length === 0 && (
            <EmptyState
              mode={mode}
              onSuggestionClick={(s) => setInputValue(s)}
            />
          )}
          <div className="flex flex-col gap-4">
            {messages.map((msg, i) => (
              <ChatBubble key={i} message={msg} />
            ))}
            {sendMessage.isPending && <TypingIndicator />}
          </div>
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="border-t px-4 pt-3 pb-2">
        <form onSubmit={handleSubmit} className="mx-auto flex max-w-lg gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={
              mode === "discovery"
                ? "What kind of concert are you looking for?"
                : "What would you like to know about this event?"
            }
            disabled={sendMessage.isPending}
            className="flex-1"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!inputValue.trim() || sendMessage.isPending}
          >
            <SendIcon />
          </Button>
        </form>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="bg-primary/10 flex size-8 shrink-0 items-center justify-center rounded-full">
        <MusicIcon />
      </div>
      <div className="bg-muted max-w-[80%] rounded-2xl rounded-tl-sm px-4 py-3">
        <div className="flex gap-1">
          <span className="bg-foreground/20 size-2 animate-bounce rounded-full" />
          <span className="bg-foreground/20 size-2 animate-bounce rounded-full [animation-delay:150ms]" />
          <span className="bg-foreground/20 size-2 animate-bounce rounded-full [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}

function ChatBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  const trpc = useTRPC();
  const [pendingRedirect, setPendingRedirect] = useState<string | null>(null);

  useEffect(() => {
    if (pendingRedirect) {
      window.location.href = pendingRedirect;
    }
  }, [pendingRedirect]);

  const checkout = useMutation(
    trpc.ticket.createCheckoutSession.mutationOptions({
      onSuccess: (data) => {
        if (data.checkoutUrl) {
          setPendingRedirect(data.checkoutUrl);
        }
      },
      onError: (err) => {
        if (err.data?.code === "UNAUTHORIZED") {
          toast.error("Please sign in to purchase tickets");
          return;
        }
        toast.error(err.message || "Failed to start checkout");
      },
    }),
  );

  const buyMatch = /\[BUY_TICKET:([a-f0-9-]+)\]/.exec(message.content);
  const eventId = buyMatch?.[1];
  const textContent = message.content.replace(BUY_TICKET_REGEX, "").trim();

  return (
    <div className={cn("flex gap-3", isUser && "flex-row-reverse")}>
      {!isUser && (
        <div className="bg-primary/10 flex size-8 shrink-0 items-center justify-center rounded-full">
          <MusicIcon />
        </div>
      )}
      <div className="max-w-[80%] space-y-2">
        <div
          className={cn(
            "rounded-2xl px-4 py-3",
            isUser
              ? "bg-primary text-primary-foreground rounded-tr-sm"
              : "bg-muted rounded-tl-sm",
          )}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {textContent}
          </p>
        </div>
        {eventId && !isUser && (
          <button
            onClick={() => checkout.mutate({ eventId, quantity: 1 })}
            disabled={checkout.isPending}
            className="flex w-full items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-left transition-colors hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/30 dark:hover:bg-emerald-900/40"
          >
            <span className="flex size-8 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50">
              <TicketIcon />
            </span>
            <div className="flex-1">
              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                {checkout.isPending ? "Opening checkout..." : "Buy Tickets Now"}
              </span>
              <span className="block text-xs text-emerald-600/70 dark:text-emerald-400/70">
                Exclusive discounted price through us
              </span>
            </div>
            <ArrowRightIcon />
          </button>
        )}
      </div>
    </div>
  );
}

function EmptyState({
  mode,
  onSuggestionClick,
}: {
  mode: "discovery" | "learning";
  onSuggestionClick: (suggestion: string) => void;
}) {
  const discoverySuggestions = [
    "I've never been to a classical concert. What's good for a beginner?",
    "I'm looking for something fun to do this weekend",
    "What opera would you recommend for a first-timer?",
    "I love dramatic, powerful music. What should I see?",
  ];

  const learningSuggestions = [
    "What should I listen for during the performance?",
    "Tell me about the composer",
    "What's the dress code? Any etiquette tips?",
    "Why is this piece considered a masterwork?",
  ];

  const suggestions =
    mode === "discovery" ? discoverySuggestions : learningSuggestions;

  return (
    <div className="flex flex-col items-center gap-6 py-8 text-center">
      <div className="bg-primary/10 flex size-16 items-center justify-center rounded-full">
        <MusicIcon size={32} />
      </div>
      <div>
        <h2 className="text-xl font-semibold">
          {mode === "discovery"
            ? "What are you in the mood for?"
            : "What would you like to learn?"}
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          {mode === "discovery"
            ? "I can help you find the perfect concert based on your interests."
            : "Ask me anything about the event, the music, or the composers."}
        </p>
      </div>
      <div className="grid w-full gap-2">
        {suggestions.map((s) => (
          <button
            key={s}
            onClick={() => onSuggestionClick(s)}
            className="bg-muted/50 hover:bg-muted rounded-lg border px-4 py-3 text-left text-sm transition-colors"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

function MusicIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-primary"
    >
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
}

function TicketIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-emerald-600 dark:text-emerald-400"
    >
      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
      <path d="M13 5v2" />
      <path d="M13 17v2" />
      <path d="M13 11v2" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-emerald-600 dark:text-emerald-400"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z" />
      <path d="m21.854 2.147-10.94 10.939" />
    </svg>
  );
}
