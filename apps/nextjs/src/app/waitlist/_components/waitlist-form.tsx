"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";

import { Button } from "@acme/ui/button";
import { Input } from "@acme/ui/input";

import { useTRPC } from "~/trpc/react";

export function WaitlistForm() {
  const trpc = useTRPC();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "joined" | "already_joined">(
    "idle",
  );

  const joinWaitlist = useMutation(
    trpc.waitlist.join.mutationOptions({
      onSuccess(data) {
        setStatus(data.status);
        if (data.status === "joined") {
          setName("");
          setEmail("");
        }
      },
    }),
  );

  const canSubmit =
    name.trim().length > 0 &&
    email.trim().length > 0 &&
    !joinWaitlist.isPending;

  return (
    <div className="bg-card border-border rounded-2xl border p-4">
      <div className="space-y-3">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          autoComplete="name"
        />
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          autoComplete="email"
        />
        <Button
          className="w-full bg-[#9C1738] text-white hover:bg-[#7c1030] disabled:opacity-100"
          disabled={!canSubmit}
          onClick={() =>
            joinWaitlist.mutate({
              name: name.trim(),
              email: email.trim().toLowerCase(),
              source: "web",
            })
          }
        >
          {joinWaitlist.isPending ? "Joining..." : "Join Waitlist"}
        </Button>
      </div>

      {status === "joined" && (
        <p className="mt-3 text-sm text-emerald-600">
          You are on the waitlist. Thanks for joining.
        </p>
      )}
      {status === "already_joined" && (
        <p className="text-muted-foreground mt-3 text-sm">
          This email is already on the waitlist.
        </p>
      )}
      {joinWaitlist.error && (
        <p className="mt-3 text-sm text-red-600">
          Could not join right now. Please try again.
        </p>
      )}
    </div>
  );
}
