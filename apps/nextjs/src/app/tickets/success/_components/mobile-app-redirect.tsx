"use client";

import { useEffect } from "react";

/**
 * Bounce a mobile-initiated Stripe checkout back into the native app.
 * Stripe only accepts http(s) success URLs, so the app's checkout sheet
 * (openAuthSessionAsync) waits for this page to navigate to classica://.
 */
export function MobileAppRedirect({ orderId }: { orderId: string }) {
  const deepLink = `classica://tickets/success?orderId=${encodeURIComponent(orderId)}`;

  useEffect(() => {
    window.location.replace(deepLink);
  }, [deepLink]);

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 pt-16 text-center">
      <div className="bg-muted mb-4 size-16 animate-pulse rounded-full" />
      <h1 className="mb-2 text-xl font-bold">Payment received</h1>
      <p className="text-muted-foreground mb-6 text-sm">
        Returning you to the Classica app…
      </p>
      <a href={deepLink} className="text-primary text-sm font-medium underline">
        Tap here if the app doesn&apos;t open
      </a>
    </div>
  );
}
