import { Suspense } from "react";

import { TicketConfirmation } from "./_components/ticket-confirmation";

export default function TicketSuccessPage() {
  return (
    <Suspense fallback={<TicketSuccessSkeleton />}>
      <TicketConfirmation />
    </Suspense>
  );
}

function TicketSuccessSkeleton() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 pt-12">
      <div className="bg-muted mb-4 size-20 animate-pulse rounded-full" />
      <div className="bg-muted mb-2 h-7 w-48 animate-pulse rounded" />
      <div className="bg-muted mb-6 h-4 w-64 animate-pulse rounded" />
      <div className="bg-muted h-48 w-full animate-pulse rounded-xl" />
    </div>
  );
}
