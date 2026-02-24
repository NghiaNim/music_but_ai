"use client";

import { Button } from "@acme/ui/button";

function InfoIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 15 15"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7.5 14A6.5 6.5 0 0 1 1 7.5 6.5 6.5 0 0 1 7.5 1a6.5 6.5 0 0 1 6.5 6.5 6.5 6.5 0 0 1-6.5 6.5Z" />
      <path d="M7.5 4v2" />
      <path d="M7.5 8v4" />
    </svg>
  );
}

export function HeaderExtraButton() {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="text-muted-foreground size-8"
      aria-label="More info"
      onClick={() => {
        /* intentionally does nothing */
      }}
    >
      <InfoIcon />
    </Button>
  );
}
