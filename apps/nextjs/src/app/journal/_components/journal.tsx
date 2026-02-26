"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { RouterOutputs } from "@acme/api";
import { cn } from "@acme/ui";
import { Button } from "@acme/ui/button";
import { Input } from "@acme/ui/input";
import { toast } from "@acme/ui/toast";

import { useTRPC } from "~/trpc/react";

type UserEventWithEvent = RouterOutputs["userEvent"]["myEvents"][number];

export function Journal() {
  const trpc = useTRPC();
  const { data: userEvents, isLoading } = useQuery(
    trpc.userEvent.myEvents.queryOptions(),
  );

  if (isLoading) return <JournalSkeleton />;

  const saved = userEvents?.filter((ue) => ue.status === "saved") ?? [];
  const attended = userEvents?.filter((ue) => ue.status === "attended") ?? [];

  const stats = {
    attended: attended.length,
    saved: saved.length,
    composers: new Set(
      attended.map((ue) => ue.event.program.split(":")[0]?.trim()),
    ).size,
    venues: new Set(attended.map((ue) => ue.event.venue)).size,
  };

  return (
    <div className="mt-8">
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Concerts Attended" value={stats.attended} />
        <StatCard label="Events Saved" value={stats.saved} />
        <StatCard label="Composers Explored" value={stats.composers} />
        <StatCard label="Venues Visited" value={stats.venues} />
      </div>

      {attended.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-4 text-xl font-semibold">Attended</h2>
          <div className="flex flex-col gap-3">
            {attended.map((ue) => (
              <JournalEntry key={ue.id} userEvent={ue} />
            ))}
          </div>
        </section>
      )}

      {saved.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-4 text-xl font-semibold">Saved</h2>
          <div className="flex flex-col gap-3">
            {saved.map((ue) => (
              <JournalEntry key={ue.id} userEvent={ue} />
            ))}
          </div>
        </section>
      )}

      {!userEvents?.length && (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <p className="text-muted-foreground text-lg">Your journal is empty</p>
          <p className="text-muted-foreground text-sm">
            Start by saving or attending events
          </p>
          <Button asChild>
            <Link href="/">Browse Events</Link>
          </Button>
        </div>
      )}
    </div>
  );
}

function JournalEntry({ userEvent }: { userEvent: UserEventWithEvent }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [reflection, setReflection] = useState(userEvent.reflection ?? "");

  const saveReflection = useMutation(
    trpc.userEvent.saveReflection.mutationOptions({
      onSuccess: async () => {
        setEditing(false);
        toast.success("Reflection saved!");
        await queryClient.invalidateQueries(trpc.userEvent.pathFilter());
      },
      onError: () => toast.error("Failed to save reflection"),
    }),
  );

  const date = new Date(userEvent.event.date);

  return (
    <div className="bg-card flex items-start gap-4 rounded-lg border p-4">
      <div className="bg-primary/10 flex flex-col items-center rounded-lg px-3 py-2 text-center">
        <span className="text-primary text-xs font-medium uppercase">
          {date.toLocaleDateString("en-US", { month: "short" })}
        </span>
        <span className="text-primary text-xl font-bold">{date.getDate()}</span>
      </div>
      <div className="min-w-0 flex-1">
        <Link
          href={`/event/${userEvent.event.id}`}
          className="hover:text-primary font-semibold transition-colors"
        >
          {userEvent.event.title}
        </Link>
        <p className="text-muted-foreground text-sm">{userEvent.event.venue}</p>

        {userEvent.status === "attended" && (
          <div className="mt-2">
            {editing ? (
              <div className="flex gap-2">
                <Input
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                  placeholder="How was the experience? (280 chars)"
                  maxLength={280}
                  className="text-sm"
                />
                <Button
                  size="sm"
                  onClick={() =>
                    saveReflection.mutate({
                      userEventId: userEvent.id,
                      reflection,
                    })
                  }
                  disabled={saveReflection.isPending}
                >
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setEditing(false)}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className={cn(
                  "mt-1 text-left text-sm",
                  userEvent.reflection
                    ? "text-muted-foreground italic"
                    : "text-primary/70 hover:text-primary",
                )}
              >
                {userEvent.reflection ?? "+ Add a reflection"}
              </button>
            )}
          </div>
        )}
      </div>
      <span
        className={cn(
          "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium",
          userEvent.status === "attended"
            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
            : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
        )}
      >
        {userEvent.status === "attended" ? "Attended" : "Saved"}
      </span>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-card rounded-lg border p-4 text-center">
      <p className="text-primary text-3xl font-bold">{value}</p>
      <p className="text-muted-foreground text-sm">{label}</p>
    </div>
  );
}

export function JournalSkeleton() {
  return (
    <div className="mt-8">
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-card h-20 animate-pulse rounded-lg border"
          />
        ))}
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="bg-card mb-3 h-20 animate-pulse rounded-lg border"
        />
      ))}
    </div>
  );
}
