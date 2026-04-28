---
description: Defensive programming guardrails for Classica
alwaysApply: true
---

# Defensive Programming

Two concrete failure modes have already bitten this codebase. Don't repeat them.

## 1. If a function fans out across multiple sources, the pre-check must too

A pre-check that short-circuits work (for cost or latency) MUST cover **every** source the function actually touches. A narrower pre-check than the underlying function will silently skip the broader work.

```ts
// ❌ BAD — function tags both Event + LiveEvent, but pre-check only
//        looks at LiveEvent. New community Event rows never get tagged
//        until a LiveEvent happens to be untagged.
async function tagUntagged() {
  const [{ count }] = await db
    .select({ count: sql`count(*)` })
    .from(LiveEvent)
    .where(isNull(LiveEvent.taste));
  if (count === 0) return; // <-- skips Events with null taste
  await tagCatalog(); // covers BOTH tables
}

// ✅ GOOD — pre-check matches the function's full scope.
async function tagUntagged() {
  const [live] = await db
    .select({ count: sql`count(*)` })
    .from(LiveEvent)
    .where(isNull(LiveEvent.taste));
  const [evt] = await db
    .select({ count: sql`count(*)` })
    .from(Event)
    .where(isNull(Event.taste));
  if ((live?.count ?? 0) + (evt?.count ?? 0) === 0) return;
  await tagCatalog();
}
```

Apply this thinking whenever you write a function whose name or implementation suggests "all of X" — the cheap-check at the top must reflect "all of X".

## 2. Don't depend on a cron alone for write-time enrichment

If a piece of derived data (taste annotation, beginner notes, embedding, summary) is needed for a feature, write it inline at create/update time — even if a cron also refills it later. Crons are a safety net, not the primary path.

- Trigger inline at the mutation that creates/updates the source row.
- Keep it **fire-and-forget** so user-facing latency is unaffected.
- Always swallow + log errors — never fail the user mutation because the AI step failed.
- The cron remains the backstop in case the inline call lost the race or errored.

```ts
// ✅ GOOD — taste tagged immediately on create; cron is the safety net.
const [row] = await db.insert(Event).values({...}).returning();
if (row) {
  void tagEventInBackground(db, row.id, toTaggerInput(row));
}
return row;
```

## 3. Match function names to their actual scope

If a function `tagUntaggedLiveEvents()` actually walks both tables, rename it (`tagUntaggedCatalog`). Bad names train future readers to assume narrower behavior than they get. When you rename, leave a deprecated alias for one release.

## 4. Sanity-check distributions when you add AI inference

After running any AI tagger / classifier over real data, query the distribution (count by enum value, % null) before declaring it done. A 60%+ null rate or a single value dominating is almost always a prompt or input-shape problem — fix it before downstream code (recommender, ranker, search) has to defensively work around it.
