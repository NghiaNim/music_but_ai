import { Suspense } from "react";

import { MobileAppRedirect } from "./_components/mobile-app-redirect";
import { TicketConfirmation } from "./_components/ticket-confirmation";

export default async function TicketSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string; client?: string }>;
}) {
  const { orderId, client } = await searchParams;

  if (client === "mobile" && orderId) {
    return <MobileAppRedirect orderId={orderId} />;
  }

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
