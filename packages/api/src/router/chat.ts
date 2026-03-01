import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import { z } from "zod/v4";

import type { EventContext } from "@acme/ai";
import { streamDiscoveryResponse, streamLearningResponse } from "@acme/ai";
import { desc, eq } from "@acme/db";
import { ChatMessage, ChatSession, Event, UserProfile } from "@acme/db/schema";

import { protectedProcedure, publicProcedure } from "../trpc";

function eventToContext(event: typeof Event.$inferSelect): EventContext {
  return {
    id: event.id,
    title: event.title,
    date:
      event.date instanceof Date
        ? event.date.toISOString()
        : String(event.date),
    venue: event.venue,
    program: event.program,
    description: event.description,
    difficulty: event.difficulty,
    genre: event.genre,
    beginnerNotes: event.beginnerNotes,
    originalPriceCents: event.originalPriceCents,
    discountedPriceCents: event.discountedPriceCents,
    ticketsAvailable: event.ticketsAvailable,
  };
}

export const chatRouter = {
  sessions: protectedProcedure.query(({ ctx }) => {
    return ctx.db.query.ChatSession.findMany({
      where: eq(ChatSession.userId, ctx.session.user.id),
      with: { event: true },
      orderBy: desc(ChatSession.createdAt),
      limit: 20,
    });
  }),

  messages: protectedProcedure
    .input(z.object({ sessionId: z.string().uuid() }))
    .query(({ ctx, input }) => {
      return ctx.db.query.ChatMessage.findMany({
        where: eq(ChatMessage.sessionId, input.sessionId),
        orderBy: ChatMessage.createdAt,
      });
    }),

  send: publicProcedure
    .input(
      z.object({
        sessionId: z.string().uuid().optional(),
        eventId: z.string().uuid().optional(),
        mode: z.enum(["discovery", "learning"]),
        content: z.string().min(1).max(4000),
        history: z
          .array(
            z.object({
              role: z.enum(["user", "assistant"]),
              content: z.string(),
            }),
          )
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "OPENAI_API_KEY is not configured on the server",
        });
      }

      const session = ctx.session;
      const user = session?.user;
      const isAuthenticated = !!user;
      let sessionId = input.sessionId;

      if (user) {
        if (!sessionId) {
          const [newSession] = await ctx.db
            .insert(ChatSession)
            .values({
              userId: user.id,
              eventId: input.eventId ?? null,
              mode: input.mode,
            })
            .returning();
          if (!newSession) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to create chat session",
            });
          }
          sessionId = newSession.id;
        }

        await ctx.db.insert(ChatMessage).values({
          sessionId,
          role: "user",
          content: input.content,
        });
      }

      const messages: { role: "user" | "assistant"; content: string }[] = [];

      if (isAuthenticated && sessionId) {
        const history = await ctx.db.query.ChatMessage.findMany({
          where: eq(ChatMessage.sessionId, sessionId),
          orderBy: ChatMessage.createdAt,
        });
        messages.push(
          ...history.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        );
      } else {
        if (input.history) {
          messages.push(...input.history);
        }
        messages.push({ role: "user", content: input.content });
      }

      let userExperience = "new";
      if (user) {
        const profile = await ctx.db.query.UserProfile.findFirst({
          where: eq(UserProfile.userId, user.id),
        });
        userExperience = profile?.experienceLevel ?? "new";
      }

      let fullResponse = "";

      try {
        if (input.mode === "discovery") {
          const events = await ctx.db.query.Event.findMany({ limit: 50 });
          const eventContexts = events.map(eventToContext);

          for await (const chunk of streamDiscoveryResponse({
            messages,
            events: eventContexts,
            userExperience,
            apiKey,
          })) {
            fullResponse += chunk;
          }
        } else {
          if (!input.eventId) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Learning mode requires an eventId",
            });
          }
          const event = await ctx.db.query.Event.findFirst({
            where: eq(Event.id, input.eventId),
          });
          if (!event) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Event not found",
            });
          }

          for await (const chunk of streamLearningResponse({
            messages,
            event: eventToContext(event),
            userExperience,
            apiKey,
          })) {
            fullResponse += chunk;
          }
        }
      } catch (err) {
        if (err instanceof TRPCError) throw err;
        const errMsg = err instanceof Error ? err.message : "AI request failed";
        console.error("[chat.send] OpenAI error:", errMsg);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `AI concierge error: ${errMsg}`,
        });
      }

      if (isAuthenticated && sessionId) {
        await ctx.db.insert(ChatMessage).values({
          sessionId,
          role: "assistant",
          content: fullResponse,
        });
      }

      return { sessionId: sessionId ?? null, response: fullResponse };
    }),
} satisfies TRPCRouterRecord;
