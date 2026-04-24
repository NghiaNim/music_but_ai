"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";

import { cn } from "@acme/ui";
import { Button } from "@acme/ui/button";
import { toast } from "@acme/ui/toast";

import { useTRPC } from "~/trpc/react";

const BUY_TICKET_REGEX = /\[BUY_TICKET:([a-f0-9-]+)\]/g;

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function ChatInterface() {
  const router = useRouter();
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
  const composerRef = useRef<HTMLTextAreaElement>(null);

  const trpc = useTRPC();

  const { data: contextEvent } = useQuery({
    ...trpc.event.byId.queryOptions({ id: eventId ?? "" }),
    enabled: !!eventId,
  });

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

  useEffect(() => {
    const el = composerRef.current;
    if (!el) return;
    el.style.height = "0px";
    const next = Math.min(el.scrollHeight, 160);
    el.style.height = `${next}px`;
  }, [inputValue]);

  const announcedRef = useRef(false);
  useEffect(() => {
    if (contextEvent && !announcedRef.current) {
      announcedRef.current = true;
      toast.success(`Now chatting about "${contextEvent.title}"`);
    }
  }, [contextEvent]);

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
          <div className="flex items-center gap-2">
            <Image
              src="/tanny.png"
              alt="Tanny"
              width={32}
              height={32}
              className="rounded-full"
            />
            <div className="min-w-0">
              <h1 className="text-lg font-semibold">Ask Tanny</h1>
              <p className="text-muted-foreground truncate text-xs">
                {mode === "discovery"
                  ? "Help me find a concert"
                  : contextEvent
                    ? `About: ${contextEvent.title}`
                    : "Help me understand this event"}
              </p>
            </div>
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

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-lg px-4 pt-3 pb-3">
          <button
            onClick={() => router.back()}
            className="text-muted-foreground hover:text-foreground mb-3 inline-flex items-center gap-1 text-sm font-medium transition-colors"
            aria-label="Back"
          >
            <BackIcon />
            Back
          </button>
          {contextEvent ? (
            <EventContextBanner
              eventId={contextEvent.id}
              title={contextEvent.title}
              date={contextEvent.date}
              venue={contextEvent.venue}
            />
          ) : null}
          {messages.length === 0 && (
            <EmptyState
              mode={mode}
              eventTitle={contextEvent?.title}
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

      <div className="sticky bottom-0 z-20 shrink-0 px-4 pt-2 pb-[env(safe-area-inset-bottom)]">
        <form
          onSubmit={handleSubmit}
          className="mx-auto flex max-w-lg items-end gap-2 rounded-xl border bg-[#ffffffff] px-2 py-2 dark:bg-[#ffffffff]"
        >
          <textarea
            ref={composerRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (!sendMessage.isPending && inputValue.trim()) {
                  const form = e.currentTarget.form;
                  form?.requestSubmit();
                }
              }
            }}
            placeholder={
              mode === "discovery"
                ? "What kind of concert are you looking for?"
                : "What would you like to know about this event?"
            }
            disabled={sendMessage.isPending}
            rows={1}
            className="ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring max-h-40 min-h-10 flex-1 resize-none overflow-y-auto rounded-md bg-[#ffffffff] px-3 py-2 text-sm leading-5 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          />
          <Button
            type="submit"
            size="icon"
            className="shrink-0"
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
      <div className="max-w-[80%] rounded-2xl rounded-tl-sm border bg-white px-4 py-3 dark:bg-white">
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
              : "rounded-tl-sm border bg-white dark:bg-white",
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

function EventContextBanner({
  eventId,
  title,
  date,
  venue,
}: {
  eventId: string;
  title: string;
  date: Date | string;
  venue: string;
}) {
  const when = new Date(date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  return (
    <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/40 dark:bg-amber-950/30">
      <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-amber-200 text-amber-900 dark:bg-amber-900/50 dark:text-amber-200">
        <MusicIcon size={14} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-amber-900 dark:text-amber-200">
          Talking about
        </p>
        <p className="truncate text-sm font-medium">{title}</p>
        <p className="text-muted-foreground truncate text-xs">
          {when} · {venue}
        </p>
      </div>
      <Link
        href={`/event/${eventId}`}
        className="shrink-0 text-xs font-medium text-amber-800 underline-offset-2 hover:underline dark:text-amber-200"
      >
        View
      </Link>
    </div>
  );
}

function EmptyState({
  mode,
  eventTitle,
  onSuggestionClick,
}: {
  mode: "discovery" | "learning";
  eventTitle?: string;
  onSuggestionClick: (suggestion: string) => void;
}) {
  const discoverySuggestions = [
    "I've never been to a classical or jazz concert. What's good for a beginner?",
    "I'm looking for something fun to do this weekend",
    "What opera would you recommend for a first-timer?",
    "I love dramatic, powerful music. What should I see?",
  ];

  const learningSuggestionsForEvent = eventTitle
    ? [
        `What should I listen for during "${eventTitle}"?`,
        `Tell me about the composer(s) on this program`,
        `What's the dress code and etiquette for this concert?`,
        `Why is this program special?`,
      ]
    : [
        "What should I listen for during the performance?",
        "Tell me about the composer",
        "What's the dress code? Any etiquette tips?",
        "Why is this piece considered a masterwork?",
      ];

  const suggestions =
    mode === "discovery" ? discoverySuggestions : learningSuggestionsForEvent;

  return (
    <div className="flex flex-col items-center gap-6 py-8 text-center">
      <div className="bg-primary/10 flex size-16 items-center justify-center rounded-full">
        <MusicIcon size={32} />
      </div>
      <div>
        <h2 className="text-xl font-semibold">
          {mode === "discovery"
            ? "What are you in the mood for?"
            : eventTitle
              ? `Ask me about "${eventTitle}"`
              : "What would you like to learn?"}
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          {mode === "discovery"
            ? "I can help you find the perfect concert based on your interests."
            : eventTitle
              ? "I have the program and event details loaded — ask anything."
              : "Ask me anything about the event, the music, or the composers."}
        </p>
      </div>
      <div className="grid w-full gap-2">
        {suggestions.map((s) => (
          <button
            key={s}
            onClick={() => onSuggestionClick(s)}
            className="rounded-lg border bg-[#ffffffff] px-4 py-3 text-left text-sm transition-colors hover:bg-zinc-50 dark:bg-[#ffffffff] dark:hover:bg-zinc-100"
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

function BackIcon() {
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
      <path d="m15 18-6-6 6-6" />
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
