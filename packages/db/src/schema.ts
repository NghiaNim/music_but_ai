import { relations, sql } from "drizzle-orm";
import { index, pgEnum, pgTable, uniqueIndex } from "drizzle-orm/pg-core";
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
  "ny_phil",
  "nycballet",
]);

// ─── Taste profile dimensions ───────────────────────────
//
// These mirror the visual onboarding cards. Storing them as enums keeps
// the recommender's SQL WHERE/CASE clauses fast and prevents drift
// between the onboarding UI and the inference layer.

export const emotionalOrientationEnum = pgEnum("emotional_orientation", [
  "catharsis",
  "tranquility",
  "intellectual",
  "energy",
]);

export const texturePreferenceEnum = pgEnum("texture_preference", [
  "grand",
  "intimate",
  "vocal",
  "mixed",
]);

export const eraAffinityEnum = pgEnum("era_affinity", [
  "baroque",
  "classical_period",
  "romantic",
  "impressionist",
  "modern",
  "contemporary",
]);

export const complexityToleranceEnum = pgEnum("complexity_tolerance", [
  "accessible",
  "layered",
  "challenging",
]);

export const concertMotivationEnum = pgEnum("concert_motivation", [
  "emotional_event",
  "social",
  "discovery",
  "prestige",
]);

export const crossGenreBridgeEnum = pgEnum("cross_genre_bridge", [
  "film",
  "jazz",
  "world",
  "pop_rock",
  "already_classical",
  "mixed",
]);

export const onboardingPhaseEnum = pgEnum("onboarding_phase", [
  "voice",
  "visual",
  "clips",
  "complete",
]);

export const onboardingStatusEnum = pgEnum("onboarding_status", [
  "in_progress",
  "complete",
  "abandoned",
]);

// One column shape for both clip ratings and concert engagement so the
// rest of the system never branches on string-typed `event_type`s at the
// DB level. The full string list is enforced in the validator/logger.
export const musicEventEntityEnum = pgEnum("music_event_entity", [
  "clip",
  "concert",
  "live_concert",
  "composer",
  "search",
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

/**
 * Holds both legacy onboarding fields (experienceLevel + 1-question voice
 * + 3 ratings) and the new derived taste profile (archetype, badge, tags,
 * the 6 dimensions, summary, profile cards).
 *
 * One row per user. The new fields are nullable so users mid-migration
 * keep working until they complete the new onboarding.
 *
 * Legacy fields (`onboardingAnswers`, `musicTasteEasy/Medium/Hard`) will be
 * dropped in a follow-up migration once the new flow has shipped and we
 * have re-derived for existing users.
 */
export const UserProfile = pgTable("user_profile", (t) => ({
  id: t.uuid().notNull().primaryKey().defaultRandom(),
  userId: t
    .text()
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),

  // Legacy (pre-taste-model). Keep until migration completes.
  experienceLevel: experienceLevelEnum().notNull().default("new"),
  onboardingCompleted: t.boolean().notNull().default(false),
  onboardingAnswers: t.jsonb().$type<string[]>(),
  musicTasteEasy: t.integer(),
  musicTasteMedium: t.integer(),
  musicTasteHard: t.integer(),

  // ─── Derived taste profile (Step 3 fills these) ───
  archetype: t.varchar({ length: 100 }),
  badgeEmoji: t.varchar({ length: 16 }),
  /** 4–6 short phrases like ["Late Romantic", "Intimate", "Catharsis"]. */
  tags: t.jsonb().$type<string[]>().default([]),
  emotionalOrientation: emotionalOrientationEnum(),
  texturePreference: texturePreferenceEnum(),
  /** Multi-select; subset of `eraAffinityEnum` values. */
  eraAffinities: t.jsonb().$type<string[]>().default([]),
  complexityTolerance: complexityToleranceEnum(),
  concertMotivation: concertMotivationEnum(),
  crossGenreBridge: crossGenreBridgeEnum(),
  profileSummary: t.text(),
  /** Four `{ label, value }` pairs rendered as the 2x2 profile card grid. */
  profileCards: t
    .jsonb()
    .$type<{ label: string; value: string }[]>()
    .default([]),

  /** Set the first time the new taste profile is derived. */
  tasteOnboardingCompletedAt: t.timestamp({
    mode: "date",
    withTimezone: true,
  }),
  /** Last time we ran the AI derivation (initial or re-derive). */
  lastDerivedAt: t.timestamp({ mode: "date", withTimezone: true }),

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
  /**
   * Inferred taste annotations used by the recommender. Filled by the
   * offline tagger (Step 2). Nullable so untagged events still surface
   * in the feed (they just won't get content-based score boosts).
   */
  taste: t.jsonb().$type<EventTasteAnnotation>(),
  createdBy: t.text().references(() => user.id, { onDelete: "set null" }),
  createdAt: t.timestamp({ mode: "date" }).defaultNow().notNull(),
  updatedAt: t
    .timestamp({ mode: "date", withTimezone: true })
    .$onUpdateFn(() => new Date()),
}));

/**
 * Inferred taste shape shared by Event and LiveEvent. Lives on the row
 * (not in a side table) because it's tightly coupled to the catalog
 * entry and we never query it without the row itself.
 */
export interface EventTasteAnnotation {
  era: (typeof eraAffinityEnum.enumValues)[number] | null;
  moodCluster: (typeof emotionalOrientationEnum.enumValues)[number] | null;
  texture: (typeof texturePreferenceEnum.enumValues)[number] | null;
  complexity: (typeof complexityToleranceEnum.enumValues)[number] | null;
  /** Free-form tags used by editorial rules (e.g. ["film_score", "premiere"]). */
  tags: string[];
  /** Composer fingerprints — used for collaborative + dedupe. */
  composers: string[];
  /** ISO timestamp set when the AI tagger last ran. */
  taggedAt: string;
}

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
 * `cancelled` is set from feeds (e.g. Juilliard title prefix); hidden from the public API.
 */
export const LiveEvent = pgTable("live_event", (t) => ({
  id: t.uuid().notNull().primaryKey().defaultRandom(),
  source: liveEventSourceEnum().notNull(),
  title: t.varchar({ length: 512 }).notNull(),
  cancelled: t.boolean().notNull().default(false),
  date: t.timestamp({ mode: "date", withTimezone: true }),
  dateText: t.varchar({ length: 128 }),
  venueName: t.varchar({ length: 256 }),
  location: t.varchar({ length: 256 }),
  imageUrl: t.text(),
  genre: genreEnum().notNull().default("solo_recital"),
  eventUrl: t.text().notNull().unique(),
  buyUrl: t.text().notNull(),
  raw: t.jsonb().$type<unknown>(),
  /** Inferred taste annotation; same shape as Event.taste. */
  taste: t.jsonb().$type<EventTasteAnnotation>(),
  lastSeenAt: t.timestamp({ mode: "date" }).defaultNow().notNull(),
  createdAt: t.timestamp({ mode: "date" }).defaultNow().notNull(),
  updatedAt: t
    .timestamp({ mode: "date", withTimezone: true })
    .$onUpdateFn(() => new Date()),
}));

// ─── OnboardingSession ──────────────────────────────────

/**
 * Tracks an in-progress taste onboarding so users can resume after
 * dropping off. We keep the raw answers separate from the derived
 * profile because the derivation is async and may need to re-run if
 * Claude/OpenAI returns malformed JSON.
 */
export const OnboardingSession = pgTable(
  "onboarding_session",
  (t) => ({
    id: t.uuid().notNull().primaryKey().defaultRandom(),
    userId: t
      .text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    phase: onboardingPhaseEnum().notNull().default("voice"),
    status: onboardingStatusEnum().notNull().default("in_progress"),
    voiceTranscript: t.text(),
    /**
     * Visual card answers, e.g.:
     * { emotional_orientation: "catharsis", texture: "intimate",
     *   eras: ["romantic","impressionist"], complexity: "layered",
     *   concert_motivation: "emotional_event", bridge: "film" }
     */
    visualAnswers: t.jsonb().$type<Record<string, string | string[]>>(),
    /** Per-clip listening behavior; one entry per clip shown. */
    clipReactions: t
      .jsonb()
      .$type<
        {
          clipId: string;
          listenedMs: number;
          skipped: boolean;
          replayed: boolean;
          voiceReaction: string | null;
        }[]
      >()
      .default([]),
    completedAt: t.timestamp({ mode: "date", withTimezone: true }),
    createdAt: t.timestamp({ mode: "date" }).defaultNow().notNull(),
    updatedAt: t
      .timestamp({ mode: "date", withTimezone: true })
      .$onUpdateFn(() => new Date()),
  }),
  (table) => [
    /** One in-progress quiz per user (concurrent resume safety). */
    uniqueIndex("onboarding_session_one_in_progress_per_user")
      .on(table.userId)
      .where(sql`${table.status} = 'in_progress'`),
  ],
);

// ─── UserMusicEvent (implicit signal log) ───────────────

/**
 * Append-only event log. The recommender re-derivation, collaborative
 * filtering (Method B), and the negative-signal feature all read from
 * here. Never mutate rows — write a new event instead.
 *
 * `entityId` is a UUID for concerts; for clips and search it's a string
 * coerced into the column (Postgres is forgiving) so we keep one shape.
 *
 * The full set of `eventType` strings is enforced by the validator at
 * the API layer so we don't need a Postgres enum migration every time
 * we add a new signal type.
 */
export const UserMusicEvent = pgTable(
  "user_music_event",
  (t) => ({
    id: t.uuid().notNull().primaryKey().defaultRandom(),
    userId: t
      .text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    eventType: t.varchar({ length: 50 }).notNull(),
    entityType: musicEventEntityEnum().notNull(),
    /** UUID for concerts/composers; arbitrary id for clips/searches. */
    entityId: t.text().notNull(),
    metadata: t.jsonb().$type<Record<string, unknown>>().default({}),
    createdAt: t.timestamp({ mode: "date" }).defaultNow().notNull(),
  }),
  (table) => [
    index("user_music_event_user_created_idx").on(
      table.userId,
      table.createdAt.desc(),
    ),
    index("user_music_event_user_type_idx").on(table.userId, table.eventType),
  ],
);

// ─── Relations ──────────────────────────────────────────

export const userRelations = relations(user, ({ one, many }) => ({
  profile: one(UserProfile, {
    fields: [user.id],
    references: [UserProfile.userId],
  }),
  userEvents: many(UserEvent),
  chatSessions: many(ChatSession),
  ticketOrders: many(TicketOrder),
  musicEvents: many(UserMusicEvent),
  onboardingSessions: many(OnboardingSession),
}));

export const onboardingSessionRelations = relations(
  OnboardingSession,
  ({ one }) => ({
    user: one(user, {
      fields: [OnboardingSession.userId],
      references: [user.id],
    }),
  }),
);

export const userMusicEventRelations = relations(UserMusicEvent, ({ one }) => ({
  user: one(user, {
    fields: [UserMusicEvent.userId],
    references: [user.id],
  }),
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

export const CreateOnboardingSessionSchema = createInsertSchema(
  OnboardingSession,
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const CreateUserMusicEventSchema = createInsertSchema(
  UserMusicEvent,
).omit({
  id: true,
  createdAt: true,
});

// ─── Waitlist Signup ────────────────────────────────────

export const WaitlistSignup = pgTable("waitlist_signup", (t) => ({
  id: t.uuid().notNull().primaryKey().defaultRandom(),
  name: t.varchar({ length: 128 }).notNull(),
  email: t.varchar({ length: 320 }).notNull().unique(),
  source: t.varchar({ length: 32 }).notNull().default("web"),
  createdAt: t.timestamp({ mode: "date" }).defaultNow().notNull(),
}));

export const CreateWaitlistSignupSchema = createInsertSchema(WaitlistSignup, {
  name: z.string().min(1).max(128),
  email: z.email().max(320),
  source: z.enum(["web", "mobile"]).default("web"),
}).omit({
  id: true,
  createdAt: true,
});

export * from "./auth-schema";
