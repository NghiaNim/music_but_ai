"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import posthog from "posthog-js";

import { cn } from "@acme/ui";
import { Button } from "@acme/ui/button";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";

import { useTRPC } from "~/trpc/react";

type SignupType = "individual" | "organization";

export function WaitlistForm() {
  const trpc = useTRPC();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [signupType, setSignupType] = useState<SignupType>("individual");
  const [status, setStatus] = useState<"idle" | "joined" | "already_joined">(
    "idle",
  );

  const joinWaitlist = useMutation(
    trpc.waitlist.join.mutationOptions({
      onSuccess(data) {
        setStatus(data.status);
        if (data.status === "joined") {
          posthog.capture("waitlist_joined", {
            source: "web",
            signup_type: signupType,
          });
          setName("");
          setEmail("");
          setCity("");
          setSignupType("individual");
        }
      },
    }),
  );

  const canSubmit =
    name.trim().length > 0 &&
    email.trim().length > 0 &&
    city.trim().length > 0 &&
    !joinWaitlist.isPending;

  if (status === "joined") {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-amber-100 text-2xl">
          🎶
        </div>
        <p className="text-lg font-semibold text-gray-900">You're on the list!</p>
        <p className="text-sm text-gray-500">
          We'll let you know when Classica is ready for you.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="waitlist-name" className="text-sm font-medium text-gray-700">
          Name
        </Label>
        <Input
          id="waitlist-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="border-gray-200 bg-white/70 backdrop-blur focus:border-amber-300 focus:ring-amber-200"
          autoComplete="name"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="waitlist-email" className="text-sm font-medium text-gray-700">
          Email
        </Label>
        <Input
          id="waitlist-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="border-gray-200 bg-white/70 backdrop-blur focus:border-amber-300 focus:ring-amber-200"
          autoComplete="email"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="waitlist-city" className="text-sm font-medium text-gray-700">
          City
        </Label>
        <Input
          id="waitlist-city"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="New York"
          className="border-gray-200 bg-white/70 backdrop-blur focus:border-amber-300 focus:ring-amber-200"
          autoComplete="address-level2"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="waitlist-signup-type" className="text-sm font-medium text-gray-700">
          Individual or organization
        </Label>
        <select
          id="waitlist-signup-type"
          value={signupType}
          onChange={(e) => setSignupType(e.target.value as SignupType)}
          className={cn(
            "h-9 w-full rounded-md border border-gray-200 bg-white/70 px-3 text-sm shadow-xs backdrop-blur",
            "focus-visible:border-amber-300 focus-visible:ring-amber-200/50 focus-visible:ring-[3px] focus-visible:outline-none",
          )}
        >
          <option value="individual">Individual</option>
          <option value="organization">Organization</option>
        </select>
      </div>

      <Button
        className="mt-2 w-full disabled:opacity-50"
        disabled={!canSubmit}
        onClick={() =>
          joinWaitlist.mutate({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            city: city.trim(),
            signupType,
            source: "web",
          })
        }
      >
        {joinWaitlist.isPending ? "Joining..." : "Join Waitlist"}
      </Button>

      {status === "already_joined" && (
        <p className="text-center text-sm text-gray-500">
          This email is already on the waitlist.
        </p>
      )}
      {joinWaitlist.error && (
        <p className="text-center text-sm text-red-600">
          Could not join right now. Please try again.
        </p>
      )}
    </div>
  );
}
