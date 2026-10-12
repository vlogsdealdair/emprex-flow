create function app_private.delete_unused_client(p_client_id uuid) returns void language plpgsql security definer set search_path='' as $$
declare c public.clients%rowtype; begin
 if auth.uid() is null or not app_private.is_admin() then raise exception 'Solo el administrador puede eliminar clientes';end if;
 select * into c from public.clients where id=p_client_id for update;
 if not found then raise exception 'Cliente no encontrado';end if;
 perform 1 from public.contacts where id=c.contact_id for update;
 if c.first_won_deal_id is not null or exists(select 1 from public.deals where contact_id=c.contact_id)
 or exists(select 1 from public.production_projects where client_id=c.id)
 or exists(select 1 from public.activities where contact_id=c.contact_id)
 or exists(select 1 from public.tasks where contact_id=c.contact_id) then
 raise exception 'Este cliente tiene registros vinculados. Usa Archivar para conservar ventas, proyectos y pagos.';
 end if;
 delete from public.clients where id=c.id;
 delete from public.contacts where id=c.contact_id;
 insert into public.audit_log(actor_id,entity_type,entity_id,action,old_data)
 values(auth.uid(),'client',c.id,'delete_unused_client',jsonb_build_object('id',c.id,'contact_id',c.contact_id));
end $$;
revoke all on function app_private.delete_unused_client(uuid) from public,anon;
grant execute on function app_private.delete_unused_client(uuid) to authenticated;
create function public.delete_unused_client(p_client_id uuid) returns void language sql security invoker set search_path='' as $$select app_private.delete_unused_client(p_client_id)$$;
revoke all on function public.delete_unused_client(uuid) from public,anon;
grant execute on function public.delete_unused_client(uuid) to authenticated;
notify pgrst,'reload schema';

