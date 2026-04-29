<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the Classica Next.js app. Here's what was set up:

- **`instrumentation-client.ts`** — PostHog client-side initialization using Next.js 16's `instrumentation-client.ts` pattern, with error tracking (`capture_exceptions: true`) and a reverse proxy via `/ingest`.
- **`next.config.js`** — Added PostHog reverse proxy rewrites (`/ingest/*`) and `skipTrailingSlashRedirect: true`.
- **`src/env.ts`** — Added `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` and `NEXT_PUBLIC_POSTHOG_HOST` to the validated client env schema.
- **`src/lib/posthog-server.ts`** — Server-side PostHog singleton client for future server-side event capture.
- **`.env`** — PostHog token and host written.
- **`apps/nextjs/package.json`** — Added `posthog-js` and `posthog-node` as dependencies (run `pnpm i` to install).

## Events instrumented

| Event | Description | File |
|-------|-------------|------|
| `ticket_checkout_started` | User clicks "Buy Tickets" on an event detail page | `apps/nextjs/src/app/event/[id]/_components/event-detail.tsx` |
| `ticket_purchase_completed` | Ticket order confirmed as completed after Stripe payment | `apps/nextjs/src/app/tickets/success/_components/ticket-confirmation.tsx` |
| `event_saved` | User saves or un-saves a community event | `apps/nextjs/src/app/event/[id]/_components/event-detail.tsx` |
| `event_attended_marked` | User marks a community event as attended | `apps/nextjs/src/app/event/[id]/_components/event-detail.tsx` |
| `chat_message_sent` | User sends a message to the AI concierge (with mode: discovery/learning) | `apps/nextjs/src/app/chat/_components/chat-interface.tsx` |
| `chat_ticket_purchased` | User clicks "Buy Tickets Now" from a chat assistant response | `apps/nextjs/src/app/chat/_components/chat-interface.tsx` |
| `onboarding_completed` | Taste profile derivation completes, reveal screen shown | `apps/nextjs/src/app/onboarding/taste/_components/visual-cards-flow.tsx` |
| `onboarding_voice_skipped` | User explicitly skips the Tanny voice phase | `apps/nextjs/src/app/onboarding/taste/_components/voice-phase.tsx` |
| `waitlist_joined` | User successfully joins the waitlist | `apps/nextjs/src/app/waitlist/_components/waitlist-form.tsx` |
| `event_created` | Host successfully creates a new community event listing | `apps/nextjs/src/app/post-event/_components/post-event-form.tsx` |
| `event_cancelled` | Host cancels an existing event listing | `apps/nextjs/src/app/post-event/_components/post-event-form.tsx` |

Error tracking (`posthog.captureException`) was also added at: ticket checkout errors, order confirmation errors, and onboarding derive errors.

## Next steps

Run `pnpm i` from the repo root to install `posthog-js` and `posthog-node`.

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- **Dashboard — Analytics basics**: https://us.posthog.com/project/403285/dashboard/1526393
- **Ticket Purchase Funnel** (checkout → confirmed): https://us.posthog.com/project/403285/insights/cNgrJYYG
- **Full Acquisition Funnel** (onboarding → save → checkout → purchase): https://us.posthog.com/project/403285/insights/gEtEvkjn
- **Onboarding Completion Rate** (completed vs voice skipped): https://us.posthog.com/project/403285/insights/KaGtTWeG
- **AI Chat Engagement** (messages sent + tickets from chat): https://us.posthog.com/project/403285/insights/ldaB1r43
- **Waitlist & Event Activity** (joins, saves, creations): https://us.posthog.com/project/403285/insights/yu6ApcNr

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/integration-nextjs-app-router/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
