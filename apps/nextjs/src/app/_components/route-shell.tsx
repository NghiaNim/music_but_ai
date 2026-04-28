"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

export function RouteShell(props: {
  children: ReactNode;
  header: ReactNode;
  footer: ReactNode;
}) {
  const pathname = usePathname();
  const isMarketingRoute = pathname === "/landingpage";

  if (isMarketingRoute) {
    return <>{props.children}</>;
  }

  return (
    <div className="relative mx-auto flex min-h-dvh max-w-[430px] flex-col bg-amber-50/50 shadow-sm dark:bg-amber-950/10">
      {props.header}
      <main className="flex-1">{props.children}</main>
      {props.footer}
    </div>
  );
}
