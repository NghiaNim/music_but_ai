---
description: What needs to be done next — Classica taste/recommendation system
alwaysApply: true
---

# Classica — Taste Profile & Recommendation Build Plan

We are adapting the original spec (kept verbatim at the bottom as **Appendix A**) to fit our actual stack: tRPC end-to-end, Drizzle on Supabase Postgres, OpenAI for AI, no Redis. We blend **two** catalogs (`Event` user-created + `LiveEvent` scraped). Each step ships standalone value.

---

## Step status

| # | Step | Status |
|---|------|--------|
| 1 | Schema foundation (UserProfile taste cols + UserMusicEvent + OnboardingSession + EventTaste JSONB) | ✅ DONE |
| 2 | Tag the catalog (enrich MUSIC_CATALOG; batch-tag Event + LiveEvent) | ✅ DONE |
| 3 | Profile derivation (`deriveTasteProfile()` + tRPC `tasteProfile` router) | ✅ DONE |
| 4 | Recommender (content scoring + editorial rules + diversity, blends Event + LiveEvent) | ✅ DONE |
| 5 | Visual cards onboarding (5 questions, resume via OnboardingSession) | ✅ DONE |
| 6 | Clips phase (auto-play, skip-ms capture, optional voice reaction) | ✅ DONE |
| 7 | Reveal animation + `/profile/taste` page | ✅ DONE |
| 7.5 | UX fix: mobile shell respect + sign-in default → `/onboarding/taste` | ✅ DONE |
| 8 | Event logger (batched client util + `/api/events` REST shim for sendBeacon) | pending |
| 9 | Tanny voice as Phase 1 of the new flow (+ bottom-nav escape) | ✅ DONE |
| 10 | (Optional) weekly re-derivation cron, gated on ≥20 new events | pending |

---

## Tanny voice flow status (current)

- **As of Step 9, Tanny is back as Phase 1 of `/onboarding/taste`.** Users land on a Tanny-avatar intro card, tap "Start chatting", get a TTS greeting, speak freely (browser SpeechRecognition with live caption), then auto-advance to the visual cards. The transcript is persisted to `OnboardingSession.voiceTranscript` and feeds `tasteProfile.derive` alongside the cards + clips.
- Voice is **always skippable** ("Skip — just show me the cards" on the intro, "Skip the rest" mid-call). Skipping calls `onboarding.skipVoicePhase` which only advances the session phase server-side.
- The legacy `/onboarding` page still works for anyone with a bookmark; it's no longer reachable from primary nav. We can deprecate the legacy route + its supporting procs (`onboarding.reply`, `onboarding.complete`, `onboarding.getQuestions`) in a cleanup pass after the new flow ships.

---

## Step 1 — DONE: Schema foundation

`packages/db/src/schema.ts` now has:

- **`UserProfile` extended** with: `archetype`, `badgeEmoji`, `tags`, `emotionalOrientation`, `texturePreference`, `eraAffinities`, `complexityTolerance`, `concertMotivation`, `crossGenreBridge`, `profileSummary`, `profileCards`, `tasteOnboardingCompletedAt`, `lastDerivedAt`. Legacy fields (`musicTasteEasy/Medium/Hard`, `onboardingAnswers`) retained for now; will drop in a follow-up migration after Step 5 ships.
- **`OnboardingSession`** new table — phase/status, voice transcript, visual answers, clip reactions.
- **`UserMusicEvent`** new table (append-only) — implicit signal log with `(userId, createdAt desc)` and `(userId, eventType)` indexes for the recommender's hot path.
- **`Event.taste` + `LiveEvent.taste`** JSONB columns sharing the `EventTasteAnnotation` shape `{ era, moodCluster, texture, complexity, tags[], composers[], taggedAt }`. Both are nullable so untagged events still surface in the feed.
- New enums: `emotionalOrientationEnum`, `texturePreferenceEnum`, `eraAffinityEnum`, `complexityToleranceEnum`, `concertMotivationEnum`, `crossGenreBridgeEnum`, `onboardingPhaseEnum`, `onboardingStatusEnum`, `musicEventEntityEnum`.

Pushed to Supabase via `pnpm -F @acme/db push`.

### Deliberate deviations from spec

- **No `user_taste_profiles` table.** Extended `UserProfile` instead — same FK, no join.
- **No `clips` table.** `MUSIC_CATALOG` in `packages/ai` will be enriched in code (faster iteration, atomic with deploys).
- **No standalone `editorial_rules` table.** Will live as a typed JSON config in `packages/api/src/recommendations/rules.ts` (reviewable in PRs, no admin UI needed yet).
- **`UserMusicEvent.eventType` is `varchar(50)` with API-layer validation**, not a Postgres enum — adding a new signal type shouldn't require a DB migration.

---

## Step 2 — DONE: Tag the catalog

What landed:

- **`MUSIC_CATALOG` enriched by hand** with `era` / `moodCluster` / `texture` / `complexity` for all 31 clips. Spans 5 eras × 4 moods × 3 textures. Hand-curation > AI for this small known set.
- **`pickClipsForOnboarding()`** picker that maximizes `(era × moodCluster)` coverage, biases toward partial profile if known, reserves ~30% slots for stretch picks (always show something outside their preference).
- **`packages/ai/src/taste-tagger.ts`** — `inferEventTaste()` + `inferEventTasteBatch()` using OpenAI `response_format: { type: "json_schema", strict: true }`. Bounded concurrency (default 4). Per-row failures don't abort the batch.
- **`packages/api/src/catalog-tagger.ts`** — `tagCatalog()` walks `Event` + `LiveEvent`, idempotent (60-day staleness), supports `--force` (re-tag all) and `--refresh-nulls` (re-tag rows where era came back null).
- **CLI: `pnpm -F @acme/api tag-catalog [--refresh-nulls] [--force] [--max=N]`**.
- **Auto-tag hook** in `live-event-sync`: after every cron sync, `tagUntaggedLiveEvents()` runs in `after()` — newly scraped rows get tagged in the same cron tick, never blocks the response.

Live results after running over the catalog:
- ~295 LiveEvents tagged. Era nulls 17%, mood nulls 28%, texture nulls 1% — meaningful signal across the catalog.
- Composers extracted across the catalog (Verdi, Puccini, Tchaikovsky, Stravinsky, Prokofiev, etc.) — feeds editorial rules and dedupe in Step 4.

Deliberate adjustments mid-step: the first-pass prompt was too conservative (68% null era). Tightened the system prompt with venue-aware heuristics (Met Opera → vocal/romantic by default, ballet → grand/catharsis, Wind Orchestra → grand) and a "best-guess > null" instruction. Added `--refresh-nulls` mode so we could iterate on the prompt without paying to re-tag good rows.

---

## Step 3 — DONE: Profile derivation

What landed:

- **`packages/ai/src/taste-profile.ts`** — `deriveTasteProfile()` calls OpenAI with `response_format: { type: "json_schema", strict: true }`. Never hand-parses markdown. Always returns *something*: if OpenAI errors or there's no API key, falls back to `heuristicTasteProfile()` built from visual answers alone so the reveal screen never deadlocks.
- **`heuristicTasteProfile()`** — pure function, also exported for the reveal animation's instant preview.
- **Prompt design** — explicit signal weighting (clip replays > voice transcript > visual cards); explicit "evocative phrase, not raw enum" rule on `profileCards` (verified: "Grand orchestral sweep" instead of "grand").
- **`packages/api/src/router/taste-profile.ts`** with three procedures:
  - `get` — returns the user's profile or `null` if they haven't onboarded yet.
  - `derive({ sessionId })` — reads `OnboardingSession`, hydrates clip reactions with `era`/`mood`/`label` from `MUSIC_CATALOG` (drops unknown clipIds defensively), runs derivation, upserts `UserProfile`, marks the session complete. **Idempotent** — re-running on a complete session returns the cached profile without spending tokens.
  - `update` — partial-update validator, preserves `lastDerivedAt` so manual edits don't get clobbered by the next re-derivation.
- Wired into `appRouter` as `tasteProfile`.

Validation: end-to-end smoke test with synthetic Mahler-leaning user produced `Cathartic Symphony Enthusiast` archetype, surfaced Mahler/Tchaikovsky in the summary, and captured the film-score bridge from voice. Heuristic fallback also produced a coherent `Romantic Emotional Voyager` profile.

---

## Step 4 — DONE: Recommender

What landed in `packages/api/src/recommendations/`:

- **`score.ts`** — pure scoring function. Per-candidate score: `1.0 + 0.3 era + 0.2 texture + 0.25 mood + 0.15 complexity + 0.4 editorial + 0.1·similarUsers (capped 0.5) − 0.5 skipPenalty + 0.1 premiere`. Each delta also writes a human-readable string into `reasons[]` so the UI can render explainable rec cards (the spec didn't ask for this but it's a real product win).
- **`rules.ts`** — 7 typed editorial rules (film-bridge, catharsis-romantic, accessible-gateway, intimate-chamber, discovery-contemporary, prestige-marquee, intellectual-fugues). Each rule has `applies(profile)` + `matches(taste)`. Multiple matching rules don't double-stack the bonus.
- **`diversity.ts`** — single-pass algorithm that places each candidate in the top-10 window (era cap ≤3, composer cap ≤2) or the slot 11–20 window (composer cap only), then a discovery-quota swap pass guarantees ≥2 items from outside the user's stated eras. Critical fix during testing: my first version deferred over-cap items but then re-promoted them without re-checking caps, completely defeating the filter — caught by smoke test, not by typecheck.
- **`pipeline.ts`** — loads ≤150 future `Event` + ≤250 future/undated `LiveEvent` rows in parallel, dedupes `LiveEvent` rows by `(venue, normalizedTitle)` to collapse multi-night productions (NYCB lists each performance separately), reads negative signals from `UserMusicEvent` (composers with ≥3 skips in last 90d), scores, diversifies, hydrates. Returns `{ items, hasProfile, firedRuleIds }`.

tRPC: **`recommendations.forUser({ limit })`** at `protectedProcedure`. Returns the diversified top 20 with score + reasons. If user has no derived profile yet, `hasProfile: false` so the UI knows to show the popular fallback + onboarding nudge.

Caching: pure router stays cache-free (so it works in any runtime). Exposed `recsCacheTag(userId)` helper for Next.js callers to wrap with `unstable_cache`. Cache invalidation wired into mutations that change recommendation inputs: `tasteProfile.derive`, `tasteProfile.update`, `userEvent.toggle`. Implemented via dynamic `import("next/cache")` in `packages/api/src/recs-cache-bust.ts` so `@acme/api` doesn't take a hard Next dep (Expo + scripts can still import it).

**Method B (collaborative)** intentionally skipped — `similarUserHits` interface exists in `score.ts` but the loader returns an empty Map until we cross ~100 active users.

Validation: `pnpm -F @acme/api test-recommender -- --user=<id>` runs the full pipeline against the real Supabase catalog and prints scored top 20 with reasons. End-to-end test with a synthetic catharsis+grand+romantic+modern+film-bridge profile fired both `film-bridge-cinematic` and `catharsis-romantic-symphonic` rules; top 10 came back as 3 romantic + 3 modern + 4 discovery (Bach, contemporary dance, classical-period workshop), composer cap held across 20 slots.

### Deliberate deviations from spec

- **No SQL scoring query.** Spec says "implement as a SQL scoring query with weighted columns rather than application-side filtering." Skipped — at ≤400 candidates, in-memory scoring runs in single-digit ms and is far easier to unit-test, evolve, and add explainability to. We'll revisit if the catalog 10×.
- **No `editorial_rules` DB table.** Rules live in `rules.ts` as code — reviewable in PRs, no admin UI needed yet, and `applies/matches` are typed against `ScorerProfile` so impossible rules can't be authored.
- **Composer cap counts every composer on multi-composer programs.** A Stravinsky/Frank/Tchaikovsky triple bill counts toward all three caps. Prevents one composer dominating just because their works are bundled.
- **Production-level dedupe BEFORE scoring**, not after diversity. NYCB lists every performance of `All Balanchine III` as a separate `LiveEvent` row; we keep the earliest upcoming one per `(venue, normalizedTitle)` pair so the user sees variety, not a calendar.
- **Reasons strings on every item.** Not in the spec — but rec cards without "why" feel like a black box. Reasons surface era/texture/mood matches and curator picks; complexity matches deliberately stay silent (too inside-baseball).

---

## Step 5 — DONE: Visual cards onboarding

What landed:

- **New route `/onboarding/taste`** — auth-guarded, full-screen overlay matching the existing `/onboarding` chrome but distinct so we don't break the legacy Tanny voice flow while we transition.
- **`packages/validators/src/onboarding-session.ts`** — single source of truth for `VisualAnswers` and the six taste enums. Mirrors the AI module's `VisualAnswers` shape so the UI, tRPC router, and AI derivation can't disagree.
- **Two new tRPC procs on `onboardingRouter`**:
  - `getOrCreateSession` — returns the user's in-progress session, or the most recent completed one, or creates a fresh one. Idempotent; powers reload-resume.
  - `saveVisualAnswers({ sessionId, answers, markVisualComplete })` — re-validates with `VisualAnswersSchema`, *merges* the patch with whatever's already persisted (so a dropped network packet can't lose earlier answers), advances `phase` from `voice → visual` on first save and `visual → clips` when the UI flags Q5 complete.
- **5 questions, one per screen** (`_components/questions.ts`) — typed against `keyof VisualAnswers` so a renamed enum is a compile error. Question text + descriptions are evocative ("Big emotions, drama — something that moves you deeply") not mechanical.
- **`question-card.tsx`** — single-select cards auto-advance after a 220ms confirm flash (the tap *feels* acknowledged); multi-select uses `[Skip][Continue]` per spec. Hover/focus/selected/confirming states all distinct.
- **`visual-cards-flow.tsx`** — orchestrator: bootstraps the session, jumps to the first unanswered question on resume, persists per-tap, derives via `tasteProfile.derive` after Q5, transitions to a minimal reveal. Defensive throughout — toast + retain-state on save errors, idempotent derive on already-complete sessions.
- **`minimal-reveal.tsx`** — placeholder reveal used here AND on the post-clips phase later. Rotating loading messages while derive is in flight; badge → archetype → tag pills → summary on success. Step 7 will replace with the polished `/profile/taste` reveal.
- **`OnboardingCTA` rewired** — recognizes the new-style profile (`archetype` set) as completed and links to `/profile`; previously-onboarded legacy users still see their experience-level badge; brand-new users get pointed at `/onboarding/taste` with new copy ("Discover your sound — 2 min, five quick taps").

Validation: end-to-end DB smoke test confirmed the merge-and-resume behaviour — saving Q1, then Q2+Q3 in one call left the session with all three answers correctly merged and `phase=visual`.

### Deliberate deviations from spec

- **No global "8-second nudge banner".** That ships with the explore-mode UI work, not here. Today the CTA on the home page is the entry point.
- **Auto-advance on single-select** with a 220ms confirm flash. Spec just said "card highlight" — the flash gives the tap weight without slowing the user down.
- **End-of-flow derive happens immediately** (no clips phase yet). Once Step 6 lands, `markVisualComplete` will route into clips instead of straight to derive. The minimal reveal will then be re-used post-clips.
- **`OnboardingCTA` made profile-aware now**, not at Step 7, because shipping Step 5 without the entry-point change would leave the new flow undiscoverable.

---

## Step 6 — DONE: Clips phase

What landed:

- **Two new tRPC procs on `onboardingRouter`**:
  - `getClips({ sessionId })` — reads the session's visual answers, runs `pickClipsForOnboarding`, randomizes the order, and **strips era/moodCluster** from the response. Spec calls this out: showing the label biases the reaction, muddies the signal.
  - `saveClipReactions({ sessionId, reactions })` — persists the array on the session AND fans out into `UserMusicEvent` rows (1 `clip_play` + either `clip_skip` or `clip_complete` + optional `clip_replay`). The fan-out is wrapped in try/catch — a logging failure can't block onboarding completion. Server-side enriches each event's metadata with `composer`, `era`, `moodCluster` from `MUSIC_CATALOG` so the recommender's negative-signal pass works.
- **`packages/validators/src/onboarding-session.ts`** gained `ClipReactionSchema` + `SaveClipReactionsSchema` — single source of truth for the wire shape.
- **`clip-player.tsx`** — single-clip player. Visualizer (animated bars) for visual interest while listening. First clip requires a "Start listening" tap to satisfy browser autoplay policies; subsequent clips auto-play. Captures `listenedMs`, `clipDurationMs`, `skipped`, `replayed`, optional 3-state reaction tap (`Love it` / `It's okay` / `Not for me`). Skip and Next both record the moment — Next on an unfinished clip counts as a soft skip.
- **`clips-phase.tsx`** — orchestrator: fetches the 10 picks, walks through them, batches reactions, ships the bundle on finish. "Skip the rest" affordance lets users bail to derivation early; the same handler also catches a clip-load failure, so the user can never get stuck in this phase.
- **State machine wired up**: `idle → questions → clips → deriving → reveal`. `runDerive` factored out so it can be called from three places (post-clips, resume-on-clips-saved, resume-on-already-complete) with proper cancellation-signal closure semantics.
- **Resume behaviour**: `getOrCreateSession` returns the in-progress session; the bootstrap effect now branches on `session.phase` — `clips` → clips phase, `complete` → derive, otherwise → first unanswered visual question.

Validation: end-to-end DB smoke test against the real Supabase instance — picked 10 clips for a romantic+modern+catharsis profile (got 6 preferred + 4 stretch, all distinct composers), simulated 10 reactions including 2 skips + 1 replay + 1 love + 1 not-for-me, wrote 21 `UserMusicEvent` rows, confirmed `metadata.composer` was populated on skip rows so the recommender's penalty pass will catch them.

### Deliberate deviations from spec

- **No voice reaction (mic recording).** Spec called it "optional, never required" — added a 3-button tap row instead (`Love it / It's okay / Not for me`). Cheaper infra, same usefulness as a coarse positive/negative signal, no Web Audio MediaRecorder permission wall mid-onboarding. The `voiceReaction` slot in the persisted `clipReactions` shape stores the chosen enum string so future voice work can drop in without schema churn.
- **3-state reaction is optional.** Implicit signals (listenedMs / skipped / replayed) dominate the prompt's weighting — explicit tap is bonus context, not gated.
- **First-clip "Start listening" tap.** Mobile Safari + Chrome desktop both block programmatic playback without a user gesture. Rather than fight that, we make the gesture explicit and the rest of the phase auto-plays.
- **"Skip the rest" affordance.** Spec didn't ask for it; users who get bored after 3 clips would otherwise abandon. Skip flows directly into derive — they still get a profile, just a coarser one.
- **No clip-level voice button.** Spec mentioned per-clip "What did you think?" voice prompt; bundled into the same 3-state tap above to keep the UI from getting busy.

---

## Step 7 — DONE: Reveal + `/profile/taste`

What landed:

- **Polished reveal screen** (replaces the placeholder `MinimalReveal` content; same component name kept for path stability). Layout: badge avatar (in the same `bg-[#F8E8EE]` pink circle the existing `/profile` page uses for its avatar), archetype headline, tag pills (emerald, matches the rest of the app), 2×2 grid of the 4 `profileCards`, AI summary card, two CTAs ("See my recommendations" / "View my taste profile"). Sequenced animation: badge zooms in → archetype slides up → tags fade in with staggered 90ms delays → cards stagger in → summary fades → CTAs appear last.
- **`/profile/taste`** new route, server-rendered, auth-guarded. Mirrors the `/profile` page's existing visual language *exactly*: same `mx-auto max-w-lg px-5 py-6 pb-24` wrapper, same `text-3xl font-bold tracking-tight` page title, same `bg-card rounded-2xl border p-6 shadow-sm` cards, same emerald accent treatment, same `bg-[#F8E8EE]` avatar circle. Includes empty state for users who haven't taken the quiz yet.
- **Restart logic**: new `onboarding.restartSession` mutation force-creates a fresh in-progress session (marks any previous as complete first to satisfy the unique-in-progress-per-user index). The "Re-take the taste quiz" link sends users to `/onboarding/taste?restart=1`; the flow consumes the flag, calls `restartSession` instead of `getOrCreateSession`, and immediately strips the param from the URL so a refresh mid-quiz can't wipe progress.
- **Cross-app discoverability**:
  - Home `OnboardingCTA` badge state now links to `/profile/taste` (was `/profile`, the gamified-badges page) — clicking your archetype takes you to your archetype, not your trophies.
  - `/profile` page gained a "Your taste" link card at the top, mirroring the existing "My Tickets" link card pattern verbatim.
- **Footer hint**: "Profile last updated {date}. We'll keep refining as you explore." sets the right expectation that the profile evolves.

UI changes were made conservatively — no new shadcn primitives, no new color palette entries, no custom shadows. Every surface re-uses the patterns already on `/profile` and the home page.

### Deliberate deviations from spec

- **No inline per-dimension editor in v1.** Spec calls for an "edit drawer that re-uses the visual card components." I shipped a "Re-take the taste quiz" link instead, with a working restart flow, and deferred inline edit so we can iterate on the static layout first based on user feedback. Implementation note for the inline edit later: re-use `QuestionCard` from onboarding, swap each profile-card tile into edit-mode on tap, persist via `tasteProfile.update`. The `update` mutation already exists and already busts the recommendation cache.
- **Same component name (`MinimalReveal`) kept** even though it's no longer minimal — avoids touching the visual-cards-flow import surface during a UI iteration phase. Will rename in a cleanup pass later.
- **No "Edit my profile" link from the reveal** — spec mentioned it. The reveal links to `/profile/taste` instead, which is the proper home for editing. Cuts dead-end click paths.

---

## Step 7.5 — DONE: UX fix (mobile shell + sign-in default)

What landed:

- **Sign-in default redirect** changed from `/onboarding` (legacy Tanny) → `/onboarding/taste`. Both Discord and Google buttons updated. New users now land on the visual quiz, matching the home CTA.
- **Mobile-shell containment** — the global app shell is `max-w-[430px]`, but the new flow used `fixed inset-0 top-12 bottom-16`, which is positioned against the viewport and broke out of the 430px shell on desktop. Replaced with `flex min-h-[calc(100dvh-7rem)] flex-col` so the page lives **inside** the shell and inherits its width. (The legacy Tanny `/onboarding` page has the same `fixed inset-0` issue — left untouched per "don't break what works", will be revisited only if Step 9 reactivates it.)
- **Content widths reduced**:
  - `QuestionCard`: dropped `max-w-xl` (576px) → `w-full`. Reduced base prompt from `text-2xl md:text-3xl` → `text-xl sm:text-2xl`. Tightened option-button padding from `px-5 py-4` → `px-4 py-3`.
  - `ClipPlayer`: dropped `max-w-md` (448px) → `w-full`. Reduced title from `text-xl md:text-2xl` → `text-lg sm:text-xl`.
  - `MinimalReveal`: dropped `mx-auto max-w-lg` (512px) → `w-full`. Tightened padding for narrow viewports.
- **Header rows tightened** — `gap-4 px-4` → `gap-2 px-3` so the back/skip buttons + progress pips fit comfortably at 430px without wrapping. Added `shrink-0` on the side controls.
- **Inner flex containers** — `h-full` → `flex-1` everywhere in the flow components, so the new outer wrapper (which is now flex with `min-h-...` instead of `fixed`) actually stretches its children.

Tanny coexistence (per user question "is the Tanny call still supported?"):

- Yes — `/onboarding` route + voice flow are unchanged and still functional. Anyone with a deep link or bookmark can still reach it.
- It is intentionally orphaned from primary nav as of this step. The home CTA, sign-in default, and `/profile` "Your taste" all point at `/onboarding/taste` now.
- Step 9 will reintegrate it as an optional Phase 1 inside the new flow rather than as a separate parallel path.

---

## Step 9 — DONE: Tanny voice as Phase 1 + bottom-nav escape

What landed:

- **Exit affordance (immersive-first)** — bottom nav stays hidden on every `/onboarding/**` route so the flow doesn't feel cluttered. Instead, a small floating "X" button sits in the top-right of the page wrapper as the explicit save-and-exit affordance. Because `OnboardingSession` auto-persists at every save proc, tapping X is fully reversible — coming back lands the user exactly where they left off.
- **`onboarding.saveVoiceTranscript`** — new tRPC proc, saves the transcript onto the session and advances `phase: "voice" → "visual"`. Only auto-advances when phase is currently `voice`, so a returning mid-quiz user re-recording can't get bumped backward.
- **`onboarding.skipVoicePhase`** — companion proc that just bumps the phase forward without any transcript. No-op if the user already moved past voice.
- **`VoicePhase` component** (`apps/nextjs/src/app/onboarding/taste/_components/voice-phase.tsx`):
  - Reuses the existing infra: `onboarding.speak` (ElevenLabs TTS) + browser `SpeechRecognition` (free STT). Same Tanny avatar (`/tanny.png`) and pulsing-ring visual language as the legacy `/onboarding` flow so the brand carries through.
  - **One-question structure**: Tanny opens with a warm prompt ("Tell me about a piece of music that's stayed with you — what it is, and how it makes you feel"), listens, wraps up. Total time ~60-90s. Multi-turn chat would add complexity without obvious lift over a single open question feeding the LLM.
  - **`continuous: true` recognition with live interim caption** — user can speak multiple sentences; we show the live transcript so they know the mic is working. 60s safety-net timeout in case the browser refuses to end.
  - **Always-on skip path** — both "Skip — just show me the cards" on the intro and "Skip the rest" mid-call. Browsers without SpeechRecognition (Firefox, some WebViews) get a `window.prompt` typed fallback rather than an error wall.
  - **Empty transcript = soft skip** — if the user taps Start but never says anything, we call `skipVoicePhase` server-side rather than persisting an empty transcript.
- **State machine extended**: `idle → voice → questions → clips → deriving → reveal`. Bootstrap effect now branches on `session.phase === "voice"` to land returning users back at Tanny if they bailed mid-call.

### Deliberate deviations from spec

- **No GPT-driven follow-up turns.** The original spec called for a 3-4 minute conversation covering 3 named topics with the AI following up on interesting answers. I shipped a single open prompt + capture instead. Rationale: the LLM only needs *some* freeform prose to shape the derivation; the cards + clips do the structured signal collection. A back-and-forth voice loop would 4x the time-to-card while delivering marginal lift to the profile. Easy to extend later if voice retention shows users want to keep talking.
- **No real-time follow-up generation via `onboarding.reply`.** The legacy proc is hardwired to `questionIndex: 0` and a fixed question list — repurposing it would muddy responsibilities. We just use TTS for greeting/wrap-up and capture the user's freeform answer raw.
- **No mid-call mute / barge-in.** Browser-side support for interrupting TTS is uneven; "Skip the rest" handles the I-want-out case cleanly enough for v1.

---

## Step 8 — Event logger

- `apps/nextjs/src/lib/event-logger.ts`: client-side batcher (10s flush or 10 events). On `pagehide` flushes via `navigator.sendBeacon`.
- `apps/nextjs/src/app/api/events/route.ts`: REST POST shim — the **only** non-tRPC endpoint, because sendBeacon can't speak tRPC. Validates with `CreateUserMusicEventSchema`, requires Better Auth session.
- Wire from: event detail (`concert_view`), save toggle (`concert_save`), ticket success (`concert_purchase`), chat send (`search_query`).

---

## Step 9 (optional) — Voice phase integration

Wire the existing Tanny experience as Phase 1 of the new flow so users who prefer voice still get the rich derivation. The voice transcript already maps cleanly into the new `OnboardingSession.voiceTranscript`.

---

## Step 10 (optional) — Re-derivation cron

Weekly job that re-runs derivation for users with `lastDerivedAt < NOW() - 7d` AND ≥20 new `UserMusicEvent` rows since then. Same cron infrastructure as venue sync (Supabase pg_cron → Next.js API route).

---

# Appendix A — Original spec (verbatim, for reference)

> Note: this is the source spec we are adapting. Where it conflicts with the steps above, the steps above win.

Build Instructions: Classical Music Concert Recommendation System

Overview
You are building a music discovery and recommendation system for a classical concert marketplace. The core feature is an AI-powered taste onboarding experience that collects user preference data through a hybrid voice + visual interface, stores a taste profile, and feeds a recommendation pipeline. These instructions cover the full system: data models, onboarding UX, voice integration, recommendation pipeline, and the badge/profile system.

Part 1: Data Models — see schema in `packages/db/src/schema.ts` (adapted: `UserProfile` extended, no separate `clips` table).

Part 2: API Endpoints — implemented as tRPC routers, not REST under `/api/v1/`. The single REST exception is `/api/events` for `navigator.sendBeacon`.

Part 3: Onboarding UX — three phases (voice → visual → clips → reveal). Single overlay component with internal state machine.

Part 4: Profile Derivation — uses OpenAI (already wired) instead of Claude. Strict JSON schema response, retry on parse failure, heuristic fallback.

Part 5: Recommendation Pipeline — content-based + editorial rules now; collaborative filtering deferred to ≥100 users. Diversity filter implemented per spec. Caching via `unstable_cache`, not Redis.

Part 6: Profile Page UI — `/profile/taste`.

Part 7: Event Logging — batched client util + REST shim for sendBeacon.

Part 8: Environment Variables — `OPENAI_API_KEY`, `DATABASE_URL`. (No Redis, no Anthropic, no separate voice provider beyond what we already use for Tanny.)

Implementation Order — adapted to: schema → catalog tagging → derivation → recommender → visual cards → clips → reveal → event logger → voice integration → re-derivation cron.
