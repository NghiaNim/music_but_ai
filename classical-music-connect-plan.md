# Classical Music Connect — Hackathon Build Plan

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

**Key dependencies:**

| Layer       | Tech                              |
| ----------- | --------------------------------- |
| Framework   | Next.js (web) + Expo (mobile)     |
| API         | tRPC v11                          |
| Database    | Drizzle ORM + Postgres            |
| AI          | Anthropic Claude API (streaming)  |
| Auth        | Clerk (works on both web + Expo)  |
| Styling     | Tailwind CSS + Nativewind         |

---

## Feature Tiers

### Tier 1 — Must Demo (Hackathon Core)

These three features together tell the full story: discover → learn → attend.

#### 1. AI Concierge (Two Modes)

The centerpiece. A single chat interface with two distinct modes:

**Discovery Mode** — "Help me find a concert"
- User describes what they're looking for (mood, date, experience level)
- AI recommends events from our catalog with personalized reasoning
- Example: *"I've never been to a classical concert, what's good this weekend?"* → AI suggests a beginner-friendly orchestral program, explains why

**Learning Mode** — "Help me understand this"
- Contextual questions about any event, composer, piece, or musical term
- Grounded in the specific event the user is looking at
- Example: *"Who is Beethoven?"* → concise, beginner-friendly answer
- Example: *"What should I listen for in this concerto?"* → 3 things to notice
- Example: *"Tips for my first opera?"* → practical + musical advice

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

## Hackathon Day Plan

| Block          | Focus                                              |
| -------------- | -------------------------------------------------- |
| Hour 0–1       | Scaffold t3-turbo, set up DB, seed 15–20 events    |
| Hour 1–3       | Home Feed + Event Detail screens (both platforms)   |
| Hour 3–5       | AI Concierge — Discovery Mode + Learning Mode      |
| Hour 5–7       | Polish UI, Concert Journal if time, demo prep       |
| Hour 7–8       | Final demo run-through, pitch prep                  |

---

## Pitch Angle (for Judges/VCs)

> "Ticketing apps sell you a seat. Spotify sells you a stream. Nobody helps you **understand, engage, and grow** as a live music audience. Classical Music Connect is the first platform that turns concert attendance into a personal journey — powered by an AI concierge that helps you discover events, learn about the music, and build your cultural identity. We start with classical — a $2–3B segment with a broken business model — but the engagement + identity layer scales to the full $30B live music market."
