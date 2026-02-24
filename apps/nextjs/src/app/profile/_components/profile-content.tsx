"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { cn } from "@acme/ui";
import { Button } from "@acme/ui/button";
import { toast } from "@acme/ui/toast";

import { useTRPC } from "~/trpc/react";

const LEVELS = [
  { value: "new", label: "New to Classical", desc: "I've never been to a concert" },
  { value: "casual", label: "Casual Listener", desc: "I go occasionally" },
  { value: "enthusiast", label: "Enthusiast", desc: "I attend regularly" },
] as const;

export function ProfileContent() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: profile, isError } = useQuery(
    trpc.userProfile.get.queryOptions(),
  );

  const updateProfile = useMutation(
    trpc.userProfile.update.mutationOptions({
      onSuccess: async () => {
        toast.success("Experience level updated!");
        await queryClient.invalidateQueries(trpc.userProfile.pathFilter());
      },
      onError: () => toast.error("Failed to update profile"),
    }),
  );

  if (isError) {
    return (
      <section className="bg-card rounded-xl border p-4 text-center">
        <p className="text-muted-foreground text-sm">
          Sign in to set your experience level
        </p>
      </section>
    );
  }

  return (
    <>
      <section className="bg-card rounded-xl border p-4">
        <h2 className="mb-1 text-sm font-semibold">Experience Level</h2>
        <p className="text-muted-foreground mb-3 text-xs">
          Helps the AI tailor recommendations for you
        </p>
        <div className="flex flex-col gap-2">
          {LEVELS.map((level) => (
            <button
              key={level.value}
              onClick={() =>
                updateProfile.mutate({ experienceLevel: level.value })
              }
              disabled={updateProfile.isPending}
              className={cn(
                "rounded-lg border p-3 text-left transition-colors",
                profile?.experienceLevel === level.value
                  ? "border-primary bg-primary/5"
                  : "hover:bg-muted",
              )}
            >
              <p className="text-sm font-medium">{level.label}</p>
              <p className="text-muted-foreground text-xs">{level.desc}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="bg-card rounded-xl border p-4">
        <h2 className="mb-3 text-sm font-semibold">Quick Links</h2>
        <div className="flex flex-col gap-2">
          <Link
            href="/journal"
            className="hover:bg-muted flex items-center justify-between rounded-lg border p-3 transition-colors"
          >
            <span className="text-sm">Concert Journal</span>
            <ChevronRight />
          </Link>
        </div>
      </section>
    </>
  );
}

function ChevronRight() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
