"use client";

import { useRouter } from "next/navigation";

import { Button } from "@acme/ui/button";

/**
 * Top-left affordance — root layout hides global chrome on this route.
 */
export function TastePageBack() {
  const router = useRouter();

  return (
    <div className="-mx-1 mb-1 flex shrink-0 items-center">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="text-muted-foreground hover:text-foreground size-11 shrink-0 rounded-full"
        onClick={() => router.back()}
        aria-label="Go back"
      >
        <BackChevron />
      </Button>
    </div>
  );
}

function BackChevron() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}
