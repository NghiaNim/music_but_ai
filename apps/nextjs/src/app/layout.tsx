import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { cn } from "@acme/ui";
import { ThemeProvider } from "@acme/ui/theme";
import { Toaster } from "@acme/ui/toast";

import { env } from "~/env";
import { TRPCReactProvider } from "~/trpc/react";
import { BottomNav } from "./_components/bottom-nav";
import { HideOnChat } from "./_components/hide-on-chat";
import { TopHeader } from "./_components/top-header";

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
              <HideOnChat>
                <TopHeader />
              </HideOnChat>
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
