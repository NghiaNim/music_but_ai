"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { cn } from "@acme/ui";

import { useTRPC } from "~/trpc/react";

const STATUS_STYLES: Record<string, string> = {
  completed:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  pending:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  failed: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  refunded:
    "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-400",
};

export function MyTickets() {
  const trpc = useTRPC();
  const { data: orders, isLoading } = useQuery(
    trpc.ticket.myOrders.queryOptions(),
  );

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-muted h-24 animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  if (!orders?.length) {
    return (
      <div className="flex flex-col items-center py-12 text-center">
        <div className="bg-muted mb-4 flex size-16 items-center justify-center rounded-full">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-muted-foreground"
          >
            <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
            <path d="M13 5v2" />
            <path d="M13 17v2" />
            <path d="M13 11v2" />
          </svg>
        </div>
        <p className="mb-1 font-semibold">No tickets yet</p>
        <p className="text-muted-foreground mb-4 text-sm">
          Browse events or ask our AI concierge to find the perfect concert
        </p>
        <Link
          href="/events"
          className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium"
        >
          Browse Events
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <Link
          key={order.id}
          href={`/event/${order.eventId}`}
          className="bg-card hover:bg-muted/50 flex items-center gap-3 rounded-xl border p-4 transition-colors"
        >
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-emerald-600 dark:text-emerald-400"
            >
              <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
              <path d="M13 5v2" />
              <path d="M13 17v2" />
              <path d="M13 11v2" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">
              {order.event.title}
            </p>
            <div className="text-muted-foreground flex items-center gap-2 text-xs">
              <span>
                {new Date(order.event.date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
              <span>·</span>
              <span>
                {order.quantity}× ${(order.totalCents / 100).toFixed(2)}
              </span>
            </div>
          </div>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-medium",
              STATUS_STYLES[order.status] ?? STATUS_STYLES.pending,
            )}
          >
            {order.status}
          </span>
        </Link>
      ))}
    </div>
  );
}
