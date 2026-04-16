import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";

import { cn } from "@acme/ui";
import { ThemeProvider, ThemeToggle } from "@acme/ui/theme";
import { Toaster } from "@acme/ui/toast";

import { env } from "~/env";
import { TRPCReactProvider } from "~/trpc/react";
import { AuthHeader } from "./_components/auth-header";
import { BottomNav } from "./_components/bottom-nav";

import "~/app/styles.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    env.VERCEL_URL ? `https://${env.VERCEL_URL}` : "http://localhost:3000",
  ),
  title: "Classica",
  description:
    "Discover, learn, and experience classical and jazz music with an AI-powered concierge",
  openGraph: {
    title: "Classica",
    description:
      "Discover, learn, and experience classical and jazz music with an AI-powered concierge",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "bg-background text-foreground min-h-screen font-sans antialiased",
          geistSans.variable,
          geistMono.variable,
        )}
      >
        <ThemeProvider>
          <TRPCReactProvider>
            <div className="relative mx-auto flex min-h-dvh max-w-[430px] flex-col bg-amber-50/50 shadow-sm dark:bg-amber-950/10">
              <header className="sticky top-0 z-50 border-b bg-amber-50/90 backdrop-blur supports-backdrop-filter:bg-amber-50/70 dark:bg-amber-950/90 dark:supports-backdrop-filter:bg-amber-950/70">
                <div className="flex h-12 items-center justify-between px-4">
                  <Link
                    href="/"
                    className="text-base font-bold tracking-tight"
                  >
                    Classica
                  </Link>
                  <div className="flex items-center gap-2">
                    <AuthHeader />
                    <ThemeToggle />
                  </div>
                </div>
              </header>
              <main className="flex-1">{props.children}</main>
              <BottomNav />
            </div>
          </TRPCReactProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
