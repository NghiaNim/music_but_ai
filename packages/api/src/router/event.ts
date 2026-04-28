import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod/v4";

import type { EventTasteAnnotation } from "@acme/db/schema";
import { inferEventTaste } from "@acme/ai";
import { and, asc, eq, gte, ilike, lte, or } from "@acme/db";
import { Event } from "@acme/db/schema";
import { EventFiltersSchema } from "@acme/validators";

import { emailsForEventInterest } from "../event-subscribers";
import { sendHostBroadcastEmails } from "../host-email";
import { protectedProcedure, publicProcedure } from "../trpc";

type Database = Parameters<typeof emailsForEventInterest>[0];

function isParseableUrl(value: string): boolean {
  try {
    // Supports https URLs and data:image/... URLs used by client uploads.
    // Avoid URL.canParse for wider TS/lib compatibility in CI.
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Best-effort taste tagger for a single user-posted event. Runs out
 * of band so the create/update mutation responds immediately.
 *
 * Defensive: any error here is logged and swallowed. Untagged events
 * still surface in feeds and recommendations (they just don't get
 * content-based score boosts) — and the catalog cron will pick them
 * up on its next run as a safety net.
 */
async function tagEventInBackground(
  database: Database,
  eventId: string,
  input: Parameters<typeof inferEventTaste>[0],
): Promise<void> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return;
  try {
    const taste: EventTasteAnnotation = await inferEventTaste(input, {
      apiKey,
    });
    await database.update(Event).set({ taste }).where(eq(Event.id, eventId));
  } catch (err) {
    console.warn(
      `[event.tag] failed for ${eventId}:`,
      err instanceof Error ? err.message : String(err),
    );
  }
}

const createFields = z.object({
  title: z.string().min(1).max(512),
  date: z.coerce.date(),
  venue: z.string().min(1).max(512),
  venueAddress: z.string().optional(),
  program: z.string().min(1),
  description: z.string().min(1),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  genre: z.enum([
    "orchestral",
    "opera",
    "chamber",
    "solo_recital",
    "choral",
    "ballet",
    "jazz",
  ]),
  listingCategory: z.enum(["local", "concert"]),
  /** HTTP(S) or `data:image/...;base64,...` from client-side upload. */
  imageUrl: z
    .string()
    .max(4_000_000)
    .optional()
    .refine((s) => !s || isParseableUrl(s), {
      message: "Invalid image URL",
    }),
  ticketUrl: z.string().url().optional(),
  isFree: z.boolean().default(false),
  priceCents: z.number().int().nonnegative().max(1_000_000).optional(),
});

function resolvePricing(input: { isFree: boolean; priceCents?: number }) {
  if (input.isFree) {
    return { isFree: true, originalPriceCents: 0, discountedPriceCents: 0 };
  }
  const cents = input.priceCents ?? 3500;
  return {
    isFree: false,
    originalPriceCents: cents,
    discountedPriceCents: cents,
  };
}

export const eventRouter = {
  all: publicProcedure.input(EventFiltersSchema).query(({ ctx, input }) => {
    const conditions = [eq(Event.publicationStatus, "active")];

    // Hide past events by default — callers can widen with an explicit dateFrom.
    conditions.push(gte(Event.date, input.dateFrom ?? new Date()));

    const searchCond = input.search
      ? or(
          ilike(Event.title, `%${input.search}%`),
          ilike(Event.venue, `%${input.search}%`),
          ilike(Event.program, `%${input.search}%`),
        )
      : undefined;
    if (searchCond) conditions.push(searchCond);
    if (input.genre) conditions.push(eq(Event.genre, input.genre));
    if (input.difficulty)
      conditions.push(eq(Event.difficulty, input.difficulty));
    if (input.listingCategory)
      conditions.push(eq(Event.listingCategory, input.listingCategory));
    if (input.dateTo) conditions.push(lte(Event.date, input.dateTo));

    return ctx.db.query.Event.findMany({
      where: and(...conditions),
      orderBy: [asc(Event.date)],
      limit: 100,
    });
  }),

  byId: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(({ ctx, input }) => {
      return ctx.db.query.Event.findFirst({
        where: eq(Event.id, input.id),
      });
    }),

  myHosted: protectedProcedure.query(({ ctx }) => {
    return ctx.db.query.Event.findMany({
      where: eq(Event.createdBy, ctx.session.user.id),
      orderBy: [asc(Event.date)],
    });
  }),

  create: protectedProcedure
    .input(createFields)
    .mutation(async ({ ctx, input }) => {
      const { isFree, priceCents, ...rest } = input;
      const pricing = resolvePricing({ isFree, priceCents });
      const inserted = await ctx.db
        .insert(Event)
        .values({
          ...rest,
          ...pricing,
          createdBy: ctx.session.user.id,
        })
        .returning();

      const newRow = inserted[0];
      if (newRow) {
        // Fire-and-forget — never block the create response on AI.
        void tagEventInBackground(ctx.db, newRow.id, {
          title: newRow.title,
          program: newRow.program,
          description: newRow.description,
          genre: newRow.genre,
          venueName: newRow.venue,
        });
      }

      return inserted;
    }),

  update: protectedProcedure
    .input(
      createFields.extend({
        eventId: z.string().uuid(),
        notifySubscribers: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.Event.findFirst({
        where: eq(Event.id, input.eventId),
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
      }
      if (existing.createdBy !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not your event" });
      }
      if (existing.publicationStatus === "cancelled") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cancelled events cannot be updated",
        });
      }

      const { eventId, notifySubscribers, isFree, priceCents, ...rest } = input;
      const pricing = resolvePricing({ isFree, priceCents });

      const [updated] = await ctx.db
        .update(Event)
        .set({ ...rest, ...pricing })
        .where(eq(Event.id, eventId))
        .returning();

      // Re-tag only if a field that influences the taste annotation
      // actually changed. Cheap textual diff — avoids spending tokens
      // on a date/image/price-only edit.
      const tasteFieldsChanged =
        existing.title !== rest.title ||
        existing.program !== rest.program ||
        existing.description !== rest.description ||
        existing.genre !== rest.genre ||
        existing.venue !== rest.venue;
      if (updated && tasteFieldsChanged) {
        void tagEventInBackground(ctx.db, updated.id, {
          title: updated.title,
          program: updated.program,
          description: updated.description,
          genre: updated.genre,
          venueName: updated.venue,
        });
      }

      if (notifySubscribers && updated) {
        const recipients = await emailsForEventInterest(ctx.db, eventId);
        if (recipients.length > 0) {
          try {
            await sendHostBroadcastEmails({
              recipients,
              subject: `Updated: ${updated.title}`,
              text: `The host has updated an event you follow on Classica.\n\nTitle: ${updated.title}\nWhen: ${new Date(updated.date).toLocaleString()}\nWhere: ${updated.venue}\n\nOpen the app for the latest details.`,
            });
          } catch (e) {
            throw new TRPCError({
              code: "PRECONDITION_FAILED",
              message:
                e instanceof Error
                  ? e.message
                  : "Email could not be sent; check SendGrid env vars",
            });
          }
        }
      }

      return updated;
    }),

  cancel: protectedProcedure
    .input(
      z.object({
        eventId: z.string().uuid(),
        message: z.string().max(2000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.Event.findFirst({
        where: eq(Event.id, input.eventId),
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
      }
      if (existing.createdBy !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not your event" });
      }
      if (existing.publicationStatus === "cancelled") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Event is already cancelled",
        });
      }

      const recipients = await emailsForEventInterest(ctx.db, input.eventId);
      const note = input.message?.trim()
        ? `\n\nMessage from the host:\n${input.message.trim()}`
        : "";

      if (recipients.length > 0) {
        try {
          await sendHostBroadcastEmails({
            recipients,
            subject: `Cancelled: ${existing.title}`,
            text: `The event "${existing.title}" on Classica has been cancelled by the host.${note}\n\nWe are sorry for the inconvenience.`,
          });
        } catch (e) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message:
              e instanceof Error
                ? e.message
                : "Email could not be sent; check SendGrid env vars",
          });
        }
      }

      await ctx.db
        .update(Event)
        .set({ publicationStatus: "cancelled" })
        .where(eq(Event.id, input.eventId));

      return { ok: true as const, emailed: recipients.length };
    }),
} satisfies TRPCRouterRecord;
