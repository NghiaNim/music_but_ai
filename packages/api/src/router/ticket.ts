import type { TRPCRouterRecord } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import Stripe from "stripe";
import { z } from "zod/v4";

import { desc, eq } from "@acme/db";
import { Event, TicketOrder } from "@acme/db/schema";

import { protectedProcedure } from "../trpc";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "STRIPE_SECRET_KEY is not configured",
    });
  }
  return new Stripe(key);
}

export const ticketRouter = {
  createCheckoutSession: protectedProcedure
    .input(
      z.object({
        eventId: z.string().uuid(),
        quantity: z.number().int().min(1).max(10).default(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const event = await ctx.db.query.Event.findFirst({
        where: eq(Event.id, input.eventId),
      });

      if (!event) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
      }

      if (event.ticketsAvailable < input.quantity) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Only ${event.ticketsAvailable} tickets remaining`,
        });
      }

      const totalCents = event.discountedPriceCents * input.quantity;

      const [order] = await ctx.db
        .insert(TicketOrder)
        .values({
          userId: ctx.session.user.id,
          eventId: input.eventId,
          quantity: input.quantity,
          totalCents,
          status: "pending",
        })
        .returning();

      if (!order) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create order",
        });
      }

      const stripe = getStripe();

      const vercelUrl = process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : undefined;
      const origin =
        process.env.NEXT_PUBLIC_APP_URL ?? vercelUrl ?? "http://localhost:3000";

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: event.title,
                description: `${new Date(event.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })} at ${event.venue}`,
              },
              unit_amount: event.discountedPriceCents,
            },
            quantity: input.quantity,
          },
        ],
        metadata: {
          orderId: order.id,
          eventId: input.eventId,
        },
        success_url: `${origin}/tickets/success?orderId=${order.id}`,
        cancel_url: `${origin}/event/${input.eventId}`,
      });

      await ctx.db
        .update(TicketOrder)
        .set({ stripeSessionId: session.id })
        .where(eq(TicketOrder.id, order.id));

      return { checkoutUrl: session.url, orderId: order.id };
    }),

  confirmOrder: protectedProcedure
    .input(z.object({ orderId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const order = await ctx.db.query.TicketOrder.findFirst({
        where: eq(TicketOrder.id, input.orderId),
        with: { event: true },
      });

      if (!order) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Order not found",
        });
      }

      if (order.userId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not your order" });
      }

      if (order.status === "completed") {
        return order;
      }

      if (!order.stripeSessionId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No checkout session",
        });
      }

      const stripe = getStripe();
      const session = await stripe.checkout.sessions.retrieve(
        order.stripeSessionId,
      );

      if (session.payment_status === "paid") {
        const [updated] = await ctx.db
          .update(TicketOrder)
          .set({
            status: "completed",
            stripePaymentIntentId:
              typeof session.payment_intent === "string"
                ? session.payment_intent
                : session.payment_intent?.id,
          })
          .where(eq(TicketOrder.id, order.id))
          .returning();

        return { ...updated, event: order.event };
      }

      return order;
    }),

  myOrders: protectedProcedure.query(({ ctx }) => {
    return ctx.db.query.TicketOrder.findMany({
      where: eq(TicketOrder.userId, ctx.session.user.id),
      with: { event: true },
      orderBy: [desc(TicketOrder.createdAt)],
    });
  }),

  orderById: protectedProcedure
    .input(z.object({ orderId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const order = await ctx.db.query.TicketOrder.findFirst({
        where: eq(TicketOrder.id, input.orderId),
        with: { event: true },
      });

      if (!order || order.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Order not found",
        });
      }

      return order;
    }),
} satisfies TRPCRouterRecord;
