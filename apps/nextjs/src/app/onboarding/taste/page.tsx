import { Suspense } from "react";
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
      {/* Lives inside the global mobile shell (max-w-[430px]); use
          min-h to fill the area between TopHeader and BottomNav
          rather than `fixed inset-0` (which broke out of the shell
          on desktop). */}
      <div className="flex min-h-[calc(100dvh-7rem)] flex-col bg-white dark:bg-neutral-950">
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
