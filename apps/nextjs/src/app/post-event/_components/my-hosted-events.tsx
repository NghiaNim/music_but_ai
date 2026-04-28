"use client";

import Link from "next/link";
import { useSuspenseQuery } from "@tanstack/react-query";

import { Button } from "@acme/ui/button";

import { formatMediumDateTimeLocal } from "~/lib/format-event-date";
import { useTRPC } from "~/trpc/react";

export function MyHostedEvents() {
  const trpc = useTRPC();
  const { data: hosted } = useSuspenseQuery(trpc.event.myHosted.queryOptions());

  if (hosted.length === 0) {
    return null;
  }

  return (
    <section className="mb-8">
      <h2 className="text-foreground/90 mb-3 text-base font-semibold tracking-tight">
        Your hosted events
      </h2>
      <ul className="flex flex-col gap-2">
        {hosted.map((ev) => (
          <li
            key={ev.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[#EFE9F4] bg-[#ffffff] px-3 py-3 shadow-sm"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{ev.title}</p>
              <p className="text-muted-foreground text-xs">
                {formatMediumDateTimeLocal(new Date(ev.date))}
                {ev.publicationStatus === "cancelled" ? " · Cancelled" : ""}
              </p>
            </div>
            {ev.publicationStatus === "active" ? (
              <Button size="sm" variant="outline" asChild>
                <Link href={`/post-event/${ev.id}/edit`}>Edit</Link>
              </Button>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function MyHostedEventsSkeleton() {
  return (
    <div className="mb-6 h-14 animate-pulse rounded-2xl bg-[#EFE9F4]/60" />
  );
}
