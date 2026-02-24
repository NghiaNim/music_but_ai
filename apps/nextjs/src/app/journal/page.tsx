import { Suspense } from "react";

import { HydrateClient } from "~/trpc/server";
import { Journal, JournalSkeleton } from "./_components/journal";

export default function JournalPage() {
  return (
    <HydrateClient>
      <div className="mx-auto max-w-lg px-4 py-6">
        <h1 className="mb-1 text-2xl font-bold tracking-tight">
          Concert Journal
        </h1>
        <p className="text-muted-foreground text-sm">
          Your cultural passport — every concert, every memory
        </p>
        <Suspense fallback={<JournalSkeleton />}>
          <Journal />
        </Suspense>
      </div>
    </HydrateClient>
  );
}
