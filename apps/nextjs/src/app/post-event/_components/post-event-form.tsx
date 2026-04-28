"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";

import type { RouterOutputs } from "@acme/api";
import { cn } from "@acme/ui";
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
  { value: "jazz", label: "Jazz" },
] as const;

const DIFFICULTIES = [
  { value: "beginner", label: "Beginner Friendly" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
] as const;

const LISTING = [
  {
    value: "local" as const,
    label: "Local / community",
    hint: "House concerts, reading groups, meetups, and other informal gatherings.",
  },
  {
    value: "concert" as const,
    label: "Concert",
    hint: "Formal performances, recitals, and ticketed shows.",
  },
];

const FIELD_CARD =
  "flex flex-col gap-1.5 rounded-2xl border border-[#EFE9F4] bg-[#ffffff] p-3 shadow-sm";

const CONTROL =
  "border-[#EFE9F4] bg-[#ffffff] shadow-none focus-visible:border-primary/40 dark:bg-[#ffffff]";

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

type Genre = (typeof GENRES)[number]["value"];
type Difficulty = (typeof DIFFICULTIES)[number]["value"];
type Listing = (typeof LISTING)[number]["value"];

type EventRow = NonNullable<RouterOutputs["event"]["byId"]>;

function localDateTimeParts(d: Date) {
  const dt = new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  const hh = String(dt.getHours()).padStart(2, "0");
  const mm = String(dt.getMinutes()).padStart(2, "0");
  return { date: `${y}-${m}-${day}`, time: `${hh}:${mm}` };
}

export function PostEventForm({ isSignedIn }: { isSignedIn: boolean }) {
  return (
    <HostEventFormShell
      isSignedIn={isSignedIn}
      mode="create"
      event={undefined}
    />
  );
}

export function PostEventEditForm({ eventId }: { eventId: string }) {
  const trpc = useTRPC();
  const { data: event } = useSuspenseQuery(
    trpc.event.byId.queryOptions({ id: eventId }),
  );

  if (!event) {
    return (
      <p className="text-muted-foreground text-sm">
        This event could not be found.
      </p>
    );
  }

  if (event.publicationStatus === "cancelled") {
    return (
      <p className="text-muted-foreground text-sm">
        This event has been cancelled and can no longer be edited.
      </p>
    );
  }

  return <HostEventFormShell isSignedIn event={event} mode="edit" />;
}

function HostEventFormShell({
  isSignedIn,
  mode,
  event,
}: {
  isSignedIn: boolean;
  mode: "create" | "edit";
  event: EventRow | undefined;
}) {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const initial = useMemo(() => {
    if (!event) {
      return {
        title: "",
        date: "",
        time: "",
        venue: "",
        venueAddress: "",
        program: "",
        description: "",
        genre: "solo_recital" as Genre,
        difficulty: "beginner" as Difficulty,
        listingCategory: "local" as Listing,
        imageUrl: "",
        ticketUrl: "",
        isFree: true,
        price: "",
      };
    }
    const { date, time } = localDateTimeParts(new Date(event.date));
    return {
      title: event.title,
      date,
      time,
      venue: event.venue,
      venueAddress: event.venueAddress ?? "",
      program: event.program,
      description: event.description,
      genre: event.genre,
      difficulty: event.difficulty,
      listingCategory: event.listingCategory,
      imageUrl: event.imageUrl ?? "",
      ticketUrl: event.ticketUrl ?? "",
      isFree: event.isFree,
      price: event.isFree ? "" : (event.discountedPriceCents / 100).toFixed(2),
    };
  }, [event]);

  const [title, setTitle] = useState(initial.title);
  const [date, setDate] = useState(initial.date);
  const [time, setTime] = useState(initial.time);
  const [venue, setVenue] = useState(initial.venue);
  const [venueAddress, setVenueAddress] = useState(initial.venueAddress);
  const [program, setProgram] = useState(initial.program);
  const [description, setDescription] = useState(initial.description);
  const [genre, setGenre] = useState<Genre>(initial.genre);
  const [difficulty, setDifficulty] = useState<Difficulty>(initial.difficulty);
  const [listingCategory, setListingCategory] = useState<Listing>(
    initial.listingCategory,
  );
  const [imageUrl, setImageUrl] = useState(initial.imageUrl);
  const [ticketUrl, setTicketUrl] = useState(initial.ticketUrl);
  const [isFree, setIsFree] = useState(initial.isFree);
  const [price, setPrice] = useState(initial.price);
  const [notifySubscribers, setNotifySubscribers] = useState(false);
  const imageFileInputRef = useRef<HTMLInputElement>(null);

  const createEvent = useMutation(
    trpc.event.create.mutationOptions({
      onSuccess: async () => {
        toast.success("Event posted successfully!");
        await queryClient.invalidateQueries(trpc.event.pathFilter());
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

  const updateEvent = useMutation(
    trpc.event.update.mutationOptions({
      onSuccess: async () => {
        toast.success("Event updated");
        await queryClient.invalidateQueries(trpc.event.pathFilter());
        router.push("/events");
      },
      onError: (err) => {
        toast.error(err.message || "Failed to update event");
      },
    }),
  );

  const cancelEvent = useMutation(
    trpc.event.cancel.mutationOptions({
      onSuccess: async (data) => {
        toast.success(
          data.emailed > 0
            ? `Event cancelled · emailed ${data.emailed} subscriber(s)`
            : "Event cancelled",
        );
        await queryClient.invalidateQueries(trpc.event.pathFilter());
        router.push("/post-event");
      },
      onError: (err) => {
        toast.error(err.message || "Could not cancel event");
      },
    }),
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!isSignedIn) {
      toast.error("Please sign in to post an event");
      return;
    }

    if (!title || !date || !time || !venue || !program || !description) {
      toast.error("Please fill in all required fields");
      return;
    }

    const eventDate = new Date(`${date}T${time}`);

    let priceCents: number | undefined;
    if (!isFree) {
      const parsed = Number(price);
      if (!Number.isFinite(parsed) || parsed < 0) {
        toast.error("Enter a valid ticket price, or mark the event as free");
        return;
      }
      priceCents = Math.round(parsed * 100);
    }

    const payload = {
      title,
      date: eventDate,
      venue,
      venueAddress: venueAddress || undefined,
      program,
      description,
      genre,
      difficulty,
      listingCategory,
      imageUrl: imageUrl || undefined,
      ticketUrl: ticketUrl || undefined,
      isFree,
      priceCents,
    };

    if (mode === "create") {
      createEvent.mutate(payload);
    } else if (event) {
      updateEvent.mutate({
        ...payload,
        eventId: event.id,
        notifySubscribers,
      });
    }
  }

  const busy = createEvent.isPending || updateEvent.isPending;

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file (PNG, JPG, or WebP).");
      e.target.value = "";
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error("Image must be 2 MB or smaller.");
      e.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") setImageUrl(result);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const clearImage = () => {
    setImageUrl("");
    if (imageFileInputRef.current) imageFileInputRef.current.value = "";
  };

  return (
    <div className="relative">
      {!isSignedIn && (
        <div className="bg-background/80 absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 px-4 py-6 backdrop-blur-md">
          <p className="text-center text-sm font-medium">
            Sign in to post an event
          </p>
          <Button asChild size="sm">
            <a href="/sign-in?callbackUrl=%2Fpost-event">Sign in</a>
          </Button>
        </div>
      )}
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-5 sm:gap-6"
        aria-disabled={!isSignedIn}
      >
        <div className={FIELD_CARD}>
          <Label>Event image</Label>
          <input
            ref={imageFileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="sr-only"
            onChange={handleImageFile}
          />
          <button
            type="button"
            onClick={() => imageFileInputRef.current?.click()}
            className="flex min-h-[152px] w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[#EFE9F4] bg-[#ffffff] px-4 py-7 text-center transition-colors hover:bg-rose-50/40 active:bg-rose-50/50"
          >
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt=""
                width={200}
                height={160}
                className="max-h-40 w-auto rounded-md object-cover"
                unoptimized
              />
            ) : (
              <>
                <span className="text-muted-foreground text-3xl leading-none">
                  +
                </span>
                <span className="text-sm font-medium">
                  Upload a poster or photo
                </span>
                <span className="text-muted-foreground max-w-[240px] text-xs">
                  Tap to choose an image — PNG, JPG, or WebP, up to 2 MB
                </span>
              </>
            )}
          </button>
          {imageUrl ? (
            <button
              type="button"
              onClick={clearImage}
              className="text-muted-foreground self-start text-xs font-medium underline-offset-2 hover:underline"
            >
              Remove image
            </button>
          ) : null}
          <p className="text-muted-foreground text-xs">
            Shown on your listing card in Events.
          </p>
        </div>

        <div className={FIELD_CARD}>
          <Label htmlFor="title">Event Title *</Label>
          <Input
            id="title"
            placeholder="e.g. Senior Piano Recital"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={512}
            className={CONTROL}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className={FIELD_CARD}>
            <Label htmlFor="date">Date *</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className={CONTROL}
            />
          </div>
          <div className={FIELD_CARD}>
            <Label htmlFor="time">Time *</Label>
            <Input
              id="time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
              className={CONTROL}
            />
          </div>
        </div>

        <div className={FIELD_CARD}>
          <Label htmlFor="venue">Venue *</Label>
          <Input
            id="venue"
            placeholder="e.g. Weill Recital Hall"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            required
            maxLength={512}
            className={CONTROL}
          />
        </div>

        <div className={FIELD_CARD}>
          <Label htmlFor="venueAddress">Venue Address</Label>
          <Input
            id="venueAddress"
            placeholder="e.g. 154 W 57th St, New York, NY"
            value={venueAddress}
            onChange={(e) => setVenueAddress(e.target.value)}
            className={CONTROL}
          />
        </div>

        <div className={FIELD_CARD}>
          <Label>Listing type *</Label>
          <div className="flex flex-col gap-2 pt-0.5">
            {LISTING.map((opt) => (
              <label
                key={opt.value}
                className="has-[:checked]:border-primary/50 flex cursor-pointer gap-2 rounded-lg border border-[#EFE9F4] bg-[#ffffff] p-3 text-sm"
              >
                <input
                  type="radio"
                  name="listingCategory"
                  value={opt.value}
                  checked={listingCategory === opt.value}
                  onChange={() => setListingCategory(opt.value)}
                  className="mt-1"
                />
                <span>
                  <span className="font-medium">{opt.label}</span>
                  <span className="text-muted-foreground block text-xs">
                    {opt.hint}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className={FIELD_CARD}>
          <Label htmlFor="genre">Genre *</Label>
          <select
            id="genre"
            value={genre}
            onChange={(e) => setGenre(e.target.value as Genre)}
            className={`${CONTROL} focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full rounded-md px-3 text-sm focus-visible:ring-[3px] focus-visible:outline-none`}
          >
            {GENRES.map((g) => (
              <option key={g.value} value={g.value}>
                {g.label}
              </option>
            ))}
          </select>
        </div>

        <div className={FIELD_CARD}>
          <Label htmlFor="difficulty">Audience Level *</Label>
          <select
            id="difficulty"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as Difficulty)}
            className={`${CONTROL} focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full rounded-md px-3 text-sm focus-visible:ring-[3px] focus-visible:outline-none`}
          >
            {DIFFICULTIES.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>

        <div className={FIELD_CARD}>
          <Label htmlFor="program">Program *</Label>
          <textarea
            id="program"
            placeholder={
              'e.g.\nBeethoven - Piano Sonata No. 14 "Moonlight"\nChopin - Ballade No. 1 in G minor'
            }
            value={program}
            onChange={(e) => setProgram(e.target.value)}
            required
            rows={4}
            className={`placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-[3px] focus-visible:outline-none ${CONTROL}`}
          />
        </div>

        <div className={FIELD_CARD}>
          <Label htmlFor="description">Description *</Label>
          <textarea
            id="description"
            placeholder="Tell attendees about this event — what to expect, any special notes..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={4}
            className={`placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-[3px] focus-visible:outline-none ${CONTROL}`}
          />
        </div>

        <div className={cn(FIELD_CARD, "gap-2")}>
          <Label className="text-sm font-medium">Tickets</Label>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isFree}
              onChange={(e) => setIsFree(e.target.checked)}
            />
            <span>This event is free</span>
          </label>
          {!isFree ? (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="price">Ticket price (USD) *</Label>
              <Input
                id="price"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                placeholder="e.g. 15.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                className={CONTROL}
              />
              <p className="text-muted-foreground text-xs">
                Attendees will pay this price through Classica checkout.
              </p>
            </div>
          ) : (
            <p className="text-muted-foreground text-xs">
              Attendees won't see a checkout button — just event details.
            </p>
          )}
        </div>

        <div className={FIELD_CARD}>
          <Label htmlFor="ticketUrl">Ticket / RSVP Link</Label>
          <Input
            id="ticketUrl"
            type="url"
            placeholder="https://..."
            value={ticketUrl}
            onChange={(e) => setTicketUrl(e.target.value)}
            className={CONTROL}
          />
          <p className="text-muted-foreground text-xs">
            External link where people can get tickets or RSVP
          </p>
        </div>

        {mode === "edit" && event ? (
          <label className="flex cursor-pointer flex-row items-start gap-3 rounded-xl border border-[#EFE9F4] bg-[#ffffff] p-3 text-sm">
            <input
              type="checkbox"
              checked={notifySubscribers}
              onChange={(e) => setNotifySubscribers(e.target.checked)}
              className="mt-1"
            />
            <span>
              Email people who saved this event or completed a ticket purchase
              when I save changes
            </span>
          </label>
        ) : null}

        <Button
          type="submit"
          size="lg"
          className="mt-1 h-12 w-full rounded-xl text-base shadow-sm sm:h-14"
          disabled={busy}
        >
          {busy ? (
            <span className="flex items-center gap-2">
              <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              {mode === "create" ? "Posting..." : "Saving..."}
            </span>
          ) : mode === "create" ? (
            "Post Event"
          ) : (
            "Save changes"
          )}
        </Button>

        {mode === "edit" && event ? (
          <div className="border-destructive/30 bg-destructive/5 rounded-xl border p-4">
            <p className="mb-2 text-sm font-medium text-red-900 dark:text-red-200">
              Cancel this event
            </p>
            <p className="text-muted-foreground mb-3 text-xs">
              Cancelling marks the event as inactive, removes it from the public
              list, and emails everyone who saved it or bought tickets through
              the app (when SendGrid is configured).
            </p>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={cancelEvent.isPending}
              onClick={() => {
                if (
                  !confirm("Cancel this event and notify subscribers by email?")
                )
                  return;
                cancelEvent.mutate({ eventId: event.id });
              }}
            >
              {cancelEvent.isPending ? "Cancelling…" : "Cancel event"}
            </Button>
          </div>
        ) : null}
      </form>
    </div>
  );
}
