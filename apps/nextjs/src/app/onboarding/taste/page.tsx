import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getSession } from "~/auth/server";
import { HydrateClient } from "~/trpc/server";
import { VisualCardsFlow } from "./_components/visual-cards-flow";

export default async function TasteOnboardingPage() {
  const session = await getSession();
  if (!session) {
    redirect("/sign-in?callbackUrl=/onboarding/taste");
  }

  return (
    <HydrateClient>
      {/* Lives inside the global mobile shell (max-w-[430px]).
          Bottom nav is hidden on this route by design — the X
          button below is the user's escape hatch. The session
          auto-persists at every step, so navigating away and
          coming back resumes mid-flow. */}
      <div className="relative flex min-h-[calc(100dvh-3rem)] flex-col bg-white dark:bg-neutral-950">
        <Link
          href="/"
          aria-label="Save and exit — your progress is kept"
          title="Save & exit"
          className="absolute top-3 right-3 z-20 flex size-9 items-center justify-center rounded-full border border-neutral-200 bg-white/90 text-neutral-600 shadow-sm backdrop-blur transition-colors hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900/90 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
        >
          <CloseIcon />
        </Link>
        <Suspense
          fallback={
            <div className="flex flex-1 items-center justify-center">
              <div className="bg-muted size-8 animate-pulse rounded-full" />
            </div>
          }
        >
          <VisualCardsFlow />
        </Suspense>
      </div>
    </HydrateClient>
  );
}

function CloseIcon() {
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
      aria-hidden="true"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}
