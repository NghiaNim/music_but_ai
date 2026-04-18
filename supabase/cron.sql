-- Supabase pg_cron job: refresh MSM performances daily.
-- Run this once in the Supabase SQL editor, then keep it in source control.
-- Dependencies: pg_cron (for scheduling) and pg_net (for HTTP calls).

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- ─────────────────────────────────────────────
-- 1) Persist config values on the database so
--    pg_cron workers can read them.
--    Replace the placeholder values, then run.
-- ─────────────────────────────────────────────

alter database postgres
  set app.settings.cron_target_url = 'https://<YOUR_APP_DOMAIN>/api/cron/sync-msm';

alter database postgres
  set app.settings.cron_secret = '<PASTE_CRON_SECRET_HERE>';

-- If you're on a Supabase project whose primary DB is not named "postgres",
-- swap the name above. Check with:   select current_database();

-- ─────────────────────────────────────────────
-- 2) Schedule the job (idempotent).
--    14:00 UTC = 09:00 America/New_York during EDT.
--    During EST (Nov–Mar) this runs at 10:00 NYC time;
--    use '0 13 * * *' instead if you care about strict 9am year-round.
-- ─────────────────────────────────────────────

do $$
begin
  perform cron.unschedule('classica-sync-msm');
exception when others then
  null;
end $$;

select
  cron.schedule(
    'classica-sync-msm',
    '0 14 * * *',
    $cron$
    select
      net.http_get(
        url     := current_setting('app.settings.cron_target_url'),
        headers := jsonb_build_object(
          'Authorization',  'Bearer ' || current_setting('app.settings.cron_secret'),
          'x-supabase-cron', '1'
        ),
        timeout_milliseconds := 60000
      );
    $cron$
  );

-- ─────────────────────────────────────────────
-- 3) Verify / inspect
-- ─────────────────────────────────────────────

-- Confirm the settings were persisted (note: these return the value in NEW sessions,
-- so open a fresh SQL editor tab after ALTER DATABASE to see them):
--   show app.settings.cron_target_url;
--   show app.settings.cron_secret;

-- List scheduled jobs:
--   select * from cron.job where jobname = 'classica-sync-msm';

-- See recent runs and HTTP responses:
--   select * from cron.job_run_details
--   where jobid = (select jobid from cron.job where jobname = 'classica-sync-msm')
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
