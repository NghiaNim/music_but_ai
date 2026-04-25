import Link from "next/link";

import { ThemeToggle } from "@acme/ui/theme";

import { AuthHeader } from "./auth-header";

export function TopHeader() {
  return (
    <header className="sticky top-0 z-50 border-b bg-amber-50/90 backdrop-blur supports-backdrop-filter:bg-amber-50/70 dark:bg-amber-950/90 dark:supports-backdrop-filter:bg-amber-950/70">
      <div className="flex h-12 items-center justify-between px-4">
        <Link href="/" className="text-base font-bold tracking-tight">
          Classica
        </Link>
        <div className="flex items-center gap-2">
          <AuthHeader />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
