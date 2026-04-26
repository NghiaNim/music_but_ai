# Classica — Hackathon Build Plan

## Vision

We're building the **first engagement + identity platform for live performance**, starting with classical music. The app turns live attendance into an edutainment loop — an AI concierge helps you discover concerts, learn about the music, and build a cultural passport of your artistic journey.

---

## Stack: create-t3-turbo Monorepo

```
apps/
  nextjs/        → Web app (hackathon demo)
  expo/          → Mobile app (React Native via Expo)
packages/
  api/           → tRPC router (shared backend logic)
  db/            → Drizzle ORM + schema (Postgres/PlanetScale)
  ai/            → AI concierge logic (shared between web + mobile)
  validators/    → Zod schemas (shared input validation)
tooling/
  eslint/
  typescript/
  tailwind/      → Shared Tailwind config (Nativewind on mobile)
```

**Why this stack:**

- One codebase, two platforms. Web for the hackathon demo, mobile-ready from day one.
- tRPC gives us end-to-end type safety from DB → API → UI.
- The `ai/` package is shared — the concierge works identically on web and mobile.
- Expo + React Native Web means components can be reused across platforms.

**Key dependencies (actual):**

| Layer     | Tech                                |
| --------- | ----------------------------------- |
| Framework | Next.js 16 (web) + Expo (mobile)    |
| API       | tRPC v11                            |
| Database  | Drizzle ORM + Postgres (Vercel)     |
| AI        | OpenAI API (gpt-4o-mini, streaming) |
| Auth      | Better Auth (Discord OAuth)         |
| Styling   | Tailwind CSS v4 + shadcn/ui         |
| UI        | @acme/ui (shared component lib)     |

---

## Voice Onboarding (Implemented)

New users are guided through a quick onboarding flow at `/onboarding`:

1. **AI Voice Greeting** — ElevenLabs TTS speaks a welcome message
2. **3 Open-ended Questions** — AI asks about music taste, live experience, listening preferences. OpenAI generates conversational replies, ElevenLabs voices them.
3. **3 Music Snippets** — One from each tier (easy/medium/hard). User rates 1-10.
   - Tracks 1-10: Easy (Bach, Beethoven, Mozart, Vivaldi)
   - Tracks 11-20: Medium (Shostakovich, Chopin, Tchaikovsky, Rachmaninoff)
   - Tracks 21-31: Hard but beautiful (R. Strauss, Mahler, Wagner)
4. **Profile Save** — Answers + ratings stored in `user_profile`. Experience level auto-computed.

---

## Feature Tiers

### Tier 1 — Must Demo (Hackathon Core)

These three features together tell the full story: discover → learn → attend.

#### 1. AI Concierge (Two Modes)

The centerpiece. A single chat interface with two distinct modes:

**Discovery Mode** — "Help me find a concert"

- User describes what they're looking for (mood, date, experience level)
- AI recommends events from our catalog with personalized reasoning
- AI answering logistics questions about the venue like parking
- Example: _"I've never been to a classical concert, what's good this weekend?"_ → AI suggests a beginner-friendly orchestral program, explains why

**Learning Mode** — "Help me understand this"

- Contextual questions about any event, composer, piece, or musical term
- Grounded in the specific event the user is looking at
- Example: _"Who is Beethoven?"_ → concise, beginner-friendly answer
- Example: _"What should I listen for in this concerto?"_ → 3 things to notice
- Example: _"Tips for my first opera?"_ → practical + musical advice

**Architecture:**

```
┌─────────────────────────────────────┐
│          AI Concierge UI            │
│  (shared component, web + mobile)   │
├─────────────────────────────────────┤
│         packages/ai/                │
│  ┌───────────┐  ┌────────────────┐  │
│  │ Discovery  │  │   Learning     │  │
│  │  System    │  │   System       │  │
│  │  Prompt    │  │   Prompt       │  │
│  └─────┬─────┘  └───────┬────────┘  │
│        │                │           │
│        ▼                ▼           │
│   Event catalog    Event context    │
│   injected as      injected as      │
│   context          context          │
├─────────────────────────────────────┤
│       Claude API (streaming)        │
└─────────────────────────────────────┘
```

- **Discovery prompt** gets the full event catalog (title, date, venue, program, difficulty) as context so it can recommend real events.
- **Learning prompt** gets the specific event's details (composer, pieces, historical context) so answers are grounded and relevant.
- Both stream responses for a responsive feel.

#### 2. Home Feed (Event Discovery)

- Seeded list of real/realistic classical events
- Each card: title, date, venue, "Beginner Friendly" chip, genre tag
- Tap → Event Detail
- Search/filter by date, genre, venue

#### 3. Event Detail Screen

- Hero section with event info
- "For Beginners" panel (AI-generated: context, what to listen for, fun fact)
- **Inline AI button** → opens Learning Mode chat pre-loaded with this event's context
- Action buttons: Save, "I Went", Share

---

### Tier 2 — Build If Time Allows

#### 4. Concert Journal (Cultural Passport)

- Timeline of saved + attended events
- Short reflection per event (140 chars)
- Profile counters: concerts attended, composers explored, venues visited
- This is the "identity" proof point — your artistic journey, visualized

#### 5. Post-Recital Screen (Artist Side)

- Form for performers to post upcoming recitals
- AI auto-generates "beginner notes" from the program listing
- Publishes to the feed — shows value for artists, not just audiences

---

### Tier 3 — Cut for Hackathon

- Badges and gamification (streaks, achievements)
- Calendar integration
- Social sharing
- Sponsor/institution dashboard
- Payment/ticketing integration

---

## Data Model (Simplified)

```sql
-- Core entities
Event {
  id
  title
  date
  venue
  program          -- pieces being performed
  description
  difficulty       -- beginner / intermediate / advanced
  genre            -- orchestral, opera, chamber, ballet
  beginnerNotes    -- AI-generated, cached
  createdBy        -- artist/institution who posted
}

User {
  id
  name
  experienceLevel  -- new, casual, enthusiast
}

UserEvent {
  userId
  eventId
  status           -- saved | attended
  reflection       -- short text, optional
}

ChatSession {
  id
  userId
  eventId          -- null for discovery mode, set for learning mode
  mode             -- discovery | learning
}

ChatMessage {
  id
  sessionId
  role             -- user | assistant
  content
}
```

---

## Ticket Purchasing via AI Concierge (Implemented)

Users can purchase tickets directly through us at a **discounted price** compared to the original listing. The primary purchase flow is through the AI concierge — when the AI recommends an event and the user expresses intent to buy, a checkout button appears inline. Users can also buy directly from event detail pages.

**Flow:**

1. User asks the AI concierge for recommendations, or browses events directly
2. AI includes pricing info (original vs discounted) and detects purchase intent
3. Frontend renders a "Buy Tickets" button when `[BUY_TICKET:<eventId>]` tag is detected in AI response
4. Clicking triggers a **Stripe Checkout Session** (test mode) and redirects to Stripe hosted checkout
5. After payment, user returns to `/tickets/success?orderId=...` where the order is confirmed
6. Order history accessible via Profile → My Tickets (`/tickets`)

**Schema additions:**

- `Event` now has `original_price_cents`, `discounted_price_cents`, `tickets_available`
- New `TicketOrder` table: `id`, `userId`, `eventId`, `quantity`, `totalCents`, `status` (pending/completed/failed/refunded), `stripeSessionId`, `stripePaymentIntentId`

**Key dependencies:** `stripe` (Stripe Node SDK), `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

---

## Post-Onboarding UX (Implemented)

After completing the voice onboarding quiz:

- The "Take the Music Quiz" CTA on the home page **disappears** and is replaced by a personalized welcome card showing the user's experience level and music taste ratings
- Navigating to `/onboarding` when already completed **redirects to home**
- The onboarding `complete` mutation sets `onboardingCompleted: true` on the user profile

---

## Waitlist Capture (Implemented)

- Added a `waitlist_signup` table via Drizzle with unique email deduplication.
- Added a shared tRPC mutation (`waitlist.join`) so clients can submit waitlist entries.
- Added a mobile `Join Waitlist` screen in Expo, linked from Profile, storing signups with `source = "mobile"`.

---

## Hackathon Day Plan

| Block    | Focus                                             |
| -------- | ------------------------------------------------- |
| Hour 0–1 | Scaffold t3-turbo, set up DB, seed 15–20 events   |
| Hour 1–3 | Home Feed + Event Detail screens (both platforms) |
| Hour 3–5 | AI Concierge — Discovery Mode + Learning Mode     |
| Hour 5–7 | Polish UI, Concert Journal if time, demo prep     |
| Hour 7–8 | Final demo run-through, pitch prep                |

---

## Pitch Angle (for Judges/VCs)

> "Ticketing apps sell you a seat. Spotify sells you a stream. Nobody helps you **understand, engage, and grow** as a live music audience. Classica is the first platform that turns concert attendance into a personal journey — powered by an AI concierge that helps you discover events, learn about the music, and build your cultural identity. We start with classical — a $2–3B segment with a broken business model — but the engagement + identity layer scales to the full $30B live music market."
