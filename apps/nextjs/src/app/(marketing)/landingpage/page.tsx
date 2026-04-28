import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@acme/ui/button";

export const metadata: Metadata = {
  title: "Classica | Discover Your Next Concert",
  description:
    "A calm, modern way to discover classical and jazz concerts, build your taste profile, and get personalized recommendations.",
};

const FEATURE_CARDS = [
  {
    title: "Tanny helps you find your sound",
    description:
      "Your musical sidekick makes the first step feel playful, warm, and way less intimidating.",
  },
  {
    title: "Concerts matched to your mood",
    description:
      "Pick the energy you want, from grand and dramatic to intimate and dreamy.",
  },
  {
    title: "Learn without feeling lectured",
    description:
      "Get just enough context, recs, and confidence to actually want to go to the concert.",
  },
] as const;

const STEPS = [
  "Meet Tanny and tell Classica what kind of music moves you.",
  "Get a taste profile that turns feelings into concert recs.",
  "Save favorites, learn as you go, and build your concert life.",
] as const;

const TANNY_QUOTES = [
  "Big feelings? I know a symphony for that.",
  "New to classical or jazz? Perfect. I love an origin story.",
  "Let's find you a concert worth dressing up for.",
] as const;

const HERO_TAGS = ["Grand", "Dreamy", "Joyful", "Smoky", "Curious"] as const;

export default async function LandingPage() {
  const primaryHref = "/";
  const primaryLabel = "Get started";

  return (
    <div className="relative overflow-hidden bg-linear-to-br from-amber-50/70 via-rose-50/35 to-violet-50/35 dark:from-background dark:via-rose-950/8 dark:to-violet-950/8">
      <HeroSparkles />
      <div className="mx-auto flex min-h-dvh max-w-6xl flex-col px-4 pb-12 sm:px-6 lg:px-8">
      <header className="flex items-center justify-between py-5">
        <Link href="/landingpage" className="text-lg font-bold tracking-tight">
          <span className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-full border bg-background/90 shadow-sm">
              <MusicNoteIcon />
            </span>
            <span>Classica</span>
          </span>
        </Link>
        <div className="flex items-center">
          <Button asChild>
            <Link href={primaryHref}>{primaryLabel}</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1">
        <section className="grid gap-10 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-16">
          <div className="max-w-2xl">
            <p className="text-primary mb-3 text-sm font-medium">
              Meet Tanny, your classical and jazz sidekick
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-5xl">
              Discover classical & jazz, powered by curiosity
            </h1>
            <p className="text-muted-foreground mt-4 max-w-xl text-base leading-7 sm:text-lg">
              Classica helps you discover live classical and jazz music through
              a fun taste profile, thoughtful recommendations, and
              Tanny-guided moments that make the whole experience feel
              welcoming from the very first tap.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {HERO_TAGS.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-amber-200/80 bg-amber-50 px-3 py-1 text-sm font-medium text-amber-900 shadow-sm dark:border-amber-800/60 dark:bg-amber-950/30 dark:text-amber-100"
                >
                  {tag}
                </span>
              ))}
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" asChild>
                <Link href={primaryHref}>{primaryLabel}</Link>
              </Button>
            </div>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <StoreBadge platform="app-store" />
              <StoreBadge platform="google-play" />
            </div>
            <div className="mt-8 grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
              <StatCard value="2 min" label="to build your taste profile" />
              <StatCard value="Tanny-approved" label="concerts matched to your vibe" />
              <StatCard value="Beginner-friendly" label="guidance without gatekeeping" />
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 rounded-[2rem] bg-linear-to-br from-amber-200/40 via-rose-200/25 to-violet-200/35 blur-3xl dark:from-amber-800/16 dark:via-rose-800/8 dark:to-violet-800/16" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/80 p-5 shadow-[0_20px_60px_rgba(214,143,92,0.12)] backdrop-blur sm:p-6 dark:border-white/10 dark:bg-card">
              <div className="absolute -top-8 -right-6 h-24 w-24 rounded-full bg-amber-200/60 blur-2xl dark:bg-amber-700/20" />
              <div className="absolute right-10 bottom-12 h-20 w-20 rounded-full bg-rose-200/60 blur-2xl dark:bg-rose-700/20" />
              <div className="absolute top-20 -left-4 h-16 w-16 rounded-full bg-violet-200/50 blur-2xl dark:bg-violet-700/20" />
              <div className="relative space-y-4">
                <div className="flex items-center gap-3 rounded-2xl border border-white/80 bg-background/85 p-3 shadow-sm backdrop-blur">
                  <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-[#F5E6DC]">
                    <Image
                      src="/tanny-cat-cutout.png"
                      alt="Tanny the cat mascot"
                      width={56}
                      height={56}
                      className="h-full w-full object-contain object-bottom"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">Tanny says</p>
                    <p className="text-muted-foreground text-sm leading-6">
                      "{TANNY_QUOTES[0]}"
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-amber-100 bg-linear-to-br from-amber-50/95 to-rose-50/85 p-4 shadow-sm dark:border-amber-900/40 dark:from-amber-950/30 dark:to-rose-950/20">
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-amber-700 dark:text-amber-300">
                    Your sound
                  </p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight">
                    Cathartic Symphony Enthusiast
                  </p>
                  <p className="text-muted-foreground mt-2 text-sm leading-6">
                    Loves emotional sweep, rich orchestration, and nights that
                    feel transportive from the first note.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {["Orchestral drama", "Late-night jazz", "Main-character energy"].map(
                      (tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-white/80 bg-white/80 px-2.5 py-1 text-xs font-medium text-foreground shadow-sm dark:border-white/10 dark:bg-background/70"
                        >
                          {tag}
                        </span>
                      ),
                    )}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <PreviewCard
                    eyebrow="Tanny pick"
                    title="Romantic orchestra at Carnegie"
                    body="A big, melodic program with drama, warmth, and just the right amount of main-character energy."
                  />
                  <PreviewCard
                    eyebrow="Stretch pick"
                    title="Contemporary chamber set"
                    body="A playful curveball for when you want something intimate, fresh, and still emotionally rich."
                  />
                </div>

                <div className="rounded-2xl border bg-background/90 p-4 shadow-sm">
                  <p className="text-sm font-medium">Why people use Classica</p>
                  <ul className="text-muted-foreground mt-3 space-y-2 text-sm">
                    <li>Personalized recommendations instead of generic listings</li>
                    <li>A mascot guide that makes exploring feel fun</li>
                    <li>A softer, friendlier way into live classical and jazz</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-2 sm:py-4">
          <div className="grid gap-4 md:grid-cols-3">
            {TANNY_QUOTES.map((quote, index) => (
              <div
                key={quote}
                className="rounded-3xl border border-white/70 bg-linear-to-br from-amber-50 via-background to-rose-50 p-5 shadow-sm transition-transform hover:-translate-y-1 dark:border-white/10 dark:from-amber-950/20 dark:to-rose-950/20"
              >
                <p className="text-primary text-xs font-semibold uppercase tracking-[0.18em]">
                  Tanny note 0{index + 1}
                </p>
                <p className="mt-3 text-base font-medium leading-7">"{quote}"</p>
              </div>
            ))}
          </div>
        </section>

        <section className="py-6 sm:py-10">
          <div className="grid gap-4 md:grid-cols-3">
            {FEATURE_CARDS.map((feature) => (
              <div
                key={feature.title}
                className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-sm transition-transform hover:-translate-y-1 dark:border-white/10 dark:bg-card"
              >
                <p className="text-lg font-semibold">{feature.title}</p>
                <p className="text-muted-foreground mt-2 text-sm leading-6">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="py-8 sm:py-12">
          <div className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-sm sm:p-8 dark:border-white/10 dark:bg-card">
            <p className="text-primary text-sm font-medium">How the fun starts</p>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {STEPS.map((step, index) => (
                <div
                  key={step}
                  className="rounded-2xl border bg-background/90 p-5 shadow-sm"
                >
                  <p className="text-primary text-sm font-semibold">
                    0{index + 1}
                  </p>
                  <p className="mt-2 text-sm leading-6">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-8 sm:py-12">
          <div className="rounded-[2rem] border bg-linear-to-br from-amber-50 via-background to-rose-50 p-6 shadow-sm dark:from-amber-950/20 dark:via-background dark:to-rose-950/20 sm:p-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-balance">
                Let Tanny help you find your next obsession.
              </h2>
              <p className="text-muted-foreground mt-3 text-sm leading-6 sm:text-base">
                Whether you are brand new or already obsessed, Classica makes
                discovering what to hear next feel playful, personal, and easy
                to jump into.
              </p>
              <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                <Button size="lg" asChild>
                  <Link href={primaryHref}>{primaryLabel}</Link>
                </Button>
              </div>
              <div className="mt-4 flex flex-col justify-center gap-3 sm:flex-row">
                <StoreBadge platform="app-store" centered />
                <StoreBadge platform="google-play" centered />
              </div>
            </div>
          </div>
        </section>
      </main>
      </div>
    </div>
  );
}

function StatCard(props: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 shadow-sm dark:border-white/10 dark:bg-card">
      <p className="text-foreground text-sm font-semibold">{props.value}</p>
      <p className="text-muted-foreground mt-1 text-xs leading-5">
        {props.label}
      </p>
    </div>
  );
}

function PreviewCard(props: {
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border bg-background/90 p-4 shadow-sm">
      <p className="text-primary text-xs font-medium uppercase tracking-[0.18em]">
        {props.eyebrow}
      </p>
      <p className="mt-2 font-semibold">{props.title}</p>
      <p className="text-muted-foreground mt-1 text-sm leading-6">
        {props.body}
      </p>
    </div>
  );
}

function StoreBadge(props: {
  platform: "app-store" | "google-play";
  centered?: boolean;
}) {
  const isAppStore = props.platform === "app-store";

  return (
    <div
      className={[
        "flex min-h-14 min-w-[190px] items-center gap-3 rounded-2xl border border-white/70 bg-white/85 px-4 py-3 shadow-sm backdrop-blur dark:border-white/10 dark:bg-card",
        props.centered ? "justify-center" : "",
      ].join(" ")}
      aria-label={isAppStore ? "Download on the App Store" : "Get it on Google Play"}
    >
      <div className="text-foreground shrink-0">
        {isAppStore ? <AppleIcon /> : <PlayStoreIcon />}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          {isAppStore ? "Download on the" : "Get it on"}
        </p>
        <p className="text-sm font-semibold">
          {isAppStore ? "App Store" : "Google Play"}
        </p>
      </div>
      <span className="rounded-full bg-muted px-2 py-1 text-[10px] font-medium text-muted-foreground">
        Coming soon
      </span>
    </div>
  );
}

function HeroSparkles() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute top-8 left-[8%] h-32 w-32 rounded-full bg-amber-200/22 blur-3xl dark:bg-amber-700/10" />
      <div className="absolute top-28 right-[18%] h-36 w-36 rounded-full bg-rose-200/18 blur-3xl dark:bg-rose-700/10" />
      <div className="absolute bottom-24 left-[18%] h-36 w-36 rounded-full bg-violet-200/18 blur-3xl dark:bg-violet-700/10" />
      <svg
        className="absolute top-20 left-[18%] rotate-[-10deg]"
        width="30"
        height="30"
        viewBox="0 0 24 24"
        fill="#F6A6B4"
        opacity="0.78"
      >
        <EighthNote />
      </svg>
      <svg
        className="absolute top-24 right-[24%] rotate-[8deg]"
        width="34"
        height="34"
        viewBox="0 0 24 24"
        fill="#F5BF47"
        opacity="0.78"
      >
        <BeamedEighthNote />
      </svg>
      <svg
        className="absolute top-40 left-[54%] rotate-[14deg]"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="#F7B17A"
        opacity="0.72"
      >
        <EighthNote />
      </svg>
      <svg
        className="absolute top-24 left-[12%] rotate-12 text-amber-400/45 dark:text-amber-300/30"
        width="26"
        height="26"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M12 2.5 13.9 8l5.6 1.9-5.6 1.9L12 17.5l-1.9-5.7L4.5 9.9 10.1 8z" />
      </svg>
      <svg
        className="absolute top-44 right-[16%] -rotate-6 text-rose-400/40 dark:text-rose-300/30"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M12 2.5 13.9 8l5.6 1.9-5.6 1.9L12 17.5l-1.9-5.7L4.5 9.9 10.1 8z" />
      </svg>
      <svg
        className="absolute bottom-36 right-[28%] rotate-6 text-violet-400/38 dark:text-violet-300/30"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M12 2.5 13.9 8l5.6 1.9-5.6 1.9L12 17.5l-1.9-5.7L4.5 9.9 10.1 8z" />
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

function MusicNoteIcon() {
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
      className="text-foreground"
    >
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M16.365 1.43c0 1.14-.424 2.187-1.123 2.954-.84.926-2.212 1.64-3.404 1.543-.152-1.113.439-2.305 1.123-3.073.754-.88 2.06-1.555 3.404-1.624zM20.92 17.09c-.61 1.395-.902 2.016-1.687 3.215-1.095 1.67-2.642 3.754-4.562 3.77-1.707.016-2.147-1.113-4.463-1.1-2.316.014-2.8 1.123-4.507 1.107-1.92-.018-3.384-1.9-4.48-3.57C-1.84 15.86-.75 7.78 3.4 7.536c1.804-.106 3.505 1.247 4.598 1.247 1.094 0 3.147-1.543 5.307-1.316.904.038 3.443.365 5.07 2.746-4.447 2.44-3.728 8.8 2.545 9.877z" />
    </svg>
  );
}

function PlayStoreIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
    >
      <path d="M4 3.5v17l9.5-8.5z" fill="#34A853" />
      <path d="M13.5 12 17 8.9 20.8 11c.9.5.9 1.5 0 2L17 15.1z" fill="#FBBC04" />
      <path d="M4 3.5 13.5 12 17 8.9l-11-6c-.8-.4-2 .1-2 1.6z" fill="#4285F4" />
      <path d="M4 20.5 13.5 12 17 15.1l-11 6c-.8.4-2-.1-2-1.6z" fill="#EA4335" />
    </svg>
  );
}
