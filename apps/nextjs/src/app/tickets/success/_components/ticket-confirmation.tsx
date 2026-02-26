"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@acme/ui/button";
import { toast } from "@acme/ui/toast";

import { useTRPC } from "~/trpc/react";

export function TicketConfirmation() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const autoConfirmAttempted = useRef(false);

  const confirm = useMutation(
    trpc.ticket.confirmOrder.mutationOptions({
      onSuccess: (data) => {
        if (data?.status === "completed") {
          toast.success("Payment confirmed!");
          void queryClient.invalidateQueries({
            queryKey: trpc.ticket.orderById.queryKey({ orderId: orderId ?? "" }),
          });
        }
      },
      onError: (err) => {
        toast.error(err.message || "Failed to confirm order");
      },
    }),
  );

  const { data: order } = useQuery({
    ...trpc.ticket.orderById.queryOptions({ orderId: orderId ?? "" }),
    enabled: !!orderId,
  });

  useEffect(() => {
    if (!orderId || autoConfirmAttempted.current) return;
    if (!order || order.status !== "pending") return;

    autoConfirmAttempted.current = true;

    const tryConfirm = (attempt: number) => {
      if (attempt > 3) return;
      const delay = attempt === 0 ? 500 : 2000;
      setTimeout(() => {
        confirm.mutate(
          { orderId },
          {
            onSuccess: (data) => {
              if (data?.status !== "completed" && attempt < 3) {
                tryConfirm(attempt + 1);
              }
            },
            onError: () => {
              if (attempt < 3) tryConfirm(attempt + 1);
            },
          },
        );
      }, delay);
    };

    tryConfirm(0);
  }, [orderId, order?.status]);

  const confirmedOrder = confirm.data;
  const orderData = confirmedOrder ?? order;
  const isCompleted = orderData?.status === "completed";
  const hasFailed = confirm.isError;

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 pt-12 text-center">
      <div className="mb-4 flex size-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
        {isCompleted ? (
          <CheckIcon />
        ) : (
          <ClockIcon />
        )}
      </div>

      <h1 className="mb-2 text-2xl font-bold">
        {isCompleted
          ? "Tickets Confirmed!"
          : hasFailed
            ? "Confirmation Issue"
            : "Confirming Your Order..."}
      </h1>
      <p className="text-muted-foreground mb-6 text-sm">
        {isCompleted
          ? "You're all set for an amazing experience"
          : hasFailed
            ? "We couldn't verify the payment — it may still be processing"
            : "We're verifying your payment with Stripe"}
      </p>

      {!isCompleted && orderId && (
        <Button
          onClick={() => confirm.mutate({ orderId })}
          disabled={confirm.isPending}
          className="mb-6 bg-emerald-600 hover:bg-emerald-700"
        >
          {confirm.isPending ? "Confirming..." : "Retry Confirmation"}
        </Button>
      )}

      {orderData?.event && (
        <div className="w-full rounded-xl border bg-gradient-to-b from-emerald-50/50 to-white p-6 text-left dark:from-emerald-950/20 dark:to-transparent">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
              <TicketSmallIcon />
            </div>
            <div>
              <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                {orderData.quantity}× Ticket{orderData.quantity > 1 ? "s" : ""}
              </p>
              <p className="text-lg font-semibold">{orderData.event.title}</p>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CalendarSmallIcon />
              <span>
                {new Date(orderData.event.date).toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPinSmallIcon />
              <span>{orderData.event.venue}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <DollarIcon />
              <span>
                Total paid: ${(orderData.totalCents / 100).toFixed(2)}
              </span>
            </div>
          </div>

          {isCompleted && (
            <div className="mt-4 rounded-lg bg-emerald-50 p-3 dark:bg-emerald-900/20">
              <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                Order #{orderData.id.slice(0, 8).toUpperCase()}
              </p>
              <p className="text-xs text-emerald-600/70 dark:text-emerald-400/70">
                A confirmation will be sent to your email
              </p>
            </div>
          )}
        </div>
      )}

      <div className="mt-6 flex w-full gap-3">
        <Button variant="outline" className="flex-1" asChild>
          <Link href="/events">Browse Events</Link>
        </Button>
        {orderData?.event && (
          <Button className="flex-1" asChild>
            <Link
              href={`/chat?eventId=${orderData.eventId}&mode=learning`}
            >
              Prepare for the Show
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-emerald-600 dark:text-emerald-400"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-amber-600 dark:text-amber-400"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function TicketSmallIcon() {
  return (
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
  );
}

function CalendarSmallIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" />
    </svg>
  );
}

function MapPinSmallIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function DollarIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" x2="12" y1="2" y2="22" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}
