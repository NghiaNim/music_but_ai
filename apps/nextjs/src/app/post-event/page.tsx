import { Suspense } from "react";

import { getSession } from "~/auth/server";
import { HydrateClient, prefetch, trpc } from "~/trpc/server";
import {
  MyHostedEvents,
  MyHostedEventsSkeleton,
} from "./_components/my-hosted-events";
import { PostEventForm } from "./_components/post-event-form";

export default async function PostEventPage() {
  const session = await getSession();
  const isSignedIn = !!session;

  if (isSignedIn) {
    prefetch(trpc.event.myHosted.queryOptions());
  }

  return (
    <HydrateClient>
      <div className="mx-auto max-w-lg px-4 py-5 pb-28 sm:px-5 sm:py-6 sm:pb-28">
        <header className="relative mb-6 overflow-hidden rounded-2xl border border-[#EFE9F4] bg-[#ffffff] px-4 py-5 shadow-sm sm:mb-8 sm:px-5 sm:py-6">
          <div
            className="bg-primary/[0.07] pointer-events-none absolute -top-6 -right-6 size-28 rounded-full blur-2xl sm:size-36"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-4 -left-4 size-20 rounded-full bg-rose-100/80 blur-xl sm:size-24"
            aria-hidden
          />
          <div className="relative">
            <p className="text-primary mb-1.5 text-[11px] font-semibold tracking-[0.12em] uppercase sm:text-xs">
              Share with Classica
            </p>
            <h1 className="text-foreground mb-2 text-2xl font-bold tracking-tight text-balance sm:text-[1.65rem]">
              Post an event
            </h1>
            <p className="text-muted-foreground max-w-[30ch] text-sm leading-relaxed">
              Add the who, when, and where in a few taps — we keep the form
              light and friendly.
            </p>
          </div>
        </header>
        {isSignedIn ? (
          <Suspense fallback={<MyHostedEventsSkeleton />}>
            <MyHostedEvents />
          </Suspense>
        ) : null}
        <PostEventForm isSignedIn={isSignedIn} />
      </div>
    </HydrateClient>
  );
}
