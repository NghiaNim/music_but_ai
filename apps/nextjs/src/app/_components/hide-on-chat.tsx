"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

export function HideOnChat({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const hideHeader =
    pathname === "/chat" ||
    pathname === "/onboarding" ||
    pathname.startsWith("/onboarding/");
  if (hideHeader) return null;
  return <>{children}</>;
}
