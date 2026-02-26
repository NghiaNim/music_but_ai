import { Suspense } from "react";

import { MyTickets } from "./_components/my-tickets";

export default function TicketsPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-6 pb-24">
      <h1 className="mb-4 text-2xl font-bold tracking-tight">My Tickets</h1>
      <Suspense fallback={<TicketsSkeleton />}>
        <MyTickets />
      </Suspense>
    </div>
  );
}

function TicketsSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-muted h-24 animate-pulse rounded-xl" />
      ))}
    </div>
  );
}
