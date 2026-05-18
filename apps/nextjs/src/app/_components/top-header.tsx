import Link from "next/link";

import { ThemeToggle } from "@acme/ui/theme";

import { AuthHeader } from "./auth-header";
import { HeaderStreak } from "./header-streak";

export function TopHeader() {
  return (
    <header className="sticky top-0 z-50 border-b bg-amber-50/90 backdrop-blur supports-backdrop-filter:bg-amber-50/70 dark:bg-amber-950/90 dark:supports-backdrop-filter:bg-amber-950/70">
      <div className="flex h-12 items-center justify-between px-4">
        <Link href="/demo" className="text-base font-bold tracking-tight">
          Classica
        </Link>
        <div className="flex min-w-0 items-center gap-2">
          <HeaderStreak />
          <AuthHeader />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
