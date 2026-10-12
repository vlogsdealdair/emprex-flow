-- Apply after technical-partner-role.sql commits. Existing commercial data is read only.
create table public.production_projects (
 id uuid primary key default gen_random_uuid(), deal_id uuid not null unique references public.deals(id),
 client_id uuid not null references public.clients(id), partner_id uuid references public.profiles(id),
 status text not null default 'Por revisar' check (status in ('Por revisar','Pendiente de materiales','Cotización técnica','Aprobado','Diseño','Desarrollo','Revisión 1','Revisión 2','Listo para entrega','Entregado','Garantía','Cerrado')),
 scope text not null default '', complexity text not null default 'Básica' check (complexity in ('Básica','Media','Avanzada')),
 estimated_cost numeric(12,2) check (estimated_cost>=0), estimated_days integer check (estimated_days>0),
 approved_cost numeric(12,2) check (approved_cost>=0), approved_days integer check (approved_days>0),
 approved_at timestamptz, approved_by uuid references public.profiles(id), due_date date, delivered_at timestamptz, delivered_due_date date,
 progress integer not null default 0 check (progress between 0 and 100), materials_ready boolean not null default false,
 design_approved boolean not null default false, preview_url text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index production_partner_idx on public.production_projects(partner_id);
create table public.production_adjustments (
 id uuid primary key default gen_random_uuid(), project_id uuid not null references public.production_projects(id),
 requested_by uuid not null references public.profiles(id), reason text not null check(length(trim(reason))>0),
 extra_cost numeric(12,2) not null check(extra_cost>=0), extra_days integer not null check(extra_days>=0),
 status text not null default 'Pendiente' check(status in ('Pendiente','Aprobado','Rechazado')),
 reviewed_by uuid references public.profiles(id), reviewed_at timestamptz, review_note text,
 created_at timestamptz not null default now(), check(extra_cost>0 or extra_days>0)
);
create index production_adjustments_project_idx on public.production_adjustments(project_id);
create table public.production_payments (
 id uuid primary key default gen_random_uuid(), project_id uuid not null references public.production_projects(id),
 partner_id uuid not null references public.profiles(id), amount numeric(12,2) not null check(amount>0),
 note text, paid_at timestamptz not null default now(), created_by uuid not null references public.profiles(id)
);
create index production_payments_project_idx on public.production_payments(project_id);
create table public.production_costs (
 id uuid primary key default gen_random_uuid(), project_id uuid not null references public.production_projects(id),
 amount numeric(12,2) not null check(amount>0), description text not null, created_by uuid not null references public.profiles(id), created_at timestamptz not null default now()
);
create index production_costs_project_idx on public.production_costs(project_id);
create table public.production_events (
 id uuid primary key default gen_random_uuid(), project_id uuid not null references public.production_projects(id),
 actor_id uuid not null references public.profiles(id), action text not null, body text, created_at timestamptz not null default now()
);
create index production_events_project_idx on public.production_events(project_id);
-- Private definer helpers read authoritative active profiles; no user-editable JWT metadata.
create function app_private.production_access(p_id uuid) returns boolean language sql stable security definer set search_path='' as $$
 select coalesce(auth.uid() is not null and (app_private.is_admin() or (app_private.current_app_role()::text='technical_partner' and exists(select 1 from public.production_projects where id=p_id and partner_id=auth.uid()))),false)
$$;
revoke all on function app_private.production_access(uuid) from public,anon;
grant execute on function app_private.production_access(uuid) to authenticated;
alter table public.production_projects enable row level security;
create policy production_read on public.production_projects for select to authenticated using (app_private.production_access(id));
alter table public.production_adjustments enable row level security;
create policy adjustments_read on public.production_adjustments for select to authenticated using(app_private.production_access(project_id));
alter table public.production_payments enable row level security;
create policy own_payments_read on public.production_payments for select to authenticated using(app_private.production_access(project_id) and (app_private.is_admin() or partner_id=auth.uid()));
alter table public.production_costs enable row level security;
create policy costs_read on public.production_costs for select to authenticated using(app_private.production_access(project_id));
alter table public.production_events enable row level security;
create policy events_read on public.production_events for select to authenticated using(app_private.production_access(project_id));
revoke all on public.production_projects,public.production_adjustments,public.production_payments,public.production_costs,public.production_events from anon,authenticated;
grant select on public.production_projects,public.production_adjustments,public.production_payments,public.production_costs,public.production_events to authenticated;
-- Restrictive policies prevent commercial ownership predicates granting a technical user access.
do $$ declare t text; begin
 foreach t in array array['deals','contacts','clients','activities','tasks','payments','commissions','commission_payments','sales_targets','clientes'] loop
 execute format('create policy technical_commercial_deny on public.%I as restrictive for all to authenticated using (app_private.current_app_role()::text in (''admin'',''setter'',''closer'')) with check (app_private.current_app_role()::text in (''admin'',''setter'',''closer''))',t);
 end loop;
end $$;
-- Keep self-profile edits available to commercial staff; technical accounts cannot edit users.
create policy technical_profile_deny on public.profiles as restrictive for update to authenticated using(app_private.current_app_role()::text in ('admin','setter','closer')) with check(app_private.current_app_role()::text in ('admin','setter','closer'));
-- Existing asset UPDATE policy permits broad destination paths. Technical users
-- cannot repurpose a personal avatar as a branding object through that policy.
create policy technical_branding_update_deny on storage.objects as restrictive for update to authenticated using(bucket_id<>'crm-assets' or app_private.current_app_role()::text in ('admin','setter','closer')) with check(bucket_id<>'crm-assets' or app_private.current_app_role()::text in ('admin','setter','closer'));
-- A separate after trigger preserves the existing client and commission automations.
create function app_private.create_production_project() returns trigger language plpgsql security definer set search_path='' as $$
declare c uuid; begin
 if exists(select 1 from public.pipeline_stages where id=new.stage_id and is_won) then
 insert into public.clients(contact_id,first_won_deal_id) values(new.contact_id,new.id) on conflict(contact_id) do nothing;
 select id into c from public.clients where contact_id=new.contact_id;
 insert into public.production_projects(deal_id,client_id) values(new.id,c) on conflict(deal_id) do nothing;
 end if; return new;
end $$;
revoke all on function app_private.create_production_project() from public,anon,authenticated;
create trigger zz_production_on_won after insert or update of stage_id on public.deals for each row execute function app_private.create_production_project();
insert into public.clients(contact_id,first_won_deal_id) select d.contact_id,d.id from public.deals d join public.pipeline_stages s on s.id=d.stage_id where s.is_won on conflict(contact_id) do nothing;
insert into public.production_projects(deal_id,client_id) select d.id,c.id from public.deals d join public.pipeline_stages s on s.id=d.stage_id join public.clients c on c.contact_id=d.contact_id where s.is_won on conflict(deal_id) do nothing;
-- Return just operational customer fields and aggregate commercial finance, scoped before joins.
create function app_private.production_list() returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if auth.uid() is null or coalesce(app_private.current_app_role()::text,'') not in ('admin','technical_partner') then raise exception 'Acceso denegado'; end if;
 return coalesce((select jsonb_agg(to_jsonb(x) order by x.created_at desc) from (
 select p.*, c.full_name client_name,c.email client_email,c.phone_e164 client_phone,c.company,
 s.name service_name, u.full_name partner_name,
 coalesce(d.actual_value_usd,d.potential_value_usd,0) sold_price,
 coalesce((select sum(commission_amount_usd) from public.commissions where deal_id=d.id),0) commercial_commission,
 coalesce((select sum(amount) from public.production_costs where project_id=p.id),0) other_costs,
 coalesce((select sum(amount) from public.production_payments where project_id=p.id and partner_id=p.partner_id),0) technical_paid
 from public.production_projects p join public.deals d on d.id=p.deal_id join public.contacts c on c.id=d.contact_id
 left join public.services s on s.id=d.service_id left join public.profiles u on u.id=p.partner_id
 where app_private.is_admin() or p.partner_id=auth.uid()
 ) x),'[]'::jsonb);
end $$;
revoke all on function app_private.production_list() from public,anon;
grant execute on function app_private.production_list() to authenticated;
create function public.production_list() returns jsonb language sql security invoker set search_path='' as $$ select app_private.production_list() $$;
revoke all on function public.production_list() from public,anon;
grant execute on function public.production_list() to authenticated;
-- All writes are serialized on the project. There are deliberately no direct write grants.
create function app_private.production_action(p_id uuid,p_action text,p_data jsonb) returns void language plpgsql security definer set search_path='' as $$
declare p public.production_projects%rowtype; a public.production_adjustments%rowtype; admin boolean; n numeric; days integer; target text; paid numeric; begin
 if not app_private.production_access(p_id) then raise exception 'Acceso denegado'; end if;
 admin:=app_private.is_admin();
 select * into p from public.production_projects where id=p_id for update;
 if not found then raise exception 'Proyecto no encontrado'; end if;
 -- Check the locked row too: an administrator may have reassigned the project
 -- while a technical request was waiting for this lock.
 if not admin and (coalesce(app_private.current_app_role()::text,'')<>'technical_partner' or p.partner_id is distinct from auth.uid()) then raise exception 'Acceso denegado'; end if;
 if p_action in ('assign','approve','review_adjustment','payment','cost','scope') and not admin then raise exception 'Solo el administrador puede aprobar o registrar finanzas'; end if;
 if p_action='assign' then
 if p.approved_at is not null or exists(select 1 from public.production_payments where project_id=p.id) then raise exception 'No se puede reasignar un proyecto aprobado'; end if;
 if not exists(select 1 from public.profiles where id=(p_data->>'partner_id')::uuid and role::text='technical_partner' and is_active) then raise exception 'Selecciona un socio técnico activo'; end if;
 update public.production_projects set partner_id=(p_data->>'partner_id')::uuid,estimated_cost=null,estimated_days=null,status='Por revisar' where id=p.id;
 elsif p_action='estimate' then
 if p.approved_at is not null then raise exception 'Estimación aprobada: solicita un ajuste'; end if;
 n:=(p_data->>'cost')::numeric; days:=(p_data->>'days')::integer;
 if n is null or n<0 or days is null or days<1 then raise exception 'Costo y plazo inválidos'; end if;
 update public.production_projects set estimated_cost=n,estimated_days=days,complexity=p_data->>'complexity',status='Cotización técnica' where id=p.id;
 elsif p_action='approve' then
 if p.approved_at is not null or p.estimated_cost is null or p.estimated_days is null or p.partner_id is null then raise exception 'Se requiere socio y estimación pendiente'; end if;
 if (p_data->>'due_date')::date is null then raise exception 'Define la fecha de entrega aprobada'; end if;
 update public.production_projects set approved_cost=estimated_cost,approved_days=estimated_days,approved_at=now(),approved_by=auth.uid(),due_date=(p_data->>'due_date')::date,status='Aprobado' where id=p.id;
 elsif p_action='progress' then
 target:=p_data->>'status';
 if target in ('Aprobado','Cotización técnica') and target<>p.status then raise exception 'Usa el flujo de cotización y aprobación'; end if;
 if p.approved_at is null and target not in ('Por revisar','Pendiente de materiales') then raise exception 'Se requiere aprobación técnica'; end if;
 if p.delivered_at is not null and target not in ('Entregado','Garantía','Cerrado') then raise exception 'La entrega ya fue registrada'; end if;
 if target in ('Diseño','Desarrollo','Revisión 1','Revisión 2','Listo para entrega','Entregado','Garantía','Cerrado') and not coalesce((p_data->>'materials_ready')::boolean,false) then raise exception 'Faltan materiales críticos'; end if;
 if target in ('Desarrollo','Revisión 1','Revisión 2','Listo para entrega','Entregado','Garantía','Cerrado') and not coalesce((p_data->>'design_approved')::boolean,false) then raise exception 'Falta aprobación del diseño'; end if;
 if target in ('Garantía','Cerrado') and p.delivered_at is null then raise exception 'Primero registra la entrega'; end if;
 if nullif(p_data->>'preview_url','') is not null and p_data->>'preview_url' !~ '^https?://' then raise exception 'Enlace inválido'; end if;
 update public.production_projects set status=target,progress=case when target in ('Entregado','Garantía','Cerrado') then 100 else (p_data->>'progress')::integer end,materials_ready=(p_data->>'materials_ready')::boolean,design_approved=(p_data->>'design_approved')::boolean,preview_url=nullif(p_data->>'preview_url',''),delivered_due_date=case when target='Entregado' then coalesce(delivered_due_date,due_date) else delivered_due_date end,delivered_at=case when target='Entregado' then coalesce(delivered_at,now()) else delivered_at end where id=p.id;
 elsif p_action='adjustment' then
 if p.approved_at is null or p.status='Cerrado' then raise exception 'Se requiere proyecto aprobado y abierto'; end if;
 insert into public.production_adjustments(project_id,requested_by,reason,extra_cost,extra_days) values(p.id,auth.uid(),p_data->>'reason',(p_data->>'cost')::numeric,(p_data->>'days')::integer);
 elsif p_action='review_adjustment' then
 select * into a from public.production_adjustments where id=(p_data->>'adjustment_id')::uuid and project_id=p.id for update;
 if not found or a.status<>'Pendiente' then raise exception 'Solicitud inexistente o ya resuelta'; end if;
 target:=p_data->>'decision'; if target not in ('Aprobado','Rechazado') then raise exception 'Decisión inválida'; end if;
 update public.production_adjustments set status=target,reviewed_by=auth.uid(),reviewed_at=now(),review_note=p_data->>'note' where id=a.id;
 if target='Aprobado' then update public.production_projects set approved_cost=approved_cost+a.extra_cost,approved_days=approved_days+a.extra_days,due_date=due_date+a.extra_days where id=p.id; end if;
 elsif p_action='payment' then
 n:=(p_data->>'amount')::numeric;
 select coalesce(sum(amount),0) into paid from public.production_payments where project_id=p.id;
 if p.approved_cost is null or p.partner_id is null or n is null or n<=0 or paid+n>p.approved_cost then raise exception 'Pago inválido o superior al saldo'; end if;
 insert into public.production_payments(project_id,partner_id,amount,note,created_by) values(p.id,p.partner_id,n,p_data->>'note',auth.uid());
 elsif p_action='cost' then
 insert into public.production_costs(project_id,amount,description,created_by) values(p.id,(p_data->>'amount')::numeric,p_data->>'description',auth.uid());
 elsif p_action='scope' then
 update public.production_projects set scope=coalesce(p_data->>'scope','') where id=p.id;
 elsif p_action='note' then
 if nullif(trim(p_data->>'note'),'') is null then raise exception 'Escribe un avance'; end if;
 else raise exception 'Acción inválida'; end if;
 update public.production_projects set updated_at=now() where id=p.id;
 insert into public.production_events(project_id,actor_id,action,body) values(p.id,auth.uid(),p_action,p_data::text);
end $$;
revoke all on function app_private.production_action(uuid,text,jsonb) from public,anon;
grant execute on function app_private.production_action(uuid,text,jsonb) to authenticated;
create function public.production_action(p_id uuid,p_action text,p_data jsonb) returns void language sql security invoker set search_path='' as $$ select app_private.production_action(p_id,p_action,p_data) $$;
revoke all on function public.production_action(uuid,text,jsonb) from public,anon;
grant execute on function public.production_action(uuid,text,jsonb) to authenticated;
insert into storage.buckets(id,name,public,file_size_limit) values('production-files','production-files',false,20971520);
create function app_private.production_file_access(path text) returns boolean language plpgsql stable security invoker set search_path='' as $$
begin return app_private.production_access(split_part(path,'/',1)::uuid); exception when invalid_text_representation then return false; end $$;
revoke all on function app_private.production_file_access(text) from public,anon;
grant execute on function app_private.production_file_access(text) to authenticated;
create policy production_files_read on storage.objects for select to authenticated using(bucket_id='production-files' and app_private.production_file_access(name));
create policy production_files_insert on storage.objects for insert to authenticated with check(bucket_id='production-files' and app_private.production_file_access(name));
create policy production_files_delete on storage.objects for delete to authenticated using(bucket_id='production-files' and app_private.production_file_access(name) and (app_private.is_admin() or owner_id=auth.uid()::text));
notify pgrst,'reload schema';

