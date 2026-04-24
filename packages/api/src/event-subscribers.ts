import type { db } from "@acme/db/client";
import { and, eq, inArray } from "@acme/db";
import { TicketOrder, user, UserEvent } from "@acme/db/schema";

export async function emailsForEventInterest(
  database: typeof db,
  eventId: string,
): Promise<string[]> {
  const saved = await database
    .select({ userId: UserEvent.userId })
    .from(UserEvent)
    .where(and(eq(UserEvent.eventId, eventId), eq(UserEvent.status, "saved")));

  const purchased = await database
    .select({ userId: TicketOrder.userId })
    .from(TicketOrder)
    .where(
      and(
        eq(TicketOrder.eventId, eventId),
        eq(TicketOrder.status, "completed"),
      ),
    );

  const userIds = [
    ...new Set([
      ...saved.map((r) => r.userId),
      ...purchased.map((r) => r.userId),
    ]),
  ];

  if (userIds.length === 0) return [];

  const rows = await database
    .select({ email: user.email })
    .from(user)
    .where(inArray(user.id, userIds));

  return [...new Set(rows.map((r) => r.email))];
}
