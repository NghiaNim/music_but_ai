"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { Button } from "@acme/ui/button";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";

import { useTRPC } from "~/trpc/react";

const GENRE_OPTIONS = [
  { value: "orchestral", label: "Orchestral" },
  { value: "opera", label: "Opera" },
  { value: "chamber", label: "Chamber" },
  { value: "solo_recital", label: "Solo Recital" },
  { value: "choral", label: "Choral" },
  { value: "ballet", label: "Ballet" },
] as const;

const DIFFICULTY_OPTIONS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
] as const;

export default function PostEventPage() {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [venue, setVenue] = useState("");
  const [venueAddress, setVenueAddress] = useState("");
  const [program, setProgram] = useState("");
  const [description, setDescription] = useState("");
  const [genre, setGenre] = useState<string>("orchestral");
  const [difficulty, setDifficulty] = useState<string>("beginner");
  const [ticketUrl, setTicketUrl] = useState("");

  const createEvent = useMutation(
    trpc.event.create.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(trpc.event.pathFilter());
        router.push("/events");
      },
    }),
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createEvent.mutate({
      title,
      date: new Date(date),
      venue,
      venueAddress: venueAddress || undefined,
      program,
      description,
      genre: genre as
        | "orchestral"
        | "opera"
        | "chamber"
        | "solo_recital"
        | "choral"
        | "ballet",
      difficulty: difficulty as "beginner" | "intermediate" | "advanced",
      ticketUrl: ticketUrl || undefined,
    });
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <h1 className="mb-1 text-2xl font-bold tracking-tight">Post Event</h1>
      <p className="text-muted-foreground mb-6 text-sm">
        Share a concert or recital with the community
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="title">Event Title</Label>
          <Input
            id="title"
            placeholder="e.g. Beethoven Symphony No. 9"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="date">Date & Time</Label>
          <Input
            id="date"
            type="datetime-local"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="venue">Venue</Label>
          <Input
            id="venue"
            placeholder="e.g. Carnegie Hall"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="venueAddress">Venue Address (optional)</Label>
          <Input
            id="venueAddress"
            placeholder="e.g. 881 7th Ave, New York, NY"
            value={venueAddress}
            onChange={(e) => setVenueAddress(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="genre">Genre</Label>
            <select
              id="genre"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="bg-card text-foreground h-9 rounded-md border px-3 text-sm"
            >
              {GENRE_OPTIONS.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="difficulty">Difficulty</Label>
            <select
              id="difficulty"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="bg-card text-foreground h-9 rounded-md border px-3 text-sm"
            >
              {DIFFICULTY_OPTIONS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="program">Program</Label>
          <textarea
            id="program"
            placeholder="List the pieces being performed..."
            value={program}
            onChange={(e) => setProgram(e.target.value)}
            required
            rows={3}
            className="bg-card text-foreground placeholder:text-muted-foreground rounded-md border px-3 py-2 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            placeholder="Tell people about this event..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={3}
            className="bg-card text-foreground placeholder:text-muted-foreground rounded-md border px-3 py-2 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ticketUrl">Ticket URL (optional)</Label>
          <Input
            id="ticketUrl"
            type="url"
            placeholder="https://..."
            value={ticketUrl}
            onChange={(e) => setTicketUrl(e.target.value)}
          />
        </div>

        <Button
          type="submit"
          className="mt-2 w-full"
          disabled={createEvent.isPending}
        >
          {createEvent.isPending ? "Posting..." : "Post Event"}
        </Button>

        {createEvent.isError && (
          <p className="text-sm text-red-500">{createEvent.error.message}</p>
        )}
      </form>
    </div>
  );
}
