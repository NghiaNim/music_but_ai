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

/** One outer card wraps the entire form (fields stack inside with spacing). */
const FORM_CARD =
  "rounded-2xl border border-[#EFE9F4] bg-[#ffffff] p-4 shadow-sm sm:p-5";

const SECTION = "flex flex-col gap-1.5";

const CONTROL =
  "border-[#EFE9F4] bg-[#ffffff] shadow-none focus-visible:border-primary/40 dark:bg-[#ffffff]";

const SELECT_CONTROL = `${CONTROL} focus-visible:border-ring focus-visible:ring-ring/50 h-10 w-full rounded-md border px-3 text-sm focus-visible:ring-[3px] focus-visible:outline-none`;

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

type Genre = (typeof GENRES)[number]["value"];
type Difficulty = (typeof DIFFICULTIES)[number]["value"];

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

const TIME_OPTIONS = Array.from({ length: 24 * 4 }, (_, index) => {
  const totalMinutes = index * 15;
  const hour24 = Math.floor(totalMinutes / 60);
  const minute = String(totalMinutes % 60).padStart(2, "0");
  const period = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return {
    value: `${String(hour24).padStart(2, "0")}:${minute}`,
    label: `${hour12}:${minute} ${period}`,
  };
});

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
      imageUrl: event.imageUrl ?? "",
      ticketUrl: event.ticketUrl ?? "",
      isFree: event.isFree,
      price: event.isFree ? "" : (event.discountedPriceCents / 100).toFixed(2),
    };
  }, [event]);

  const [title, setTitle] = useState(initial.title);
  const [date, setDate] = useState(initial.date);
  const [venue, setVenue] = useState(initial.venue);
  const [venueAddress, setVenueAddress] = useState(initial.venueAddress);
  const [program, setProgram] = useState(initial.program);
  const [description, setDescription] = useState(initial.description);
  const [genre, setGenre] = useState<Genre>(initial.genre);
  const [difficulty, setDifficulty] = useState<Difficulty>(initial.difficulty);
  const [imageUrl, setImageUrl] = useState(initial.imageUrl);
  const [ticketUrl, setTicketUrl] = useState(initial.ticketUrl);
  const [isFree, setIsFree] = useState(initial.isFree);
  const [price, setPrice] = useState(initial.price);
  const [notifySubscribers, setNotifySubscribers] = useState(false);
  const imageFileInputRef = useRef<HTMLInputElement>(null);
  const [selectedTime, setSelectedTime] = useState(initial.time || "19:00");

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

    if (!title || !date || !venue || !program || !description) {
      toast.error("Please fill in all required fields");
      return;
    }

    const eventDate = new Date(`${date}T${selectedTime}`);

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
      listingCategory: event?.listingCategory ?? "local",
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
        <div className={FORM_CARD}>
          <div className="flex flex-col gap-6">
            <div className={SECTION}>
              <input
                ref={imageFileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="sr-only"
                onChange={handleImageFile}
              />
              <div className="mx-auto w-full max-w-[18rem]">
                <button
                  type="button"
                  onClick={() => imageFileInputRef.current?.click()}
                  className="relative aspect-square w-full overflow-hidden rounded-2xl border border-dashed border-[#EFE9F4] bg-[#FFFEF8] text-center shadow-none transition-colors hover:bg-amber-50/35 active:bg-amber-50/50"
                >
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="288px"
                      unoptimized
                    />
                  ) : (
                    <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 py-6">
                      <span className="text-muted-foreground text-4xl leading-none">
                        +
                      </span>
                      <span className="text-sm font-medium">
                        Upload a poster or photo
                      </span>
                      <span className="text-muted-foreground max-w-[240px] text-xs">
                        Tap to choose — PNG, JPG, or WebP, up to 2 MB
                      </span>
                    </span>
                  )}
                </button>
              </div>
              {imageUrl ? (
                <button
                  type="button"
                  onClick={clearImage}
                  className="text-muted-foreground self-start text-xs font-medium underline-offset-2 hover:underline"
                >
                  Remove image
                </button>
              ) : null}
            </div>

            <div className={SECTION}>
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
              <div className={SECTION}>
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
              <div className={SECTION}>
                <Label>Time *</Label>
                <select
                  aria-label="Time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className={SELECT_CONTROL}
                >
                  {TIME_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className={SECTION}>
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

            <div className={SECTION}>
              <Label htmlFor="venueAddress">Venue Address</Label>
              <Input
                id="venueAddress"
                placeholder="e.g. 154 W 57th St, New York, NY"
                value={venueAddress}
                onChange={(e) => setVenueAddress(e.target.value)}
                className={CONTROL}
              />
            </div>

            <div className={SECTION}>
              <Label htmlFor="genre">Genre *</Label>
              <select
                id="genre"
                value={genre}
                onChange={(e) => setGenre(e.target.value as Genre)}
                className={SELECT_CONTROL}
              >
                {GENRES.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>

            <div className={SECTION}>
              <Label htmlFor="difficulty">Audience Level *</Label>
              <select
                id="difficulty"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                className={SELECT_CONTROL}
              >
                {DIFFICULTIES.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>

            <div className={SECTION}>
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

            <div className={SECTION}>
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

            <div className="flex flex-col gap-2">
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

            <div className={SECTION}>
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
              <label className="flex cursor-pointer flex-row items-start gap-3 rounded-lg border border-[#EFE9F4] bg-[#faf8fc] p-3 text-sm">
                <input
                  type="checkbox"
                  checked={notifySubscribers}
                  onChange={(e) => setNotifySubscribers(e.target.checked)}
                  className="mt-1"
                />
                <span>
                  Email people who saved this event or completed a ticket
                  purchase when I save changes
                </span>
              </label>
            ) : null}
          </div>
        </div>

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
