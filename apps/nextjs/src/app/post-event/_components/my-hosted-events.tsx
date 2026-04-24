"use client";

import Link from "next/link";
import { useSuspenseQuery } from "@tanstack/react-query";

import { Button } from "@acme/ui/button";

import { useTRPC } from "~/trpc/react";

export function MyHostedEvents() {
  const trpc = useTRPC();
  const { data: hosted } = useSuspenseQuery(trpc.event.myHosted.queryOptions());

  if (hosted.length === 0) {
    return (
      <div className="bg-muted/40 mb-6 rounded-xl border px-4 py-3 text-sm">
        You have not posted any events yet. Use the form below to create one.
      </div>
    );
  }

  return (
    <section className="mb-8">
      <h2 className="mb-2 text-base font-semibold">Your hosted events</h2>
      <ul className="flex flex-col gap-2">
        {hosted.map((ev) => (
          <li
            key={ev.id}
            className="bg-card flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{ev.title}</p>
              <p className="text-muted-foreground text-xs">
                {new Date(ev.date).toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
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
    <div className="bg-muted/40 mb-6 h-20 animate-pulse rounded-xl border" />
  );
}
