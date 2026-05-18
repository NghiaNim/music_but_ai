"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import type { RouterOutputs } from "@acme/api";

import { authClient } from "~/auth/client";
import { useTRPC } from "~/trpc/react";

import { computeDaysOnApp } from "./streak-days";

type UserEventWithEvent = RouterOutputs["userEvent"]["myEvents"][number];

export function useStreakDays() {
  const { data: session } = authClient.useSession();
  const isSignedIn = !!session?.user;

  const trpc = useTRPC();
  const { data: userEvents } = useQuery({
    ...trpc.userEvent.myEvents.queryOptions(),
    enabled: isSignedIn,
  });

  const attended =
    userEvents?.filter((ue: UserEventWithEvent) => ue.status === "attended") ??
    [];

  const userWithProfile = session?.user as
    | { profile?: { createdAt?: string | Date } }
    | undefined;
  const createdAtFromProfile = userWithProfile?.profile?.createdAt
    ? new Date(userWithProfile.profile.createdAt)
    : undefined;
  const createdAt =
    createdAtFromProfile ??
    (attended[0] ? new Date(attended[0].createdAt) : undefined);

  const [asOf] = useState(() => new Date());
  return computeDaysOnApp(createdAt, asOf);
}
