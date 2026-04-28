import { Suspense } from "react";

import { HydrateClient, prefetch, trpc } from "~/trpc/server";
import { OnboardingFlow } from "./_components/onboarding-flow";

export default function OnboardingPage() {
  prefetch(trpc.onboarding.getQuestions.queryOptions());

  return (
    <HydrateClient>
      <div className="absolute inset-0 top-12 bottom-0 flex min-h-0 flex-col overflow-x-hidden">
        <Suspense
          fallback={
            <div className="flex min-h-0 flex-1 items-center justify-center">
              <div className="bg-muted size-8 animate-pulse rounded-full" />
            </div>
          }
        >
          <div className="flex min-h-0 flex-1 flex-col overflow-x-hidden">
            <OnboardingFlow />
          </div>
        </Suspense>
      </div>
    </HydrateClient>
  );
}
