-- Run only AFTER Google connection is verified and secrets exist in Vault.
-- Never paste actual credentials into this file or a public repository.
-- Extensions pg_cron, pg_net and supabase_vault must be enabled by the administrator.
do $$ begin
 if not exists(select 1 from vault.decrypted_secrets where name='emprex_project_url') or not exists(select 1 from vault.decrypted_secrets where name='emprex_service_role_key') then
  raise exception 'Configure the two server-side Vault secrets first';
 end if;
 if exists(select 1 from cron.job where jobname='emprex-prospection-minute') then raise exception 'The job already exists; inspect it instead of creating duplicates'; end if;
end $$;
select cron.schedule('emprex-prospection-minute','* * * * *',$job$
 select net.http_post(
  url:=(select decrypted_secret from vault.decrypted_secrets where name='emprex_project_url')||'/functions/v1/prospection',
  headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||(select decrypted_secret from vault.decrypted_secrets where name='emprex_service_role_key')),
  body:='{"action":"dispatch"}'::jsonb,
  timeout_milliseconds:=55000
 );
$job$);
-- Verify job executions and then set PROSPECTION_SCHEDULER_READY=true in Edge Secrets.
-- sending_enabled stays false until an administrator enables the reviewed queue in CRM.

