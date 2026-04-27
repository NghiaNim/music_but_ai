import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { asc, eq } from "@acme/db";
import { db } from "@acme/db/client";
import { Event } from "@acme/db/schema";

import { env } from "~/env";

const ADMIN_COOKIE = "admin_auth";

const DIFFICULTIES = ["beginner", "intermediate", "advanced"] as const;
const GENRES = [
  "orchestral",
  "opera",
  "chamber",
  "solo_recital",
  "choral",
  "ballet",
  "jazz",
] as const;

function getFormString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function isDifficulty(value: string): value is (typeof DIFFICULTIES)[number] {
  return DIFFICULTIES.includes(value as (typeof DIFFICULTIES)[number]);
}

function isGenre(value: string): value is (typeof GENRES)[number] {
  return GENRES.includes(value as (typeof GENRES)[number]);
}

function adminToken(password: string) {
  return createHash("sha256").update(password).digest("hex");
}

async function isAdminAuthenticated() {
  const password = env.ADMIN_PASSWORD;
  if (!password) return false;
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  return token === adminToken(password);
}

async function authenticateAdmin(formData: FormData) {
  "use server";

  const password = env.ADMIN_PASSWORD;
  const inputPassword = getFormString(formData, "password");

  if (!password || inputPassword !== password) {
    redirect("/admin?error=invalid");
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, adminToken(password), {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });

  redirect("/admin");
}

async function logoutAdmin() {
  "use server";
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE);
  redirect("/admin");
}

async function updateEvent(formData: FormData) {
  "use server";

  if (!(await isAdminAuthenticated())) redirect("/admin");

  const eventId = getFormString(formData, "eventId");
  const title = getFormString(formData, "title").trim();
  const venue = getFormString(formData, "venue").trim();
  const difficulty = getFormString(formData, "difficulty");
  const genre = getFormString(formData, "genre");
  const dateRaw = getFormString(formData, "date");

  if (!eventId || !title || !venue || !dateRaw) return;
  if (!isDifficulty(difficulty)) return;
  if (!isGenre(genre)) return;

  const parsedDate = new Date(dateRaw);
  if (Number.isNaN(parsedDate.getTime())) return;

  await db
    .update(Event)
    .set({
      title,
      venue,
      difficulty: difficulty,
      genre: genre,
      date: parsedDate,
    })
    .where(eq(Event.id, eventId));

  redirect("/admin");
}

async function deleteEvent(formData: FormData) {
  "use server";

  if (!(await isAdminAuthenticated())) redirect("/admin");

  const eventId = getFormString(formData, "eventId");
  if (!eventId) return;

  await db.delete(Event).where(eq(Event.id, eventId));
  redirect("/admin");
}

export default async function AdminPage(props: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const passwordConfigured = !!env.ADMIN_PASSWORD;
  const authenticated = await isAdminAuthenticated();
  const searchParams = await props.searchParams;

  if (!passwordConfigured) {
    return (
      <main className="mx-auto max-w-lg px-4 py-10">
        <h1 className="text-xl font-semibold">Admin</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          `ADMIN_PASSWORD` is not configured.
        </p>
      </main>
    );
  }

  if (!authenticated) {
    return (
      <main className="mx-auto max-w-lg px-4 py-10">
        <h1 className="text-xl font-semibold">Admin Sign In</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Enter the admin password to manage events.
        </p>
        {searchParams?.error === "invalid" && (
          <p className="mt-3 text-sm text-red-600">Invalid password.</p>
        )}
        <form action={authenticateAdmin} className="mt-6 space-y-3">
          <input
            name="password"
            type="password"
            required
            className="w-full rounded-md border px-3 py-2 text-sm"
            placeholder="Admin password"
          />
          <button
            type="submit"
            className="rounded-md bg-black px-4 py-2 text-sm text-white dark:bg-white dark:text-black"
          >
            Continue
          </button>
        </form>
      </main>
    );
  }

  const events = await db.query.Event.findMany({
    orderBy: [asc(Event.date)],
    limit: 200,
  });

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Admin Events</h1>
        <form action={logoutAdmin}>
          <button
            type="submit"
            className="rounded-md border px-3 py-1.5 text-sm"
          >
            Logout
          </button>
        </form>
      </div>

      <div className="space-y-4">
        {events.map((event) => (
          <div key={event.id} className="rounded-lg border p-4">
            <form action={updateEvent} className="grid gap-3">
              <input type="hidden" name="eventId" value={event.id} />

              <label className="grid gap-1 text-sm">
                <span>Title</span>
                <input
                  name="title"
                  defaultValue={event.title}
                  required
                  className="rounded-md border px-3 py-2"
                />
              </label>

              <label className="grid gap-1 text-sm">
                <span>Date</span>
                <input
                  name="date"
                  type="datetime-local"
                  required
                  defaultValue={new Date(event.date).toISOString().slice(0, 16)}
                  className="rounded-md border px-3 py-2"
                />
              </label>

              <label className="grid gap-1 text-sm">
                <span>Venue</span>
                <input
                  name="venue"
                  defaultValue={event.venue}
                  required
                  className="rounded-md border px-3 py-2"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="grid gap-1 text-sm">
                  <span>Difficulty</span>
                  <select
                    name="difficulty"
                    defaultValue={event.difficulty}
                    className="rounded-md border px-3 py-2"
                  >
                    {DIFFICULTIES.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-1 text-sm">
                  <span>Genre</span>
                  <select
                    name="genre"
                    defaultValue={event.genre}
                    className="rounded-md border px-3 py-2"
                  >
                    {GENRES.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  className="rounded-md bg-black px-4 py-2 text-sm text-white dark:bg-white dark:text-black"
                >
                  Save Changes
                </button>
              </div>
            </form>

            <form action={deleteEvent} className="mt-2">
              <input type="hidden" name="eventId" value={event.id} />
              <button
                type="submit"
                className="rounded-md border border-red-500 px-4 py-2 text-sm text-red-600"
              >
                Delete Event
              </button>
            </form>
          </div>
        ))}
      </div>
    </main>
  );
}
