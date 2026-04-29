# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install dependencies
pnpm i

# Dev (all apps)
pnpm dev
# Dev (Next.js only)
pnpm dev:next

# Build
pnpm build

# Typecheck
pnpm typecheck

# Lint / fix
pnpm lint
pnpm lint:fix

# Format / fix
pnpm format
pnpm format:fix

# Database
pnpm db:push          # push Drizzle schema to Supabase
pnpm db:studio        # open Drizzle Studio
pnpm db:seed          # seed database

# Auth schema generation (run after changing Better Auth config)
pnpm auth:generate

# Add a shadcn/ui component
pnpm ui-add

# Add a new monorepo package
pnpm turbo gen init

# Utility scripts (from packages/api)
pnpm -F @acme/api sync-venues
pnpm -F @acme/api tag-catalog [--refresh-nulls] [--force] [--max=N]
pnpm -F @acme/api test-recommender -- --user=<id>
pnpm -F @acme/api test-sendgrid
```

## Architecture

**Classica** — an engagement + identity platform for live classical music. Users discover concerts, learn about music, and build a cultural passport.

### Monorepo layout

```
apps/
  nextjs/    → Next.js 15 web app (App Router, primary demo)
  expo/      → Expo SDK 54 mobile app (React Native 0.81)
packages/
  api/       → tRPC v11 routers + venue sync/scraping orchestration
  db/        → Drizzle ORM schema + Supabase Postgres client
  ai/        → AI concierge, taste derivation, onboarding logic (OpenAI)
  auth/      → Better Auth (Discord + Google OAuth)
  ui/        → Shared shadcn/ui component library
  validators/→ Shared Zod schemas
tooling/
  eslint/ prettier/ tailwind/ typescript/
```

### Next.js routes

| Route | Purpose |
|---|---|
| `/` | Home feed + onboarding CTA |
| `/events`, `/event/[id]`, `/live-event/[id]` | Event discovery/detail |
| `/chat` | AI concierge (discovery + learning modes) |
| `/onboarding/taste` | New 3-phase taste quiz (voice → visual cards → clips) |
| `/profile`, `/profile/taste` | User profile + taste archetype page |
| `/journal`, `/learn`, `/learn/[slug]` | Content/education |
| `/post-event`, `/post-event/[id]/edit` | Community event create/edit |
| `/tickets`, `/tickets/success`, `/waitlist`, `/sign-in` | Commerce + auth |
| `/admin` | Password-protected event management |
| `(marketing)/landingpage` | Standalone marketing page (separate layout) |

**API routes:**
- `/api/trpc/[trpc]` — tRPC HTTP adapter
- `/api/auth/[...all]` — Better Auth
- `/api/cron/sync-venues` — venue ingestion (called by Supabase pg_cron, requires `CRON_SECRET`)
- `/api/events` — REST POST shim for `navigator.sendBeacon` (the only non-tRPC endpoint)

### tRPC routers (`packages/api/src/router/`)

`auth`, `chat`, `event`, `liveEvent`, `onboarding`, `post`, `recommendations`, `tasteProfile`, `ticket`, `userEvent`, `userProfile`, `waitlist`

### Two-table event model (critical)

- **`Event`** = user-created listings only (community + user-posted concerts).
- **`LiveEvent`** = scraped venue concerts (Carnegie Hall, Met Opera, Juilliard, MSM, NY Phil, NYCB). Identity key: `LiveEvent.eventUrl` (unique). Sync = upsert on `eventUrl`.
- **Never** insert scraped rows into `Event`. **Never** write user data into `LiveEvent`.
- The recommender pipeline loads both tables and blends them in-memory.

### Recommendation pipeline (`packages/api/src/recommendations/`)

1. `pipeline.ts` — loads ≤150 `Event` + ≤250 `LiveEvent` rows in parallel, dedupes multi-night productions by `(venue, normalizedTitle)`, reads negative signals from `UserMusicEvent`.
2. `score.ts` — pure scoring: era (0.3) + texture (0.2) + mood (0.25) + complexity (0.15) + editorial (0.4) + collaborative (capped 0.5) − skip penalty (0.5) + premiere bonus (0.1). Emits `reasons[]` for explainability.
3. `rules.ts` — 7 editorial rules as typed code (not a DB table).
4. `diversity.ts` — era cap ≤3, composer cap ≤2 in top-10 window; ≥2 discovery items guaranteed.

### Taste onboarding flow (`/onboarding/taste`)

Three phases stored in `OnboardingSession`: **voice** (Tanny avatar + ElevenLabs TTS + SpeechRecognition) → **visual** (5 card questions) → **clips** (10 auto-selected music clips). After clips, `tasteProfile.derive` calls OpenAI to write `UserProfile.archetype`, `tags`, `emotionalOrientation`, etc. Flow is resumable — always idempotent.

### AI package (`packages/ai/src/`)

- `taste-profile.ts` — `deriveTasteProfile()` via OpenAI strict JSON schema. Falls back to `heuristicTasteProfile()` if OpenAI errors.
- `taste-tagger.ts` — `inferEventTaste()` / `inferEventTasteBatch()` annotates `Event` and `LiveEvent` rows with `{ era, moodCluster, texture, complexity, tags, composers }`.
- `music-catalog.ts` — 31 curated clips with hand-annotated taste dimensions used during onboarding.
- `concierge.ts` — AI chat concierge (discovery + learning modes).
- `tts.ts` — ElevenLabs TTS wrapper (used by Tanny voice phase).

## Key conventions

**Where things go:**
- New pages → `apps/nextjs/src/app/**` with colocated `_components/`
- New tRPC endpoints → `packages/api/src/router/`
- Schema changes → `packages/db/src/schema.ts`, then `pnpm db:push`
- Shared validators → `packages/validators/src/`
- AI/prompt logic → `packages/ai/src/`

**ORM:** Drizzle is the only ORM. Never use the Supabase JS SDK or raw `pg` from app code. Re-export new SQL helpers from `packages/db/src/index.ts`.

**Scheduled jobs:** Supabase pg_cron calls Next.js API routes. Cron SQL lives in `supabase/cron.sql`. Never use Vercel crons for data sync.

**Secrets:** If a feature needs a new env var, ask the user — never stub or fake it.

**React patterns:**
- Default to React Server Components; only add `"use client"` for interactivity.
- No `useEffect` for data fetching — use tRPC + TanStack Query (`useSuspenseQuery`).
- Use `prefetch(trpc.*.queryOptions())` in Server Components for SSR hydration.
- Forms use `@tanstack/react-form` + Zod validators.

**TypeScript:**
- Never use `any`; use `unknown` with type guards.
- Use `RouterOutputs` / `RouterInputs` for API shape types in components.
- All data fetching through tRPC — never raw `fetch()` for app data.

**UI:**
- Mobile-first: design for 375px, constrain with `max-w-[430px]` shell.
- Bottom tab bar is primary nav (Home, Learn, Events, AI Mentor, Profile).
- Reuse `@acme/ui` primitives (shadcn/ui) before adding custom patterns.
- Use semantic tokens (`bg-card`, `text-muted-foreground`) not ad-hoc colors.
- Maintain dark-mode parity for every UI change.

**Defensive programming:**
- Pre-checks that short-circuit work must cover every source the function touches (both `Event` + `LiveEvent` if the function walks both).
- Write derived data inline at mutation time; crons are safety nets only. Fire-and-forget, swallow errors so the user mutation never fails because an AI step failed.
- After any AI tagger run, verify distribution (% null, dominant values) before declaring done.

**File locks:** Before editing files for a task, append them to the `## Locked files` section in `.claude/rules/file-locks.md` with a task label and timestamp. Remove entries when done.

## Environment variables

Key vars (see `.env.example` for full list):

| Variable | Purpose |
|---|---|
| `POSTGRES_URL` | Supabase Postgres connection string |
| `AUTH_SECRET` | Better Auth secret |
| `AUTH_DISCORD_ID` / `AUTH_DISCORD_SECRET` | Discord OAuth |
| `AUTH_REDIRECT_PROXY_URL` | Auth proxy URL for Expo OAuth |
| `OPENAI_API_KEY` | AI derivation, tagger, concierge |
| `ELEVENLABS_STS_API_KEY` | Tanny voice TTS |
| `STRIPE_SECRET_KEY` / `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Ticket payments |
| `SENDGRID_API_KEY` / `SENDGRID_FROM_EMAIL` | Transactional email |
| `CRON_SECRET` | Guards `/api/cron/sync-venues` |
| `NEXT_PUBLIC_APP_URL` | Canonical web origin (set to `https://getclassica.com` in production) |
