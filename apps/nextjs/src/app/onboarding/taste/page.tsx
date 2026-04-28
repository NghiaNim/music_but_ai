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
      <div className="fixed inset-0 top-12 bottom-16 flex flex-col bg-white dark:bg-neutral-950">
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
