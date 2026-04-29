---
description: DB boundaries, scheduled jobs, and secret handling
alwaysApply: true
---

# Data & Secrets

## Two-table event model

- **`Event`** (`packages/db/src/schema.ts`) = **user-created listings only**
  (local/community events and user-posted concerts).
- **`LiveEvent`** = **scraped venue concerts** (MSM, Carnegie, Met, Juilliard).
- Do **NOT** mix them: never INSERT scraped rows into `Event`, never write
  user-entered data into `LiveEvent`.
- Identity for scraped rows: `LiveEvent.eventUrl` is unique. Sync = upsert on
  `eventUrl` + delete rows not seen in the latest scrape.

## Drizzle is the only ORM

- All schema, queries, and migrations go through Drizzle
  (`packages/db/src/schema.ts`, `pnpm -F @acme/db push`).
- Do not reach for the Supabase JS SDK, `pg` directly, or Postgres client
  libraries from app code.
- Re-export new SQL helpers from `packages/db/src/index.ts`.

## Scheduled jobs run on Supabase pg_cron

- The app owns the logic (e.g. `/api/cron/sync-venues`). Supabase pg_cron + pg_net
  calls that HTTP endpoint on schedule.
- Cron SQL lives in `supabase/cron.sql` (version-controlled, copy/paste into
  the Supabase SQL editor).
- Never create Vercel crons for data sync jobs.
- Always require `CRON_SECRET` on the endpoint.

## Secrets

- If a feature needs a new API key or env var, **ask the user** — do not
  silently stub, fake, or work around it.
- Reference secrets via `process.env.FOO`, document them in the PRD.
