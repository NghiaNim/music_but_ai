"use client";

import { useEffect, useState } from "react";

import { Button } from "@acme/ui/button";
import { Input } from "@acme/ui/input";

export function OnboardingModal() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  useEffect(() => {
    if (!localStorage.getItem("user_name")) {
      setOpen(true);
    }
  }, []);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    localStorage.setItem("user_name", trimmed);
    setOpen(false);
    window.dispatchEvent(new Event("user_name_changed"));
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card mx-6 w-full max-w-sm rounded-2xl border p-6 shadow-xl">
        <div className="mb-1 text-center text-3xl">🎵</div>
        <h2 className="text-center text-xl font-bold tracking-tight">
          Welcome to Classical Music Connect
        </h2>
        <p className="text-muted-foreground mt-2 text-center text-sm">
          What should we call you?
        </p>
        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3">
          <Input
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            className="text-center"
          />
          <Button type="submit" disabled={!name.trim()}>
            Get Started
          </Button>
        </form>
      </div>
    </div>
  );
}

export function Greeting() {
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    setName(localStorage.getItem("user_name"));

    const handler = () => setName(localStorage.getItem("user_name"));
    window.addEventListener("user_name_changed", handler);
    return () => window.removeEventListener("user_name_changed", handler);
  }, []);

  return (
    <p className="text-primary mb-1 text-xs font-semibold tracking-widest uppercase">
      {name ? `Welcome back, ${name}` : "Welcome"}
    </p>
  );
}
