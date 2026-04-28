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
      <div className="relative w-full overflow-x-hidden bg-gradient-to-b from-white via-amber-50/40 to-[#fcf8ec]">
        {/* Mesh-style soft blobs — full tab background (warm yellow) */}
        <div
          className="pointer-events-none absolute top-[-8%] -right-[15%] h-[42vmin] max-h-80 min-h-[12rem] w-[42vmin] max-w-[20rem] min-w-[12rem] rounded-full bg-amber-300/28 blur-[3rem]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute top-[18%] -left-[20%] h-[38vmin] max-h-72 min-h-[11rem] w-[38vmin] max-w-[18rem] min-w-[11rem] rounded-full bg-yellow-200/40 blur-[3rem]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute right-[5%] bottom-[5%] h-[34vmin] max-h-64 min-h-[10rem] w-[34vmin] max-w-[16rem] min-w-[10rem] rounded-full bg-amber-100/55 blur-[2.75rem]"
          aria-hidden
        />

        <div className="relative z-10 mx-auto max-w-lg px-4 py-8 pb-16 sm:px-5 sm:py-10 sm:pb-16">
          <header className="relative mb-8 sm:mb-10">
            <p className="text-primary mb-2 text-[11px] font-semibold tracking-[0.14em] uppercase sm:text-xs">
              Share with Classica
            </p>
            <h1 className="text-foreground mb-3 text-3xl font-bold tracking-tight text-balance sm:text-[2rem]">
              Post an event
            </h1>
            <p className="text-muted-foreground max-w-[32ch] text-base leading-relaxed">
              Add the who, when, and where in a few taps — we keep the form
              light and friendly.
            </p>
          </header>
          {isSignedIn ? (
            <Suspense fallback={<MyHostedEventsSkeleton />}>
              <MyHostedEvents />
            </Suspense>
          ) : null}
          <PostEventForm isSignedIn={isSignedIn} />
        </div>
      </div>
    </HydrateClient>
  );
}
