-- ============================================================
-- Linkko -> Posty dispatch cron
-- ============================================================
--
-- Do not run automatically. Review in Supabase SQL Editor first.
--
-- Prerequisite:
-- - Store the dispatch secret in Supabase Vault with this exact name:
--     posty_dispatch_secret
-- - Do not paste the real secret into this SQL file.
--
-- Security notes:
-- - The Authorization header is built inside the scheduled SQL command from
--   vault.decrypted_secrets.
-- - If the Vault secret is missing or blank, the SELECT returns no rows and no
--   HTTP request is sent.
-- - This SQL does not grant anon/authenticated privileges.

begin;

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

do $$
declare
  v_jobid bigint;
begin
  select jobid
    into v_jobid
  from cron.job
  where jobname = 'posty-reference-dispatch-every-minute'
  limit 1;

  if v_jobid is not null then
    perform cron.unschedule(v_jobid);
  end if;
end;
$$;

select cron.schedule(
  'posty-reference-dispatch-every-minute',
  '* * * * *',
  $cron$
    select net.http_post(
      url := 'https://linkko.vercel.app/api/posty-sync/dispatch',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || ds.decrypted_secret,
        'Content-Type', 'application/json'
      ),
      body := '{}'::jsonb
    )
    from vault.decrypted_secrets ds
    where ds.name = 'posty_dispatch_secret'
      and nullif(ds.decrypted_secret, '') is not null
    limit 1;
  $cron$
);

commit;

-- ============================================================
-- Verification queries
-- ============================================================

-- Registered cron job:
-- select
--   jobid,
--   jobname,
--   schedule,
--   active,
--   command
-- from cron.job
-- where jobname = 'posty-reference-dispatch-every-minute';

-- Recent cron run status:
-- select
--   runid,
--   jobid,
--   status,
--   return_message,
--   start_time,
--   end_time
-- from cron.job_run_details
-- where jobid = (
--   select jobid
--   from cron.job
--   where jobname = 'posty-reference-dispatch-every-minute'
-- )
-- order by start_time desc
-- limit 20;

-- Recent pg_net HTTP responses:
-- select
--   id,
--   status_code,
--   error_msg,
--   created
-- from net._http_response
-- order by created desc
-- limit 20;

-- Recent Posty outbox event status:
-- select
--   id,
--   event_type,
--   status,
--   attempt_count,
--   last_attempt_at,
--   next_retry_at,
--   created_at,
--   updated_at
-- from public.posty_sync_events
-- order by created_at desc
-- limit 20;
