"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";

import { Button } from "@acme/ui/button";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { toast } from "@acme/ui/toast";

import { useTRPC } from "~/trpc/react";

const GENRES = [
  { value: "solo_recital", label: "Solo Recital" },
  { value: "chamber", label: "Chamber Music" },
  { value: "orchestral", label: "Orchestral" },
  { value: "opera", label: "Opera" },
  { value: "choral", label: "Choral" },
  { value: "ballet", label: "Ballet" },
] as const;

const DIFFICULTIES = [
  { value: "beginner", label: "Beginner Friendly" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
] as const;

type Genre = (typeof GENRES)[number]["value"];
type Difficulty = (typeof DIFFICULTIES)[number]["value"];

export function PostEventForm() {
  const router = useRouter();
  const trpc = useTRPC();

  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [venue, setVenue] = useState("");
  const [venueAddress, setVenueAddress] = useState("");
  const [program, setProgram] = useState("");
  const [description, setDescription] = useState("");
  const [genre, setGenre] = useState<Genre>("solo_recital");
  const [difficulty, setDifficulty] = useState<Difficulty>("beginner");
  const [imageUrl, setImageUrl] = useState("");
  const [ticketUrl, setTicketUrl] = useState("");

  const createEvent = useMutation(
    trpc.event.create.mutationOptions({
      onSuccess: () => {
        toast.success("Event posted successfully!");
        router.push("/events");
      },
      onError: (err) => {
        if (err.data?.code === "UNAUTHORIZED") {
          toast.error("Please sign in to post an event");
          return;
        }
        toast.error(err.message || "Failed to post event");
      },
    }),
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!title || !date || !time || !venue || !program || !description) {
      toast.error("Please fill in all required fields");
      return;
    }

    const eventDate = new Date(`${date}T${time}`);

    createEvent.mutate({
      title,
      date: eventDate,
      venue,
      venueAddress: venueAddress || undefined,
      program,
      description,
      genre,
      difficulty,
      imageUrl: imageUrl || undefined,
      ticketUrl: ticketUrl || undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="title">Event Title *</Label>
        <Input
          id="title"
          placeholder="e.g. Senior Piano Recital"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={512}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="date">Date *</Label>
          <Input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="time">Time *</Label>
          <Input
            id="time"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="venue">Venue *</Label>
        <Input
          id="venue"
          placeholder="e.g. Weill Recital Hall"
          value={venue}
          onChange={(e) => setVenue(e.target.value)}
          required
          maxLength={512}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="venueAddress">Venue Address</Label>
        <Input
          id="venueAddress"
          placeholder="e.g. 154 W 57th St, New York, NY"
          value={venueAddress}
          onChange={(e) => setVenueAddress(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="genre">Genre *</Label>
        <select
          id="genre"
          value={genre}
          onChange={(e) => setGenre(e.target.value as Genre)}
          className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none"
        >
          {GENRES.map((g) => (
            <option key={g.value} value={g.value}>
              {g.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="difficulty">Audience Level *</Label>
        <select
          id="difficulty"
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value as Difficulty)}
          className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none"
        >
          {DIFFICULTIES.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="program">Program *</Label>
        <textarea
          id="program"
          placeholder={"e.g.\nBeethoven - Piano Sonata No. 14 \"Moonlight\"\nChopin - Ballade No. 1 in G minor"}
          value={program}
          onChange={(e) => setProgram(e.target.value)}
          required
          rows={4}
          className="border-input bg-background placeholder:text-muted-foreground w-full rounded-md border px-3 py-2 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Description *</Label>
        <textarea
          id="description"
          placeholder="Tell attendees about this event — what to expect, any special notes..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows={4}
          className="border-input bg-background placeholder:text-muted-foreground w-full rounded-md border px-3 py-2 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="imageUrl">Image URL</Label>
        <Input
          id="imageUrl"
          type="url"
          placeholder="https://..."
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
        />
        <p className="text-muted-foreground text-xs">
          A poster or photo for your event
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="ticketUrl">Ticket / RSVP Link</Label>
        <Input
          id="ticketUrl"
          type="url"
          placeholder="https://..."
          value={ticketUrl}
          onChange={(e) => setTicketUrl(e.target.value)}
        />
        <p className="text-muted-foreground text-xs">
          External link where people can get tickets or RSVP
        </p>
      </div>

      <Button
        type="submit"
        size="lg"
        className="mt-2 w-full"
        disabled={createEvent.isPending}
      >
        {createEvent.isPending ? (
          <span className="flex items-center gap-2">
            <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Posting...
          </span>
        ) : (
          "Post Event"
        )}
      </Button>
    </form>
  );
}
