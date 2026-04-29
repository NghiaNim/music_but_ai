"use client";

import Image from "next/image";
import Link from "next/link";
import { useSuspenseQuery } from "@tanstack/react-query";

import { cn } from "@acme/ui";
import { Button } from "@acme/ui/button";

import {
  GENRE_LABELS,
  VENUE_CAMPUS_ADDRESS,
  VENUE_CAMPUS_DEFAULT_NAME,
  VENUE_SOURCE_FULL_NAMES,
} from "~/lib/event-display-labels";
import { formatLongDateAtTime } from "~/lib/format-event-date";
import { useTRPC } from "~/trpc/react";

function formatWhen(ev: {
  date: Date | null;
  dateText: string | null;
}): string {
  if (ev.date) {
    return formatLongDateAtTime(new Date(ev.date));
  }
  if (ev.dateText?.trim()) return ev.dateText.trim();
  return "Date to be announced";
}

function venueLine(ev: {
  source: string;
  venueName: string | null;
  location: string | null;
}): string {
  if (ev.source === "msm") {
    const hall = ev.venueName?.trim();
    const campus = VENUE_CAMPUS_ADDRESS.msm;
    const defaultName = VENUE_CAMPUS_DEFAULT_NAME.msm;
    if (hall && hall !== defaultName) {
      return `${hall} · ${campus}`;
    }
    return campus;
  }
  if (ev.source === "juilliard") {
    const hall = ev.venueName?.trim();
    const campus = VENUE_CAMPUS_ADDRESS.juilliard;
    const defaultName = VENUE_CAMPUS_DEFAULT_NAME.juilliard;
    if (hall && hall !== defaultName) {
      return `${hall} · ${campus}`;
    }
    return campus;
  }
  const v = ev.venueName?.trim();
  const loc = ev.location?.trim();
  if (v && loc) return `${v} · ${loc}`;
  return v ?? loc ?? "Venue TBA";
}

function directionsUrl(ev: {
  source: string;
  venueName: string | null;
  location: string | null;
}): string {
  const destination =
    ev.source === "msm"
      ? VENUE_CAMPUS_ADDRESS.msm
      : ev.source === "juilliard"
        ? VENUE_CAMPUS_ADDRESS.juilliard
        : [ev.venueName?.trim(), ev.location?.trim()]
            .filter(Boolean)
            .join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    destination || "New York, NY",
  )}`;
}

export function LiveEventDetail({
  liveEventId,
  isSignedIn,
}: {
  liveEventId: string;
  isSignedIn: boolean;
}) {
  const trpc = useTRPC();
  const { data: event } = useSuspenseQuery(
    trpc.liveEvent.byId.queryOptions({ id: liveEventId }),
  );

  const sourceLabel = VENUE_SOURCE_FULL_NAMES[event.source] ?? event.source;
  const chatPrefill = `I'm interested in "${event.title}" — what should I know before I go?`;
  const chatHref = `/chat?mode=discovery&q=${encodeURIComponent(chatPrefill)}`;
  const mapHref = directionsUrl({
    source: event.source,
    venueName: event.venueName,
    location: event.location,
  });

  return (
    <div className="relative mx-auto max-w-lg">
      {!isSignedIn && (
        <div className="bg-background/80 absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 px-4 py-6 backdrop-blur-md">
          <p className="text-center text-sm font-medium">
            Sign in to view event details and ask Tanny
          </p>
          <Button asChild size="lg">
            <Link
              href={`/sign-in?callbackUrl=${encodeURIComponent(
                `/live-event/${liveEventId}`,
              )}`}
            >
              Sign in
            </Link>
          </Button>
        </div>
      )}
      <div
        className={cn(!isSignedIn && "pointer-events-none blur-sm select-none")}
      >
        <div className="px-4 pt-4 pb-2">
          <Link
            href="/events"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
          >
            <ArrowLeftIcon />
            Events
          </Link>
        </div>

        <div className="relative mx-4 mb-4 aspect-video overflow-hidden rounded-xl">
          {event.imageUrl ? (
            <Image
              src={event.imageUrl}
              alt={event.title}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="flex aspect-video w-full items-center justify-center bg-linear-to-br from-orange-200 to-amber-100 dark:from-orange-900/50 dark:to-amber-800/30">
              <EventMusicNoteIcon />
            </div>
          )}
        </div>

        <div className="px-4 pb-4">
          <div className="mb-2 flex flex-wrap gap-1.5">
            <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-medium text-sky-800 dark:bg-sky-900/40 dark:text-sky-200">
              {sourceLabel}
            </span>
            <span className="bg-muted text-foreground rounded-full px-2.5 py-0.5 text-xs font-medium">
              Concert
            </span>
            <span className="bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-xs font-medium">
              {GENRE_LABELS[event.genre] ?? event.genre}
            </span>
          </div>

          <h1 className="text-xl font-bold tracking-tight">{event.title}</h1>

          <div className="text-muted-foreground mt-3 flex flex-col gap-1.5 text-sm">
            <div className="flex items-center gap-2">
              <CalendarIcon />
              <span>{formatWhen(event)}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPinIcon />
              <a
                href={mapHref}
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-2"
              >
                {venueLine(event)}
              </a>
            </div>
          </div>
        </div>

        <div className="mx-4 mb-4 rounded-xl border bg-gradient-to-r from-emerald-50 to-teal-50 p-4 dark:from-emerald-950/30 dark:to-teal-950/30">
          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
            Tickets & details
          </p>
          <p className="text-muted-foreground mt-1 text-xs">
            Availability and pricing are handled on the venue&apos;s website.
          </p>
          <Button className="mt-3 w-full" size="lg" asChild>
            <a
              href={event.buyUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2"
            >
              <TicketIcon />
              View on venue site
            </a>
          </Button>
        </div>

        <div className="px-4 pb-4">
          <Button className="w-full" asChild>
            <Link
              href={chatHref}
              className="inline-flex items-center justify-center gap-2"
            >
              <ChatIcon />
              Ask Tanny About This Event
            </Link>
          </Button>
        </div>

        <section className="px-4 pb-4">
          <h2 className="mb-2 text-base font-semibold">Program</h2>
          <div className="bg-card rounded-xl border p-3">
            {event.program ? (
              <p className="text-foreground text-sm leading-relaxed whitespace-pre-line">
                {event.program}
              </p>
            ) : (
              <p className="text-muted-foreground text-sm leading-relaxed">
                Full program information is published by the venue. Open the
                official listing for repertoire, performers, and any updates.
              </p>
            )}
            <Button variant="outline" size="sm" className="mt-3" asChild>
              <a href={event.eventUrl} target="_blank" rel="noreferrer">
                Official event page
              </a>
            </Button>
          </div>
        </section>

        <section className="px-4 pb-6">
          <h2 className="mb-2 text-base font-semibold">About</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            This performance is included in Classica from public venue
            calendars. For accessibility, parking, and box office hours, refer
            to {sourceLabel}.
          </p>
        </section>
      </div>
    </div>
  );
}

function ArrowLeftIcon() {
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
      className="size-3.5 shrink-0"
    >
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-3.5 shrink-0"
    >
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" />
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-3.5 shrink-0"
    >
      <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function ChatIcon() {
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
      className="size-4 shrink-0"
    >
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
    </svg>
  );
}

function TicketIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-[18px] shrink-0"
    >
      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
      <path d="M13 5v2" />
      <path d="M13 17v2" />
      <path d="M13 11v2" />
    </svg>
  );
}

function EventMusicNoteIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="48"
      height="48"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-orange-400 dark:text-orange-300"
    >
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
}
