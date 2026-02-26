import { Suspense } from "react";
import Link from "next/link";

import { Button } from "@acme/ui/button";

import { getSession } from "~/auth/server";
import { HydrateClient, prefetch, trpc } from "~/trpc/server";
import { EventFeedSkeleton, FeaturedEvents } from "./_components/event-feed";
import { Greeting, OnboardingModal } from "./_components/onboarding";
import { OnboardingCTA } from "./_components/onboarding-cta";

export default async function HomePage() {
  prefetch(trpc.event.all.queryOptions({}));
  const session = await getSession();

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

        <section className="px-5 pb-4">
          <OnboardingCTA isSignedIn={!!session} />
        </section>

        {/* AI Music Mentor */}
        <section className="px-5 pb-6">
          <Link href="/chat" className="block">
            <div className="bg-primary/5 border-primary/20 flex items-center gap-4 rounded-xl border p-4">
              <div className="bg-primary/10 flex size-12 shrink-0 items-center justify-center rounded-full">
                <SparklesIcon />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">AI Music Mentor</p>
                <p className="text-muted-foreground text-xs">
                  Get personalized concert recommendations
                </p>
              </div>
              <ChevronRightIcon />
            </div>
          </Link>
        </section>

        {/* Quick Start Grid */}
        <section className="px-5 pb-6">
          <div className="grid grid-cols-2 gap-3">
            <Link href="/events?difficulty=beginner" className="group">
              <div className="dark:to-card relative overflow-hidden rounded-2xl border bg-linear-to-br from-emerald-50 to-white p-4 transition-all group-hover:border-emerald-300 group-hover:shadow-md dark:from-emerald-950/30">
                <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/40">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-emerald-600 dark:text-emerald-400"
                  >
                    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                  </svg>
                </div>
                <p className="text-sm font-semibold">For Beginners</p>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  First concert? Start here
                </p>
              </div>
            </Link>

            <Link href="/chat?mode=discovery" className="group">
              <div className="dark:to-card relative overflow-hidden rounded-2xl border bg-linear-to-br from-violet-50 to-white p-4 transition-all group-hover:border-violet-300 group-hover:shadow-md dark:from-violet-950/30">
                <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/40">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-violet-600 dark:text-violet-400"
                  >
                    <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
                  </svg>
                </div>
                <p className="text-sm font-semibold">Get a Rec</p>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  AI-picked just for you
                </p>
              </div>
            </Link>

            <Link href="/learn" className="group">
              <div className="dark:to-card relative overflow-hidden rounded-2xl border bg-linear-to-br from-amber-50 to-white p-4 transition-all group-hover:border-amber-300 group-hover:shadow-md dark:from-amber-950/30">
                <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/40">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-amber-600 dark:text-amber-400"
                  >
                    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" />
                  </svg>
                </div>
                <p className="text-sm font-semibold">Learn</p>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  Classical music 101
                </p>
              </div>
            </Link>

            <Link href="/journal" className="group">
              <div className="dark:to-card relative overflow-hidden rounded-2xl border bg-linear-to-br from-sky-50 to-white p-4 transition-all group-hover:border-sky-300 group-hover:shadow-md dark:from-sky-950/30">
                <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-sky-100 dark:bg-sky-900/40">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-sky-600 dark:text-sky-400"
                  >
                    <path d="M12 8V4H8" />
                    <rect width="16" height="12" x="4" y="8" rx="2" />
                    <path d="M2 14h2" />
                    <path d="M20 14h2" />
                    <path d="M15 13v2" />
                    <path d="M9 13v2" />
                  </svg>
                </div>
                <p className="text-sm font-semibold">My Journal</p>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  Track your journey
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

function SparklesIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-primary"
    >
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-muted-foreground"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
