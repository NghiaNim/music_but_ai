import { relations } from "drizzle-orm";
import { pgEnum, pgTable } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

import { user } from "./auth-schema";

// ─── Enums ──────────────────────────────────────────────

export const difficultyEnum = pgEnum("difficulty", [
  "beginner",
  "intermediate",
  "advanced",
]);

export const genreEnum = pgEnum("genre", [
  "orchestral",
  "opera",
  "chamber",
  "solo_recital",
  "choral",
  "ballet",
  "jazz",
]);

export const eventStatusEnum = pgEnum("event_status", ["saved", "attended"]);

export const chatModeEnum = pgEnum("chat_mode", ["discovery", "learning"]);

export const chatRoleEnum = pgEnum("chat_role", ["user", "assistant"]);

export const experienceLevelEnum = pgEnum("experience_level", [
  "new",
  "casual",
  "enthusiast",
]);

export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "completed",
  "failed",
  "refunded",
]);

export const liveEventSourceEnum = pgEnum("live_event_source", [
  "carnegie_hall",
  "met_opera",
  "juilliard",
  "msm",
]);

/** Distinguishes informal community listings from formal concerts. */
export const eventListingCategoryEnum = pgEnum("event_listing_category", [
  "local",
  "concert",
]);

export const eventPublicationStatusEnum = pgEnum("event_publication_status", [
  "active",
  "cancelled",
]);

// ─── Legacy Post table ──────────────────────────────────

export const Post = pgTable("post", (t) => ({
  id: t.uuid().notNull().primaryKey().defaultRandom(),
  title: t.varchar({ length: 256 }).notNull(),
  content: t.text().notNull(),
  createdAt: t.timestamp({ mode: "date" }).defaultNow().notNull(),
  updatedAt: t
    .timestamp({ mode: "date", withTimezone: true })
    .$onUpdateFn(() => new Date()),
}));

export const CreatePostSchema = createInsertSchema(Post, {
  title: z.string().max(256),
  content: z.string().max(256),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// ─── User Profile (extends auth user) ───────────────────

export const UserProfile = pgTable("user_profile", (t) => ({
  id: t.uuid().notNull().primaryKey().defaultRandom(),
  userId: t
    .text()
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  experienceLevel: experienceLevelEnum().notNull().default("new"),
  onboardingCompleted: t.boolean().notNull().default(false),
  onboardingAnswers: t.jsonb().$type<string[]>(),
  musicTasteEasy: t.integer(),
  musicTasteMedium: t.integer(),
  musicTasteHard: t.integer(),
  createdAt: t.timestamp({ mode: "date" }).defaultNow().notNull(),
  updatedAt: t
    .timestamp({ mode: "date", withTimezone: true })
    .$onUpdateFn(() => new Date()),
}));

// ─── Event ──────────────────────────────────────────────

/**
 * Event: user-created listings only (local community events + user-posted concerts).
 * Scraped venue concerts live in `LiveEvent` — never mix the two tables.
 */
export const Event = pgTable("event", (t) => ({
  id: t.uuid().notNull().primaryKey().defaultRandom(),
  title: t.varchar({ length: 512 }).notNull(),
  date: t.timestamp({ mode: "date", withTimezone: true }).notNull(),
  venue: t.varchar({ length: 512 }).notNull(),
  venueAddress: t.text(),
  program: t.text().notNull(),
  description: t.text().notNull(),
  difficulty: difficultyEnum().notNull().default("beginner"),
  genre: genreEnum().notNull(),
  beginnerNotes: t.text(),
  imageUrl: t.text(),
  ticketUrl: t.text(),
  isFree: t.boolean().notNull().default(false),
  originalPriceCents: t.integer().notNull().default(5000),
  discountedPriceCents: t.integer().notNull().default(3500),
  ticketsAvailable: t.integer().notNull().default(100),
  listingCategory: eventListingCategoryEnum().notNull().default("concert"),
  publicationStatus: eventPublicationStatusEnum().notNull().default("active"),
  createdBy: t.text().references(() => user.id, { onDelete: "set null" }),
  createdAt: t.timestamp({ mode: "date" }).defaultNow().notNull(),
  updatedAt: t
    .timestamp({ mode: "date", withTimezone: true })
    .$onUpdateFn(() => new Date()),
}));

// ─── UserEvent (saved / attended) ───────────────────────

export const UserEvent = pgTable("user_event", (t) => ({
  id: t.uuid().notNull().primaryKey().defaultRandom(),
  userId: t
    .text()
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  eventId: t
    .uuid()
    .notNull()
    .references(() => Event.id, { onDelete: "cascade" }),
  status: eventStatusEnum().notNull(),
  reflection: t.varchar({ length: 280 }),
  createdAt: t.timestamp({ mode: "date" }).defaultNow().notNull(),
  updatedAt: t
    .timestamp({ mode: "date", withTimezone: true })
    .$onUpdateFn(() => new Date()),
}));

// ─── ChatSession ────────────────────────────────────────

export const ChatSession = pgTable("chat_session", (t) => ({
  id: t.uuid().notNull().primaryKey().defaultRandom(),
  userId: t
    .text()
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  eventId: t.uuid().references(() => Event.id, { onDelete: "set null" }),
  mode: chatModeEnum().notNull(),
  createdAt: t.timestamp({ mode: "date" }).defaultNow().notNull(),
  updatedAt: t
    .timestamp({ mode: "date", withTimezone: true })
    .$onUpdateFn(() => new Date()),
}));

// ─── ChatMessage ────────────────────────────────────────

export const ChatMessage = pgTable("chat_message", (t) => ({
  id: t.uuid().notNull().primaryKey().defaultRandom(),
  sessionId: t
    .uuid()
    .notNull()
    .references(() => ChatSession.id, { onDelete: "cascade" }),
  role: chatRoleEnum().notNull(),
  content: t.text().notNull(),
  createdAt: t.timestamp({ mode: "date" }).defaultNow().notNull(),
}));

// ─── TicketOrder ─────────────────────────────────────────

export const TicketOrder = pgTable("ticket_order", (t) => ({
  id: t.uuid().notNull().primaryKey().defaultRandom(),
  userId: t
    .text()
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  eventId: t
    .uuid()
    .notNull()
    .references(() => Event.id, { onDelete: "cascade" }),
  quantity: t.integer().notNull().default(1),
  totalCents: t.integer().notNull(),
  status: orderStatusEnum().notNull().default("pending"),
  stripeSessionId: t.text(),
  stripePaymentIntentId: t.text(),
  createdAt: t.timestamp({ mode: "date" }).defaultNow().notNull(),
  updatedAt: t
    .timestamp({ mode: "date", withTimezone: true })
    .$onUpdateFn(() => new Date()),
}));

// ─── LiveEvent (scraped venue concerts) ─────────────────

/**
 * LiveEvent: concerts scraped from external venues (MSM, Carnegie, Met, Juilliard).
 * Refreshed on a schedule via Supabase pg_cron → /api/cron/sync-venues.
 * Never written to by end users. `eventUrl` is the stable external identity.
 */
export const LiveEvent = pgTable("live_event", (t) => ({
  id: t.uuid().notNull().primaryKey().defaultRandom(),
  source: liveEventSourceEnum().notNull(),
  title: t.varchar({ length: 512 }).notNull(),
  date: t.timestamp({ mode: "date", withTimezone: true }),
  dateText: t.varchar({ length: 128 }),
  venueName: t.varchar({ length: 256 }),
  location: t.varchar({ length: 256 }),
  imageUrl: t.text(),
  genre: genreEnum().notNull().default("solo_recital"),
  eventUrl: t.text().notNull().unique(),
  buyUrl: t.text().notNull(),
  raw: t.jsonb().$type<unknown>(),
  lastSeenAt: t.timestamp({ mode: "date" }).defaultNow().notNull(),
  createdAt: t.timestamp({ mode: "date" }).defaultNow().notNull(),
  updatedAt: t
    .timestamp({ mode: "date", withTimezone: true })
    .$onUpdateFn(() => new Date()),
}));

// ─── Relations ──────────────────────────────────────────

export const userRelations = relations(user, ({ one, many }) => ({
  profile: one(UserProfile, {
    fields: [user.id],
    references: [UserProfile.userId],
  }),
  userEvents: many(UserEvent),
  chatSessions: many(ChatSession),
  ticketOrders: many(TicketOrder),
}));

export const userProfileRelations = relations(UserProfile, ({ one }) => ({
  user: one(user, {
    fields: [UserProfile.userId],
    references: [user.id],
  }),
}));

export const eventRelations = relations(Event, ({ one, many }) => ({
  creator: one(user, {
    fields: [Event.createdBy],
    references: [user.id],
  }),
  userEvents: many(UserEvent),
  chatSessions: many(ChatSession),
  ticketOrders: many(TicketOrder),
}));

export const userEventRelations = relations(UserEvent, ({ one }) => ({
  user: one(user, {
    fields: [UserEvent.userId],
    references: [user.id],
  }),
  event: one(Event, {
    fields: [UserEvent.eventId],
    references: [Event.id],
  }),
}));

export const chatSessionRelations = relations(ChatSession, ({ one, many }) => ({
  user: one(user, {
    fields: [ChatSession.userId],
    references: [user.id],
  }),
  event: one(Event, {
    fields: [ChatSession.eventId],
    references: [Event.id],
  }),
  messages: many(ChatMessage),
}));

export const chatMessageRelations = relations(ChatMessage, ({ one }) => ({
  session: one(ChatSession, {
    fields: [ChatMessage.sessionId],
    references: [ChatSession.id],
  }),
}));

export const ticketOrderRelations = relations(TicketOrder, ({ one }) => ({
  user: one(user, {
    fields: [TicketOrder.userId],
    references: [user.id],
  }),
  event: one(Event, {
    fields: [TicketOrder.eventId],
    references: [Event.id],
  }),
}));

// ─── Zod Schemas ────────────────────────────────────────

export const CreateEventSchema = createInsertSchema(Event, {
  title: z.string().min(1).max(512),
  venue: z.string().min(1).max(512),
  program: z.string().min(1),
  description: z.string().min(1),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  beginnerNotes: true,
});

export const CreateUserEventSchema = createInsertSchema(UserEvent).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const CreateChatSessionSchema = createInsertSchema(ChatSession).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const CreateChatMessageSchema = createInsertSchema(ChatMessage).omit({
  id: true,
  createdAt: true,
});

export const CreateLiveEventSchema = createInsertSchema(LiveEvent).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export * from "./auth-schema";
