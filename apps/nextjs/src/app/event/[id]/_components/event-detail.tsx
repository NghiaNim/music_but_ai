"use client";

import Link from "next/link";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";

import type { RouterOutputs } from "@acme/api";
import { cn } from "@acme/ui";
import { Button } from "@acme/ui/button";
import { toast } from "@acme/ui/toast";

import { useTRPC } from "~/trpc/react";

const GENRE_LABELS: Record<string, string> = {
  orchestral: "Orchestral",
  opera: "Opera",
  chamber: "Chamber",
  solo_recital: "Solo Recital",
  choral: "Choral",
  ballet: "Ballet",
};

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  intermediate:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  advanced:
    "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400",
};

export function EventDetail({ eventId }: { eventId: string }) {
  const trpc = useTRPC();
  const { data: event } = useSuspenseQuery(
    trpc.event.byId.queryOptions({ id: eventId }),
  );

  if (!event) return null;

  const date = new Date(event.date);
  const formattedDate = date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const formattedTime = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="mx-auto max-w-lg">
      <div className="px-4 pt-4 pb-2">
        <Link
          href="/events"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <ArrowLeftIcon />
          Events
        </Link>
      </div>

      <div className="px-4 pb-4">
        <div className="mb-2 flex flex-wrap gap-1.5">
          <span className="bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-xs font-medium">
            {GENRE_LABELS[event.genre] ?? event.genre}
          </span>
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-xs font-medium",
              DIFFICULTY_COLORS[event.difficulty],
            )}
          >
            {event.difficulty === "beginner"
              ? "Beginner Friendly"
              : event.difficulty.charAt(0).toUpperCase() +
                event.difficulty.slice(1)}
          </span>
        </div>

        <h1 className="text-xl font-bold tracking-tight">{event.title}</h1>

        <div className="text-muted-foreground mt-3 flex flex-col gap-1.5 text-sm">
          <div className="flex items-center gap-2">
            <CalendarIcon />
            <span>
              {formattedDate} at {formattedTime}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <MapPinIcon />
            <span>{event.venue}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-2 px-4 pb-4">
        <EventActionButtons eventId={eventId} />
      </div>

      <div className="px-4 pb-4">
        <Button className="w-full" asChild>
          <Link href={`/chat?eventId=${eventId}&mode=learning`}>
            <ChatIcon />
            Ask AI About This Event
          </Link>
        </Button>
      </div>

      {event.beginnerNotes && (
        <div className="mx-4 mb-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
          <div className="mb-2 flex items-center gap-2">
            <LightbulbIcon />
            <h3 className="font-semibold">For Beginners</h3>
          </div>
          <p className="text-muted-foreground whitespace-pre-line text-sm leading-relaxed">
            {event.beginnerNotes}
          </p>
        </div>
      )}

      <section className="px-4 pb-4">
        <h2 className="mb-2 text-base font-semibold">Program</h2>
        <div className="bg-card rounded-xl border p-3">
          <p className="whitespace-pre-line text-sm">{event.program}</p>
        </div>
      </section>

      <section className="px-4 pb-4">
        <h2 className="mb-2 text-base font-semibold">About</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {event.description}
        </p>
      </section>

      {event.venueAddress && (
        <section className="px-4 pb-6">
          <h2 className="mb-2 text-base font-semibold">Venue</h2>
          <div className="bg-card rounded-xl border p-3">
            <p className="text-sm font-medium">{event.venue}</p>
            <p className="text-muted-foreground mt-0.5 text-xs">
              {event.venueAddress}
            </p>
          </div>
        </section>
      )}
    </div>
  );
}

function EventActionButtons({ eventId }: { eventId: string }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const toggleSave = useMutation(
    trpc.userEvent.toggle.mutationOptions({
      onSuccess: async (result) => {
        toast.success(
          result.action === "added" ? "Event saved!" : "Event removed",
        );
        await queryClient.invalidateQueries(trpc.userEvent.pathFilter());
      },
      onError: (err) => {
        toast.error(
          err.data?.code === "UNAUTHORIZED"
            ? "Sign in to save events"
            : "Something went wrong",
        );
      },
    }),
  );

  const toggleAttended = useMutation(
    trpc.userEvent.toggle.mutationOptions({
      onSuccess: async (result) => {
        toast.success(
          result.action === "added"
            ? "Marked as attended!"
            : "Removed attendance",
        );
        await queryClient.invalidateQueries(trpc.userEvent.pathFilter());
      },
      onError: (err) => {
        toast.error(
          err.data?.code === "UNAUTHORIZED"
            ? "Sign in to track events"
            : "Something went wrong",
        );
      },
    }),
  );

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="flex-1"
        onClick={() => toggleSave.mutate({ eventId, status: "saved" })}
        disabled={toggleSave.isPending}
      >
        <BookmarkIcon />
        Save
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="flex-1"
        onClick={() => toggleAttended.mutate({ eventId, status: "attended" })}
        disabled={toggleAttended.isPending}
      >
        <CheckCircleIcon />
        I Went
      </Button>
    </>
  );
}

function ArrowLeftIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 19-7-7 7-7" /><path d="M19 12H5" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 2v4" /><path d="M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" />
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
    </svg>
  );
}

function BookmarkIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function LightbulbIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
      <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
      <path d="M9 18h6" /><path d="M10 22h4" />
    </svg>
  );
}

export function EventDetailSkeleton() {
  return (
    <div className="mx-auto max-w-lg px-4 pt-4">
      <div className="bg-muted mb-4 h-4 w-16 animate-pulse rounded" />
      <div className="mb-2 flex gap-2">
        <div className="bg-muted h-5 w-20 animate-pulse rounded-full" />
        <div className="bg-muted h-5 w-24 animate-pulse rounded-full" />
      </div>
      <div className="bg-muted mb-4 h-7 w-3/4 animate-pulse rounded" />
      <div className="space-y-2">
        <div className="bg-muted h-4 w-48 animate-pulse rounded" />
        <div className="bg-muted h-4 w-36 animate-pulse rounded" />
      </div>
      <div className="mt-4 flex gap-2">
        <div className="bg-muted h-9 flex-1 animate-pulse rounded-md" />
        <div className="bg-muted h-9 flex-1 animate-pulse rounded-md" />
      </div>
      <div className="bg-muted mt-4 h-40 animate-pulse rounded-xl" />
    </div>
  );
}
