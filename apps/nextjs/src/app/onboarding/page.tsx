import { Suspense } from "react";

import { HydrateClient, prefetch, trpc } from "~/trpc/server";
import { OnboardingFlow } from "./_components/onboarding-flow";

export default function OnboardingPage() {
  prefetch(trpc.onboarding.getQuestions.queryOptions());

  return (
    <HydrateClient>
      <div className="fixed inset-0 top-12 bottom-16 flex flex-col">
        <Suspense
          fallback={
            <div className="flex flex-1 items-center justify-center">
              <div className="bg-muted size-8 animate-pulse rounded-full" />
            </div>
          }
        >
          <OnboardingFlow />
        </Suspense>
      </div>
    </HydrateClient>
  );
}
