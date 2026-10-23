-- Fires the notify-new-submission Edge Function for every NEW pending spot.
--
-- Why a SQL trigger instead of a dashboard "Database Webhook": dashboard
-- webhooks fire on every INSERT and can't filter on a column. The WHEN clause
-- below keeps seed/bulk inserts of status = 'approved' rows from ever emailing.
--
-- Run once in the Supabase SQL editor, AFTER storing the two Vault secrets
-- (see supabase/README.md). Safe to re-run.

create extension if not exists pg_net;

create or replace function public.notify_new_submission()
returns trigger
language plpgsql
security definer          -- submitters are anon; Vault is readable only by privileged roles
set search_path = ''
as $$
declare
  fn_url text;
  secret text;
begin
  select decrypted_secret into fn_url
    from vault.decrypted_secrets where name = 'notify_function_url';
  select decrypted_secret into secret
    from vault.decrypted_secrets where name = 'notify_webhook_secret';

  -- pg_net is async: the HTTP call happens after commit and can never block
  -- or fail the submitter's insert.
  perform net.http_post(
    url := fn_url,
    body := jsonb_build_object(
      'type', tg_op,
      'table', tg_table_name,
      'schema', tg_table_schema,
      'record', to_jsonb(new)
    ),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', secret
    ),
    timeout_milliseconds := 5000
  );
  return new;
end;
$$;

drop trigger if exists notify_new_submission on public.spots;

create trigger notify_new_submission
  after insert on public.spots
  for each row
  when (new.status = 'pending')
  execute function public.notify_new_submission();
