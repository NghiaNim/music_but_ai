import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@acme/ui/button";

import { getSession } from "~/auth/server";
import { HydrateClient, prefetch, trpc } from "~/trpc/server";
import { EventFeedSkeleton, FeaturedEvents } from "./_components/event-feed";
import { OnboardingCTA } from "./_components/onboarding-cta";

export default async function HomePage() {
  prefetch(trpc.event.all.queryOptions({}));
  prefetch(
    trpc.liveEvent.page.queryOptions({
      upcomingOnly: true,
      limit: 50,
      cursor: 0,
    }),
  );
  const session = await getSession();
  const firstName = session?.user.name.split(" ")[0] ?? "friend";

  return (
    <HydrateClient>
      <div className="mx-auto max-w-lg">
        {/* Hero */}
        <section className="relative overflow-hidden px-4 pt-6 pb-5">
          <div className="pointer-events-none absolute inset-0 bg-linear-to-b from-amber-50/80 via-orange-50/40 to-transparent dark:from-amber-950/20 dark:via-orange-950/10 dark:to-transparent" />

          <FloatingNotes />

          <div className="relative">
            <p className="mb-1 text-sm font-medium text-amber-600 dark:text-amber-400">
              {session ? `Hey ${firstName} ~` : "Welcome to Classica"}
            </p>
            <h1 className="text-2xl font-bold tracking-tight">
              {session
                ? "What shall we listen to today?"
                : "Your next favorite concert is waiting"}
            </h1>
            <p className="text-muted-foreground mt-1.5 text-sm">
              Discover classical & jazz, powered by curiosity
            </p>
          </div>
        </section>

        {/* Onboarding */}
        <section className="px-4 pb-4">
          <OnboardingCTA isSignedIn={!!session} />
        </section>

        {/* Upcoming Events */}
        <section className="px-4 pb-6">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarSparkle />
              <h2 className="text-lg font-semibold">Upcoming Events</h2>
            </div>
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

        {/* Ask Tanny */}
        <section className="px-4 pb-6">
          <Link href="/chat" className="group block">
            <div className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-[#ffffff] p-4 transition-all group-hover:border-neutral-300 group-hover:shadow-md">
              <div className="pointer-events-none absolute -right-4 -bottom-4 opacity-[0.07] dark:opacity-5">
                <SpeechBubbleDecor />
              </div>
              <div className="relative flex items-center gap-4">
                <div className="relative h-[4.75rem] w-[4.75rem] shrink-0">
                  <Image
                    src="/tanny-cat-cutout.png"
                    alt="Tanny the cat"
                    width={76}
                    height={76}
                    className="h-full w-full object-contain object-bottom"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">Ask Tanny</p>
                  <p className="text-muted-foreground text-xs">
                    Your musical sidekick &mdash; recs, trivia, anything!
                  </p>
                </div>
                <ChevronRightIcon />
              </div>
            </div>
          </Link>
        </section>

        {/* Quick Start */}
        <section className="px-4 pb-8">
          <h2 className="mb-3 text-lg font-semibold">Explore</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/events?difficulty=beginner" className="group">
              <div className="flex flex-col items-center gap-2 rounded-2xl border bg-emerald-50 p-5 text-center transition-all group-hover:border-emerald-300 group-hover:shadow-sm dark:bg-emerald-950/30">
                <SeedlingIllustration />
                <div>
                  <p className="text-sm font-semibold">For Beginners</p>
                  <p className="text-muted-foreground mt-0.5 text-[11px]">
                    First concert? Start here
                  </p>
                </div>
              </div>
            </Link>
            <Link href="/chat?mode=discovery" className="group">
              <div className="flex flex-col items-center gap-2 rounded-2xl border bg-violet-50 p-5 text-center transition-all group-hover:border-violet-300 group-hover:shadow-sm dark:bg-violet-950/30">
                <SparkleIllustration />
                <div>
                  <p className="text-sm font-semibold">Get a Rec</p>
                  <p className="text-muted-foreground mt-0.5 text-[11px]">
                    AI-picked just for you
                  </p>
                </div>
              </div>
            </Link>
            <Link href="/learn" className="group">
              <div className="flex flex-col items-center gap-2 rounded-2xl border bg-amber-50 p-5 text-center transition-all group-hover:border-amber-300 group-hover:shadow-sm dark:bg-amber-950/30">
                <BookIllustration />
                <div>
                  <p className="text-sm font-semibold">Learn</p>
                  <p className="text-muted-foreground mt-0.5 text-[11px]">
                    Classical & jazz 101
                  </p>
                </div>
              </div>
            </Link>
            <Link href="/profile" className="group">
              <div className="flex flex-col items-center gap-2 rounded-2xl border bg-sky-50 p-5 text-center transition-all group-hover:border-sky-300 group-hover:shadow-sm dark:bg-sky-950/30">
                <TrophyIllustration />
                <div>
                  <p className="text-sm font-semibold">My Badges</p>
                  <p className="text-muted-foreground mt-0.5 text-[11px]">
                    See what you&apos;ve earned
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </section>
      </div>
    </HydrateClient>
  );
}

function FloatingNotes() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      <svg
        className="absolute top-2 right-4 rotate-12"
        width="30"
        height="30"
        viewBox="0 0 24 24"
        fill="#FFBE00"
        opacity="0.7"
      >
        <BeamedEighthNote />
      </svg>
      <svg
        className="absolute top-14 right-14 -rotate-6"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="#FFB777"
        opacity="0.8"
      >
        <EighthNote />
      </svg>
      <svg
        className="absolute top-5 right-36 rotate-6"
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="#FFB1B7"
        opacity="0.8"
      >
        <EighthNote />
      </svg>
    </div>
  );
}

function EighthNote() {
  return (
    <>
      <rect x="11" y="3" width="2" height="13" />
      <path d="M13 3 Q19 5 19 10 Q19 7 13 7 Z" />
      <ellipse cx="9" cy="17" rx="4" ry="3" />
    </>
  );
}

function BeamedEighthNote() {
  return (
    <>
      <rect x="5.3" y="6" width="1.4" height="13" />
      <rect x="17.3" y="4" width="1.4" height="13" />
      <path d="M5 4.5 L19 2.5 L19 5 L5 7 Z" />
      <ellipse cx="4" cy="19" rx="3.2" ry="2.3" />
      <ellipse cx="16" cy="17" rx="3.2" ry="2.3" />
    </>
  );
}

function CalendarSparkle() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      className="text-amber-500 dark:text-amber-400"
    >
      <rect
        x="3"
        y="4"
        width="18"
        height="18"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M8 2v4M16 2v4M3 10h18"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M15 15l1.5-3 1.5 3M12 14l-1 2h3"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.6"
      />
    </svg>
  );
}

function SpeechBubbleDecor() {
  return (
    <svg width="120" height="120" viewBox="0 0 120 120" fill="currentColor">
      <path d="M10 30 C10 15 25 5 50 5 C85 5 110 20 110 50 C110 80 85 95 55 95 L35 115 L38 90 C20 85 10 70 10 50Z" />
    </svg>
  );
}

function SeedlingIllustration() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <circle
        cx="18"
        cy="18"
        r="18"
        className="fill-emerald-100 dark:fill-emerald-900/40"
      />
      <path
        d="M18 26V18"
        stroke="#059669"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M18 18c0-4 3-6 6-6-1 4-3 6-6 6z" fill="#34d399" />
      <path d="M18 20c0-3-2.5-5-5-5 .8 3 2.5 5 5 5z" fill="#6ee7b7" />
      <ellipse cx="18" cy="27" rx="4" ry="1.5" fill="#a7f3d0" />
    </svg>
  );
}

function SparkleIllustration() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <circle
        cx="18"
        cy="18"
        r="18"
        className="fill-violet-100 dark:fill-violet-900/40"
      />
      <path d="M18 8l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" fill="#a78bfa" />
      <path
        d="M26 10l1 2.5 2.5 1-2.5 1-1 2.5-1-2.5L22.5 13l2.5-1z"
        fill="#c4b5fd"
      />
      <path d="M10 22l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z" fill="#ddd6fe" />
    </svg>
  );
}

function BookIllustration() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <circle
        cx="18"
        cy="18"
        r="18"
        className="fill-amber-100 dark:fill-amber-900/40"
      />
      <rect x="10" y="10" width="16" height="18" rx="2" fill="#fbbf24" />
      <rect x="12" y="10" width="14" height="18" rx="1" fill="#fde68a" />
      <path
        d="M15 15h8M15 18h6M15 21h4"
        stroke="#b45309"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <path d="M12 10v18" stroke="#f59e0b" strokeWidth="1.5" />
    </svg>
  );
}

function TrophyIllustration() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <circle
        cx="18"
        cy="18"
        r="18"
        className="fill-sky-100 dark:fill-sky-900/40"
      />
      <path d="M13 12h10v6c0 3-2 5-5 5s-5-2-5-5v-6z" fill="#38bdf8" />
      <path
        d="M13 14h-2c-1 0-2 1-1.5 3s2 3 3.5 2"
        stroke="#7dd3fc"
        strokeWidth="1.2"
        fill="none"
      />
      <path
        d="M23 14h2c1 0 2 1 1.5 3s-2 3-3.5 2"
        stroke="#7dd3fc"
        strokeWidth="1.2"
        fill="none"
      />
      <rect x="16" y="23" width="4" height="2" rx="0.5" fill="#0ea5e9" />
      <rect x="14" y="25" width="8" height="2" rx="1" fill="#0ea5e9" />
      <path
        d="M17 16l1-2 1 2 2 .3-1.5 1.4.4 2-1.9-1-1.9 1 .4-2L15 16.3z"
        fill="#fbbf24"
      />
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
