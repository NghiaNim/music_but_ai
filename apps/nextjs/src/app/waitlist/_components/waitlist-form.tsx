"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import posthog from "posthog-js";

import { cn } from "@acme/ui";
import { Button } from "@acme/ui/button";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";

import { useTRPC } from "~/trpc/react";

export function WaitlistForm() {
  const trpc = useTRPC();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [orgName, setOrgName] = useState("");
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
            signup_type: orgName.trim() ? "organization" : "individual",
          });
          setFirstName("");
          setLastName("");
          setEmail("");
          setCity("");
          setOrgName("");
        }
      },
    }),
  );

  const canSubmit =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    email.trim().length > 0 &&
    city.trim().length > 0 &&
    !joinWaitlist.isPending;

  if (status === "joined") {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-amber-100 text-3xl">
          🎶
        </div>
        <div>
          <p className="text-lg font-semibold text-gray-900">
            You're on the list!
          </p>
          <p className="mt-1 text-sm text-gray-500">
            We'll reach out to {email} when Classica is ready for you.
          </p>
        </div>
      </div>
    );
  }

  const inputClass =
    "border border-gray-200 bg-white/70 backdrop-blur placeholder:text-gray-400 focus:border-amber-300 focus:ring-amber-200";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="waitlist-first" className="text-sm font-medium text-gray-700">
            First name
          </Label>
          <Input
            id="waitlist-first"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Anna"
            className={inputClass}
            autoComplete="given-name"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="waitlist-last" className="text-sm font-medium text-gray-700">
            Last name
          </Label>
          <Input
            id="waitlist-last"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Zhang"
            className={inputClass}
            autoComplete="family-name"
          />
        </div>
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
          className={inputClass}
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
          className={inputClass}
          autoComplete="address-level2"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="waitlist-org" className="text-sm font-medium text-gray-700">
          Organization name{" "}
          <span className="font-normal text-gray-400">(Optional)</span>
        </Label>
        <Input
          id="waitlist-org"
          value={orgName}
          onChange={(e) => setOrgName(e.target.value)}
          placeholder="Your organization or ensemble"
          className={inputClass}
          autoComplete="organization"
        />
      </div>

      <div className="pt-1">
        <Button
          className={cn("w-full", !canSubmit && "opacity-50")}
          disabled={!canSubmit}
          onClick={() =>
            joinWaitlist.mutate({
              name: orgName.trim()
                ? `${firstName.trim()} ${lastName.trim()} (${orgName.trim()})`
                : `${firstName.trim()} ${lastName.trim()}`,
              email: email.trim().toLowerCase(),
              city: city.trim(),
              signupType: orgName.trim() ? "organization" : "individual",
              source: "web",
            })
          }
        >
          {joinWaitlist.isPending ? "Joining..." : "Join Waitlist"}
        </Button>
      </div>

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
