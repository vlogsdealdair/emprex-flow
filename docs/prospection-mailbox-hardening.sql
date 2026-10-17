alter table public.prospection_prospects add column last_inbox_check_at timestamptz;
grant usage on schema app_private to service_role;
alter table public.prospection_prospects drop constraint prospection_prospects_email_check;
alter table public.prospection_prospects add constraint prospection_prospects_email_check check(email=lower(btrim(email)) and email ~ '^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$');
create or replace function app_private.prospection_claim() returns jsonb language plpgsql security definer set search_path='' as $$
declare cfg public.prospection_settings; p public.prospection_prospects; m public.prospection_messages; h integer; begin
 perform pg_advisory_xact_lock(487163025);
 select * into cfg from public.prospection_settings where id;
 if not cfg.sending_enabled then return null; end if;
 h:=extract(hour from now() at time zone cfg.timezone);
 if h<cfg.start_hour or h>=cfg.end_hour or extract(isodow from now() at time zone cfg.timezone)>5 then return null; end if;
 if (select count(*) from public.prospection_messages where status in ('Enviando','Enviado','Revisar envío') and coalesce(sent_at,updated_at) >= date_trunc('day',now() at time zone cfg.timezone) at time zone cfg.timezone)>=cfg.daily_limit then return null; end if;
 -- Expired in-flight reservations are ambiguous, never resend automatically.
 update public.prospection_messages set status='Revisar envío',error='Envío interrumpido: revisar Gmail antes de reintentar' where status='Enviando' and updated_at<now()-interval '10 minutes';
 select pp.* into p from public.prospection_prospects pp where pp.status='Programado' and pp.replied_at is null and pp.score>=cfg.min_score and not exists(select 1 from public.prospection_suppression s where s.email=pp.email)
 and exists(select 1 from public.profiles u where u.id=pp.owner_id and u.is_active and u.role::text in ('admin','setter'))
 and (pp.campaign_id is null or exists(select 1 from public.prospection_campaigns where id=pp.campaign_id and status='Activa'))
 and exists(select 1 from public.prospection_messages mm where mm.prospect_id=pp.id and mm.status='Aprobado' and mm.scheduled_at<=now()) order by pp.created_at limit 1 for update skip locked;
 if p.id is null then return null; end if;
 if p.campaign_id is not null and not exists(select 1 from public.prospection_campaigns where id=p.campaign_id and status='Activa') then return null; end if;
 select * into m from public.prospection_messages where prospect_id=p.id and status='Aprobado' and scheduled_at<=now() and approved_by is not null order by scheduled_at limit 1 for update;
 if m.id is null then return null; end if;
 update public.prospection_messages set status='Enviando',updated_at=now() where id=m.id;
 return jsonb_build_object('message',to_jsonb(m),'prospect',to_jsonb(p));
end $$;
revoke all on function app_private.prospection_claim() from public,anon,authenticated;
grant execute on function app_private.prospection_claim() to service_role;
create or replace function public.prospection_claim() returns jsonb language sql security invoker set search_path='' as $$select app_private.prospection_claim()$$;
revoke all on function public.prospection_claim() from public,anon,authenticated;
grant execute on function public.prospection_claim() to service_role;


