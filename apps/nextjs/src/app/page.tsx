import { Suspense } from "react";
import Link from "next/link";

import { Button } from "@acme/ui/button";

import { getSession } from "~/auth/server";
import { HydrateClient, prefetch, trpc } from "~/trpc/server";
import { EventFeedSkeleton, FeaturedEvents } from "./_components/event-feed";
import { OnboardingCTA } from "./_components/onboarding-cta";

export default async function HomePage() {
  prefetch(trpc.event.all.queryOptions({}));
  const session = await getSession();

  return (
    <HydrateClient>
      <div className="mx-auto max-w-lg">
        <section className="px-4 pt-6 pb-4">
          <h1 className="text-2xl font-bold tracking-tight">
            {session
              ? `Welcome back, ${session.user.name.split(" ")[0] ?? "friend"}`
              : "Discover Classical Music"}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Your AI-powered guide to the world of live performance
          </p>
        </section>

        <section className="px-4 pb-4">
          <OnboardingCTA isSignedIn={!!session} />
        </section>

        <section className="px-4 pb-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Upcoming Events</h2>
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

        <section className="px-4 pb-6">
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

        <section className="px-4 pb-6">
          <h2 className="mb-3 text-lg font-semibold">Quick Start</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/events?difficulty=beginner" className="group">
              <div className="rounded-xl border bg-emerald-50 p-4 transition-colors group-hover:border-emerald-300 dark:bg-emerald-950/30">
                <p className="text-sm font-semibold">For Beginners</p>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  First concert? Start here
                </p>
              </div>
            </Link>
            <Link href="/chat?mode=discovery" className="group">
              <div className="rounded-xl border bg-violet-50 p-4 transition-colors group-hover:border-violet-300 dark:bg-violet-950/30">
                <p className="text-sm font-semibold">Get a Rec</p>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  AI-picked just for you
                </p>
              </div>
            </Link>
            <Link href="/learn" className="group">
              <div className="rounded-xl border bg-amber-50 p-4 transition-colors group-hover:border-amber-300 dark:bg-amber-950/30">
                <p className="text-sm font-semibold">Learn</p>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  Classical music 101
                </p>
              </div>
            </Link>
            <Link href="/journal" className="group">
              <div className="rounded-xl border bg-sky-50 p-4 transition-colors group-hover:border-sky-300 dark:bg-sky-950/30">
                <p className="text-sm font-semibold">My Journal</p>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  Track your journey
                </p>
              </div>
            </Link>
          </div>
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
