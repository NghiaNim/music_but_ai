-- Supabase pg_cron job: refresh all scraped venue events daily.
-- Hits /api/cron/sync-venues which runs every venue scraper concurrently
-- (Carnegie Hall, Met Opera, Juilliard, MSM) and upserts into LiveEvent.
--
-- Run this once in the Supabase SQL editor; keep in source control.
-- Dependencies: pg_cron (scheduling) + pg_net (HTTP calls).

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- ─────────────────────────────────────────────
-- 1) Persist config values on the database so
--    pg_cron workers can read them.
--    Replace the placeholder values, then run.
-- ─────────────────────────────────────────────

alter database postgres
  set app.settings.cron_target_url = 'https://<YOUR_APP_DOMAIN>/api/cron/sync-venues';

alter database postgres
  set app.settings.cron_secret = '<PASTE_CRON_SECRET_HERE>';

-- If your Supabase primary DB is not named "postgres", swap the name above:
--   select current_database();

-- ─────────────────────────────────────────────
-- 2) Unschedule any prior jobs (idempotent).
-- ─────────────────────────────────────────────

do $$
begin
  perform cron.unschedule('classica-sync-msm');
exception when others then
  null;
end $$;

do $$
begin
  perform cron.unschedule('classica-sync-venues');
exception when others then
  null;
end $$;

-- ─────────────────────────────────────────────
-- 3) Schedule the combined venue sync.
--    14:00 UTC = 09:00 America/New_York during EDT
--    (10:00 NYC during EST). Use '0 13 * * *' for strict 9am year-round.
-- ─────────────────────────────────────────────

select
  cron.schedule(
    'classica-sync-venues',
    '0 14 * * *',
    $cron$
    select
      net.http_get(
        url     := current_setting('app.settings.cron_target_url'),
        headers := jsonb_build_object(
          'Authorization',  'Bearer ' || current_setting('app.settings.cron_secret'),
          'x-supabase-cron', '1'
        ),
        timeout_milliseconds := 120000
      );
    $cron$
  );

-- ─────────────────────────────────────────────
-- 4) Verify / inspect
-- ─────────────────────────────────────────────

-- Confirm the settings were persisted (open a fresh SQL editor tab after
-- ALTER DATABASE so the new session picks them up):
--   show app.settings.cron_target_url;
--   show app.settings.cron_secret;

-- List scheduled jobs:
--   select * from cron.job where jobname = 'classica-sync-venues';

-- See recent runs and HTTP responses:
--   select * from cron.job_run_details
--   where jobid = (select jobid from cron.job where jobname = 'classica-sync-venues')
--   order by start_time desc
--   limit 20;

--   select * from net._http_response order by created desc limit 10;

-- Trigger a test run right now (doesn't wait for 14:00 UTC):
--   select net.http_get(
--     url     := current_setting('app.settings.cron_target_url'),
--     headers := jsonb_build_object(
--       'Authorization',  'Bearer ' || current_setting('app.settings.cron_secret'),
--       'x-supabase-cron', '1'
--     )
--   );
