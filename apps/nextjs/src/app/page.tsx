import { Suspense } from "react";
import Link from "next/link";

import { Button } from "@acme/ui/button";

import { HydrateClient, prefetch, trpc } from "~/trpc/server";
import { EventFeedSkeleton, FeaturedEvents } from "./_components/event-feed";
import { Greeting, OnboardingModal } from "./_components/onboarding";

export default async function HomePage() {
  prefetch(trpc.event.all.queryOptions({}));

  return (
    <HydrateClient>
      <OnboardingModal />
      <div className="mx-auto max-w-lg">
        {/* Hero */}
        <section className="relative overflow-hidden px-5 pt-8 pb-6">
          <div
            className="pointer-events-none absolute inset-0 -z-10"
            style={{
              background:
                "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(156,23,56,0.10) 0%, transparent 70%)",
            }}
          />
          <Greeting />
          <h1 className="text-3xl font-extrabold tracking-tight">
            Discover <span className="text-primary">Classical Music</span>
          </h1>
          <p className="text-muted-foreground mt-2 max-w-[280px] text-sm leading-relaxed">
            Your personal guide to the world of live classical performance.
          </p>
        </section>

        {/* Quick Start Grid */}
        <section className="px-5 pb-6">
          <div className="grid grid-cols-2 gap-3">
            <Link href="/events?difficulty=beginner" className="group">
              <div className="relative overflow-hidden rounded-2xl border bg-linear-to-br from-emerald-50 to-white p-4 transition-all group-hover:border-emerald-300 group-hover:shadow-md dark:from-emerald-950/30 dark:to-card">
                <div className="bg-emerald-100 dark:bg-emerald-900/40 mb-3 flex size-10 items-center justify-center rounded-xl">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600 dark:text-emerald-400">
                    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                  </svg>
                </div>
                <p className="text-sm font-semibold">For Beginners</p>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  First concert? Start here
                </p>
              </div>
            </Link>

            <Link href="/learn" className="group">
              <div className="relative overflow-hidden rounded-2xl border bg-linear-to-br from-amber-50 to-white p-4 transition-all group-hover:border-amber-300 group-hover:shadow-md dark:from-amber-950/30 dark:to-card">
                <div className="bg-amber-100 dark:bg-amber-900/40 mb-3 flex size-10 items-center justify-center rounded-xl">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600 dark:text-amber-400">
                    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" />
                  </svg>
                </div>
                <p className="text-sm font-semibold">Learn</p>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  Classical music 101
                </p>
              </div>
            </Link>
          </div>
        </section>

        {/* Your Upcoming Events */}
        <section className="px-5 pb-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Your Upcoming Events</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/events" className="text-xs">
                See all
              </Link>
            </Button>
          </div>
          <Suspense fallback={<EventFeedSkeleton count={3} />}>
            <FeaturedEvents />
          </Suspense>
        </section>
      </div>
    </HydrateClient>
  );
}
