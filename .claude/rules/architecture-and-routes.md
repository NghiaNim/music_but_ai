---
description: Monorepo architecture and route map reference
alwaysApply: true
---

# Architecture and Routes

## Monorepo Layout
- `apps/nextjs`: main web app (App Router) and server endpoints.
- `apps/expo`: mobile app.
- `packages/api`: tRPC routers and venue sync/scraping orchestration.
- `packages/db`: Drizzle schema/client for Postgres.
- `packages/ai`: AI concierge/domain logic.
- `packages/auth`: Better Auth setup.
- `packages/ui`: shared UI primitives.
- `packages/validators`: shared Zod schemas.

## Next.js App Routes
- `/` home feed and onboarding entry.
- `/events`, `/event/[id]`, `/live-event/[id]` event discovery/detail.
- `/chat` assistant/chat experience.
- `/post-event`, `/post-event/[id]/edit` community event create/edit.
- `/profile`, `/journal`, `/learn`, `/learn/[slug]`, `/onboarding`.
- `/tickets`, `/tickets/success`, `/waitlist`, `/sign-in`.
- `/admin` password-protected admin event management.

## Next.js API Routes
- `/api/trpc/[trpc]` tRPC HTTP adapter endpoint.
- `/api/auth/[...all]` Better Auth endpoint.
- `/api/cron/sync-venues` venue ingestion/sync trigger.

## Core tRPC Routers (`packages/api/src/router`)
- `event`, `live-event`, `ticket`, `chat`, `onboarding`, `waitlist`.
- `user-event`, `user-profile`, `auth`, `post`.

## Working Rule for Future Changes
- Keep new pages under `apps/nextjs/src/app/**` with colocated `_components`.
- Add new backend business endpoints as tRPC routers in `packages/api/src/router`.
- Keep schema/table changes in `packages/db/src/schema.ts`.
- Keep shared validation in `packages/validators/src`.
