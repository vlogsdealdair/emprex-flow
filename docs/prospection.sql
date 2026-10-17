-- Additive MVP. No changes to prices, commissions or production.
grant usage on schema app_private to service_role;
create table public.prospection_settings (
 id boolean primary key default true check(id), daily_limit integer not null default 20 check(daily_limit between 1 and 200),
 start_hour integer not null default 9 check(start_hour between 0 and 23), end_hour integer not null default 18 check(end_hour between 1 and 24),
 timezone text not null default 'America/Guayaquil' check(timezone='America/Guayaquil'), min_score integer not null default 40 check(min_score between 0 and 100),
 max_followups integer not null default 2 check(max_followups between 0 and 5), followup_days integer not null default 5 check(followup_days between 1 and 90),
 gemini_model text not null default 'gemini-3.8-flash' check(gemini_model ~ '^gemini-[a-zA-Z0-9.-]+$'), sending_enabled boolean not null default false,
 check(end_hour>start_hour)
);
insert into public.prospection_settings(id) values(true);
create table public.prospection_campaigns (
 id uuid primary key default gen_random_uuid(),name text not null check(length(name) between 1 and 150), niche text not null default '', city text not null default '',
 status text not null default 'Pausada' check(status in ('Activa','Pausada','Cerrada')), created_by uuid not null references public.profiles(id), created_at timestamptz not null default now()
);
create table public.prospection_templates (
 id uuid primary key default gen_random_uuid(),name text not null check(length(name) between 1 and 150), subject text not null check(length(subject) between 1 and 200),
 body text not null check(length(body) between 1 and 12000), active boolean not null default true, updated_at timestamptz not null default now()
);
create table public.prospection_prospects (
 id uuid primary key default gen_random_uuid(),owner_id uuid not null references public.profiles(id),campaign_id uuid references public.prospection_campaigns(id),
 name text not null check(length(name) between 1 and 200), company text not null default '',email text not null check(email=lower(btrim(email)) and email ~ '^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$'),
 website text not null default '' check(website='' or website ~ '^https://'), city text not null default '', niche text not null default '',
 source text not null default 'Manual', source_url text not null default '', notes text not null default '',
 score integer check(score between 0 and 100), analysis jsonb, analyzed_at timestamptz, recommended_service_id uuid references public.services(id),
 status text not null default 'Nuevo' check(status in ('Nuevo','Analizado','Por aprobar','Programado','Contactado','Respondió','Reunión','Descartado','No contactar')),
 replied_at timestamptz, meeting_at timestamptz, next_followup_at timestamptz,last_inbox_check_at timestamptz,deal_id uuid unique references public.deals(id),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),unique(email)
);
create index prospection_owner on public.prospection_prospects(owner_id);
create index prospection_campaign on public.prospection_prospects(campaign_id);
create index prospection_service on public.prospection_prospects(recommended_service_id);
create table public.prospection_suppression (
 email text primary key check(email=lower(btrim(email))),reason text not null default 'No contactar',created_by uuid references public.profiles(id),created_at timestamptz not null default now()
);
create table public.prospection_messages (
 id uuid primary key default gen_random_uuid(),prospect_id uuid not null references public.prospection_prospects(id),
 template_id uuid references public.prospection_templates(id), subject text not null check(length(subject) between 1 and 200),body text not null check(length(body) between 1 and 12000),
 status text not null default 'Borrador' check(status in ('Borrador','Por aprobar','Aprobado','Enviando','Enviado','Cancelado','Error','Revisar envío')),
 sequence integer not null default 0 check(sequence between 0 and 5),scheduled_at timestamptz,approved_by uuid references public.profiles(id),approved_at timestamptz,
 sent_at timestamptz,gmail_id text,thread_id text,error text,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 check(status not in ('Aprobado','Enviando','Enviado','Revisar envío') or (approved_by is not null and approved_at is not null and scheduled_at is not null))
);
create index prospection_messages_prospect on public.prospection_messages(prospect_id);
create index prospection_messages_template on public.prospection_messages(template_id);
create index prospection_messages_approver on public.prospection_messages(approved_by);
create index prospection_queue on public.prospection_messages(scheduled_at) where status='Aprobado';
create unique index prospection_sent_gmail on public.prospection_messages(gmail_id) where gmail_id is not null;
create unique index prospection_pending_sequence on public.prospection_messages(prospect_id,sequence) where status not in ('Cancelado','Error');
create table public.prospection_events (
 id uuid primary key default gen_random_uuid(),prospect_id uuid references public.prospection_prospects(id),actor_id uuid references public.profiles(id),
 kind text not null,detail text not null default '',created_at timestamptz not null default now()
);
create index prospection_events_prospect on public.prospection_events(prospect_id,created_at desc);
create index prospection_events_actor on public.prospection_events(actor_id);
create index prospection_suppression_actor on public.prospection_suppression(created_by);
create index prospection_campaign_actor on public.prospection_campaigns(created_by);

create function app_private.prospection_access(p_owner uuid) returns boolean language sql stable security definer set search_path='' as $$
 select coalesce(auth.uid() is not null and (app_private.is_admin() or (app_private.current_app_role()::text='setter' and p_owner=auth.uid())),false)
$$;
revoke all on function app_private.prospection_access(uuid) from public,anon;
grant execute on function app_private.prospection_access(uuid) to authenticated;
do $$ declare t text; begin
 foreach t in array array['prospection_settings','prospection_campaigns','prospection_templates','prospection_prospects','prospection_suppression','prospection_messages','prospection_events'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from anon,authenticated',t);
 execute format('grant select on public.%I to authenticated',t);
 end loop;
end $$;
create policy prospection_settings_read on public.prospection_settings for select to authenticated using(app_private.current_app_role()::text in ('admin','setter'));
create policy prospection_campaigns_read on public.prospection_campaigns for select to authenticated using(app_private.current_app_role()::text in ('admin','setter'));
create policy prospection_templates_read on public.prospection_templates for select to authenticated using(app_private.current_app_role()::text in ('admin','setter'));
create policy prospection_prospects_read on public.prospection_prospects for select to authenticated using(app_private.prospection_access(owner_id));
create policy prospection_suppression_read on public.prospection_suppression for select to authenticated using(app_private.is_admin());
create policy prospection_messages_read on public.prospection_messages for select to authenticated using(exists(select 1 from public.prospection_prospects p where p.id=prospect_id and app_private.prospection_access(p.owner_id)));
create policy prospection_events_read on public.prospection_events for select to authenticated using(app_private.is_admin() or exists(select 1 from public.prospection_prospects p where p.id=prospect_id and app_private.prospection_access(p.owner_id)));
grant all on public.prospection_settings,public.prospection_campaigns,public.prospection_templates,public.prospection_prospects,public.prospection_suppression,public.prospection_messages,public.prospection_events to service_role;

create function app_private.prospection_action(p_id uuid,p_action text,p_data jsonb default '{}'::jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare r text:=app_private.current_app_role()::text; p public.prospection_prospects; m public.prospection_messages; cfg public.prospection_settings; v uuid; cid uuid; sid uuid; em text; n integer; begin
 if auth.uid() is null or coalesce(r,'') not in ('admin','setter') then raise exception 'Acceso denegado'; end if;
 select * into cfg from public.prospection_settings where id;
 if p_action in ('campaign','template','settings','unsuppress') then
  if r<>'admin' then raise exception 'Solo el administrador'; end if;
  if p_action='campaign' then
   if p_id is null then insert into public.prospection_campaigns(name,niche,city,status,created_by) values(btrim(p_data->>'name'),coalesce(p_data->>'niche',''),coalesce(p_data->>'city',''),coalesce(p_data->>'status','Pausada'),auth.uid()) returning id into v;
   else update public.prospection_campaigns set name=btrim(p_data->>'name'),niche=coalesce(p_data->>'niche',''),city=coalesce(p_data->>'city',''),status=p_data->>'status' where id=p_id returning id into v; end if;
  elsif p_action='template' then
   if p_id is null then insert into public.prospection_templates(name,subject,body,active) values(p_data->>'name',p_data->>'subject',p_data->>'body',coalesce((p_data->>'active')::boolean,true)) returning id into v;
   else update public.prospection_templates set name=p_data->>'name',subject=p_data->>'subject',body=p_data->>'body',active=coalesce((p_data->>'active')::boolean,true),updated_at=now() where id=p_id returning id into v; end if;
  elsif p_action='settings' then
   -- Sending can only be enabled by the backend after checking all integrations.
   update public.prospection_settings set daily_limit=(p_data->>'daily_limit')::integer,start_hour=(p_data->>'start_hour')::integer,end_hour=(p_data->>'end_hour')::integer,
    min_score=(p_data->>'min_score')::integer,max_followups=(p_data->>'max_followups')::integer,followup_days=(p_data->>'followup_days')::integer,gemini_model=p_data->>'gemini_model',sending_enabled=false;
  else delete from public.prospection_suppression where email=lower(btrim(p_data->>'email')); end if;
  insert into public.prospection_events(actor_id,kind,detail) values(auth.uid(),p_action,coalesce(v::text,p_data->>'email','Configuración actualizada'));
  return jsonb_build_object('id',v);
 end if;
 if p_action='create' then
  em:=lower(btrim(p_data->>'email'));
  perform pg_advisory_xact_lock(hashtextextended(em,0));
  if exists(select 1 from public.prospection_prospects where email=em) or exists(select 1 from public.contacts where lower(btrim(email))=em) then raise exception 'Este correo ya existe en EMPREX. No se creó un duplicado.'; end if;
  if exists(select 1 from public.prospection_suppression where email=em) then raise exception 'Este correo está en No contactar'; end if;
  v:=coalesce(nullif(p_data->>'owner_id','')::uuid,auth.uid());
  if r<>'admin' and v<>auth.uid() then raise exception 'Solo puedes crear prospectos propios'; end if;
  if not exists(select 1 from public.profiles where id=v and is_active and role::text in ('admin','setter')) then raise exception 'Responsable inválido'; end if;
  insert into public.prospection_prospects(owner_id,campaign_id,name,company,email,website,city,niche,source,source_url,notes)
  values(v,nullif(p_data->>'campaign_id','')::uuid,btrim(p_data->>'name'),coalesce(p_data->>'company',''),em,coalesce(p_data->>'website',''),coalesce(p_data->>'city',''),coalesce(p_data->>'niche',''),coalesce(p_data->>'source','Manual'),coalesce(p_data->>'source_url',''),left(coalesce(p_data->>'notes',''),12000)) returning * into p;
  v:=p.id;
 else
  if p_action in ('edit_message','submit','approve','cancel') then
   select * into m from public.prospection_messages where id=p_id;
   select * into p from public.prospection_prospects where id=m.prospect_id for update;
   select * into m from public.prospection_messages where id=p_id for update;
  else select * into p from public.prospection_prospects where id=p_id for update; end if;
  if p.id is null or not app_private.prospection_access(p.owner_id) then raise exception 'Prospecto no disponible'; end if;
  if p_action='edit' then
   if exists(select 1 from public.prospection_messages where prospect_id=p.id and status='Enviando') then raise exception 'Hay un envío en curso'; end if;
   v:=coalesce(nullif(p_data->>'owner_id','')::uuid,p.owner_id);
   if v<>p.owner_id and r<>'admin' then raise exception 'Solo el administrador puede reasignar'; end if;
   if not exists(select 1 from public.profiles where id=v and is_active and role::text in ('admin','setter')) then raise exception 'Responsable inválido'; end if;
   update public.prospection_prospects set name=btrim(p_data->>'name'),company=coalesce(p_data->>'company',''),website=coalesce(p_data->>'website',''),city=coalesce(p_data->>'city',''),niche=coalesce(p_data->>'niche',''),notes=left(coalesce(p_data->>'notes',''),12000),owner_id=v,campaign_id=nullif(p_data->>'campaign_id','')::uuid,updated_at=now() where id=p.id;
   update public.prospection_messages set status='Borrador',approved_by=null,approved_at=null,updated_at=now() where prospect_id=p.id and status in ('Por aprobar','Aprobado');
  elsif p_action='draft' then
   if p.status in ('Respondió','No contactar','Descartado','Reunión') or exists(select 1 from public.prospection_suppression where email=p.email) then raise exception 'Contacto bloqueado para nuevos envíos'; end if;
   select coalesce(max(sequence)+1,0) into n from public.prospection_messages where prospect_id=p.id and status not in ('Cancelado','Error');
   if n>cfg.max_followups then raise exception 'Límite de seguimientos alcanzado'; end if;
   if n>0 and not exists(select 1 from public.prospection_messages where prospect_id=p.id and status='Enviado' and sequence=n-1) then raise exception 'Primero debe enviarse el mensaje anterior'; end if;
   insert into public.prospection_messages(prospect_id,template_id,subject,body,sequence) values(p.id,nullif(p_data->>'template_id','')::uuid,p_data->>'subject',p_data->>'body',n) returning id into v;
  elsif p_action='edit_message' then
   if m.status not in ('Borrador','Por aprobar','Aprobado','Error') then raise exception 'Este mensaje no se puede editar'; end if;
   update public.prospection_messages set subject=p_data->>'subject',body=p_data->>'body',status='Borrador',approved_by=null,approved_at=null,scheduled_at=null,error=null,updated_at=now() where id=m.id;
  elsif p_action='submit' then
   if m.status<>'Borrador' then raise exception 'Se necesita un borrador'; end if;
   update public.prospection_messages set status='Por aprobar',updated_at=now() where id=m.id;
   update public.prospection_prospects set status='Por aprobar',updated_at=now() where id=p.id;
  elsif p_action='approve' then
   if r<>'admin' then raise exception 'Solo el administrador puede aprobar correos'; end if;
   if m.status<>'Por aprobar' then raise exception 'El correo no está pendiente de aprobación'; end if;
   if p.status in ('Respondió','No contactar','Descartado','Reunión') or exists(select 1 from public.prospection_suppression where email=p.email) then raise exception 'Contacto bloqueado para nuevos envíos'; end if;
   if p.score is null or p.score<cfg.min_score then raise exception 'Auditoría pendiente o score inferior al mínimo'; end if;
   if (p_data->>'scheduled_at')::timestamptz is null or (p_data->>'scheduled_at')::timestamptz<now() then raise exception 'Elige una fecha futura'; end if;
   if m.sequence>0 and (p_data->>'scheduled_at')::timestamptz<(select max(sent_at)+make_interval(days=>cfg.followup_days) from public.prospection_messages where prospect_id=p.id and status='Enviado') then raise exception 'Respeta los días entre seguimientos'; end if;
   update public.prospection_messages set status='Aprobado',approved_by=auth.uid(),approved_at=now(),scheduled_at=(p_data->>'scheduled_at')::timestamptz,updated_at=now() where id=m.id;
   update public.prospection_prospects set status='Programado',updated_at=now() where id=p.id;
  elsif p_action='cancel' then
   if m.status in ('Enviando','Enviado','Revisar envío') then raise exception 'No se puede cancelar este envío'; end if;
   update public.prospection_messages set status='Cancelado',updated_at=now() where id=m.id;
  elsif p_action in ('reply','suppress','discard','meeting') then
   if p_action='meeting' and (p_data->>'meeting_at')::timestamptz is null then raise exception 'Indica la fecha de reunión'; end if;
   if p_action in ('reply','meeting') and p.status='No contactar' then raise exception 'Prospecto bloqueado'; end if;
   if p_action='suppress' then insert into public.prospection_suppression(email,created_by,reason) values(p.email,auth.uid(),coalesce(nullif(p_data->>'reason',''),'Solicitud de no contacto')) on conflict(email) do nothing; end if;
   update public.prospection_prospects set status=case p_action when 'reply' then 'Respondió' when 'suppress' then 'No contactar' when 'meeting' then 'Reunión' else 'Descartado' end,
    replied_at=case when p_action='reply' then coalesce(replied_at,now()) else replied_at end,meeting_at=case when p_action='meeting' then (p_data->>'meeting_at')::timestamptz else meeting_at end,next_followup_at=null,updated_at=now() where id=p.id;
   update public.prospection_messages set status='Cancelado',updated_at=now() where prospect_id=p.id and status in ('Borrador','Por aprobar','Aprobado','Error');
  elsif p_action='convert' then
   if p.deal_id is not null then return jsonb_build_object('id',p.deal_id); end if;
   if p.status in ('No contactar','Descartado') then raise exception 'Prospecto bloqueado'; end if;
   perform pg_advisory_xact_lock(hashtextextended(p.email,0));
   select id into cid from public.contacts where lower(btrim(email))=p.email limit 1;
   if cid is not null then raise exception 'El contacto ya existe en Leads. Vincúlalo con el administrador para evitar duplicados.'; end if;
   select id into sid from public.pipeline_stages where is_active and not is_won and not is_lost order by position limit 1;
   if sid is null then raise exception 'No hay etapa comercial disponible'; end if;
   insert into public.contacts(full_name,email,company,notes,created_by) values(p.name,p.email,p.company,p.notes,auth.uid()) returning id into cid;
   insert into public.deals(contact_id,stage_id,setter_id,service_id,source,notes,created_by) values(cid,sid,case when exists(select 1 from public.profiles where id=p.owner_id and role::text='setter') then p.owner_id else null end,p.recommended_service_id,'Prospección',p.notes,auth.uid()) returning id into v;
   update public.prospection_prospects set deal_id=v,updated_at=now() where id=p.id;
  else raise exception 'Acción desconocida'; end if;
 end if;
 insert into public.prospection_events(prospect_id,actor_id,kind,detail) values(p.id,auth.uid(),p_action,case when p_action='approve' then 'Aprobación humana del texto actual' else '' end);
 return jsonb_build_object('id',coalesce(v,p.id));
end $$;
revoke all on function app_private.prospection_action(uuid,text,jsonb) from public,anon;
grant execute on function app_private.prospection_action(uuid,text,jsonb) to authenticated;
create function public.prospection_action(p_id uuid,p_action text,p_data jsonb default '{}'::jsonb) returns jsonb language sql security invoker set search_path='' as $$select app_private.prospection_action(p_id,p_action,p_data)$$;
revoke all on function public.prospection_action(uuid,text,jsonb) from public,anon;
grant execute on function public.prospection_action(uuid,text,jsonb) to authenticated;

create function app_private.prospection_workspace() returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null or coalesce(app_private.current_app_role()::text,'') not in ('admin','setter') then raise exception 'Acceso denegado'; end if;
 return jsonb_build_object(
 'prospects',coalesce((select jsonb_agg(to_jsonb(x) order by x.created_at desc) from (select p.*,u.full_name owner_name,c.name campaign_name,s.name service_name,
 coalesce(st.is_won,false) won,case when st.is_won then coalesce(d.actual_value_usd,d.potential_value_usd,0) else 0 end revenue
 from public.prospection_prospects p join public.profiles u on u.id=p.owner_id left join public.prospection_campaigns c on c.id=p.campaign_id left join public.services s on s.id=p.recommended_service_id left join public.deals d on d.id=p.deal_id left join public.pipeline_stages st on st.id=d.stage_id where app_private.prospection_access(p.owner_id)) x),'[]'::jsonb),
 'messages',coalesce((select jsonb_agg(to_jsonb(m) order by m.created_at desc) from public.prospection_messages m join public.prospection_prospects p on p.id=m.prospect_id where app_private.prospection_access(p.owner_id)),'[]'::jsonb),
 'campaigns',coalesce((select jsonb_agg(to_jsonb(c) order by c.created_at desc) from public.prospection_campaigns c),'[]'::jsonb),
 'templates',coalesce((select jsonb_agg(to_jsonb(t) order by t.name) from public.prospection_templates t),'[]'::jsonb),
 'events',coalesce((select jsonb_agg(to_jsonb(x)) from (select e.* from public.prospection_events e left join public.prospection_prospects p on p.id=e.prospect_id where app_private.is_admin() or app_private.prospection_access(p.owner_id) order by e.created_at desc limit 200) x),'[]'::jsonb),
 'suppression',case when app_private.is_admin() then coalesce((select jsonb_agg(to_jsonb(s)) from public.prospection_suppression s),'[]'::jsonb) else '[]'::jsonb end,
 'settings',(select to_jsonb(s) from public.prospection_settings s where id));
end $$;
revoke all on function app_private.prospection_workspace() from public,anon;
grant execute on function app_private.prospection_workspace() to authenticated;
create function public.prospection_workspace() returns jsonb language sql security invoker set search_path='' as $$select app_private.prospection_workspace()$$;
revoke all on function public.prospection_workspace() from public,anon;
grant execute on function public.prospection_workspace() to authenticated;

-- Serializes reservations globally so simultaneous workers cannot exceed daily quota.
create function app_private.prospection_claim() returns jsonb language plpgsql security definer set search_path='' as $$
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
create function public.prospection_claim() returns jsonb language sql security invoker set search_path='' as $$select app_private.prospection_claim()$$;
revoke all on function public.prospection_claim() from public,anon,authenticated;
grant execute on function public.prospection_claim() to service_role;

