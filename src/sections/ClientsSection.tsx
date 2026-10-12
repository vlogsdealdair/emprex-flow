import { Search, UsersRound } from "lucide-react";
import { useMemo, useState } from "react";
import { useClients, useCurrentProfile, CRM_KEYS } from "@/hooks/useCrm";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { setClientArchived, deleteUnusedClient } from "@/services/crmService";
import { formatCurrency } from "@/utils/formatters";

export default function ClientsSection() {
  const {data:profile}=useCurrentProfile();
  const admin=profile?.role==="admin";
  const { data: clients = [], isLoading } = useClients(admin);
  const qc=useQueryClient();
  const [view,setView]=useState("active");
  const [message,setMessage]=useState("");
  const [confirmation,setConfirmation]=useState<{id:string;name:string}|null>(null);
  const change=useMutation({mutationFn:({id,action}:{id:string;action:"archive"|"restore"|"delete"})=>action==="delete"?deleteUnusedClient(id):setClientArchived(id,action==="archive"),onSuccess:async()=>{setConfirmation(null);setMessage("Cambio guardado.");await qc.invalidateQueries({queryKey:CRM_KEYS.clients});},onError:e=>setMessage(e.message)});
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const visible=clients.filter(c=>!admin||view==="all"||(view==="active"?c.is_active:!c.is_active));
    if (!q) return visible;
    return visible.filter(c => [
      c.contact.full_name,
      c.contact.company,
      c.contact.email,
      c.contact.phone_e164,
    ].filter(Boolean).join(" ").toLowerCase().includes(q));
  }, [clients, search,admin,view]);

  return (
    <div className="p-5 md:p-6 max-w-6xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <div>
          <h2 className="text-sm font-bold text-white">Clientes</h2>
          <p className="text-xs text-slate-600 mt-0.5">Contactos convertidos automáticamente desde oportunidades ganadas.</p>
        </div>
        <span className="ml-auto text-xs text-slate-600">{filtered.length} clientes</span>
      </div>

      {admin&&<div className="flex flex-wrap gap-3 items-center"><label className="text-xs crm-muted">Mostrar <select aria-label="Mostrar clientes" value={view} onChange={e=>setView(e.target.value)} className="crm-input rounded-lg px-3 py-2 ml-2"><option value="active">Activos</option><option value="archived">Archivados</option><option value="all">Todos</option></select></label><p className="text-xs crm-muted">Archivar oculta el cliente y conserva sus registros. La eliminación solo está disponible sin vínculos.</p></div>}
      {message&&<p role="status" className="text-sm crm-accent">{message}</p>}
      {confirmation&&<div role="alertdialog" aria-modal="false" aria-label="Confirmar eliminación" className="crm-card p-4 space-y-3"><p className="text-sm crm-text">¿Eliminar definitivamente a {confirmation.name} y su contacto? No se puede deshacer. Si tiene ventas, proyectos, tareas o actividad, el sistema impedirá eliminarlo.</p><div className="flex gap-3"><button className="px-3 py-2 rounded-lg bg-red-600 text-white text-sm" disabled={change.isPending} onClick={()=>change.mutate({id:confirmation.id,action:"delete"})}>Eliminar definitivamente</button><button className="crm-input px-3 py-2 rounded-lg text-sm" onClick={()=>setConfirmation(null)}>Cancelar</button></div></div>}

      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar cliente..."
          className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 outline-none" />
      </div>

      {isLoading ? (
        <div className="h-52 bg-slate-900 border border-slate-800 rounded-xl animate-pulse" />
      ) : filtered.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl py-16 text-center">
          <UsersRound size={28} className="mx-auto text-slate-700 mb-3" />
          <p className="text-sm text-slate-500">Todavía no hay clientes ganados.</p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto">
          <table className="w-full min-w-[850px]">
            <thead className="bg-slate-950/60 border-b border-slate-800">
              <tr>{["Cliente","Empresa","Contacto","Desde","Primera venta","Estado"].map(h => <th key={h} className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-slate-500">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map(client => (
                <tr key={client.id} className="hover:bg-slate-800/20">
                  <td className="px-4 py-3 text-sm font-semibold text-slate-200">{client.contact.full_name}</td>
                  <td className="px-4 py-3 text-xs text-slate-400">{client.contact.company || "—"}</td>
                  <td className="px-4 py-3">
                    <p className="text-xs text-slate-300">{client.contact.phone_e164 || "—"}</p>
                    <p className="text-[11px] text-slate-600">{client.contact.email || ""}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{new Date(client.became_client_at).toLocaleDateString("es-EC")}</td>
                  <td className="px-4 py-3 text-sm font-bold text-white">{client.first_won_deal ? formatCurrency(Number(client.first_won_deal.actual_value_usd ?? client.first_won_deal.potential_value_usd ?? 0)) : "—"}</td>
                  <td className="px-4 py-3"><span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 border border-emerald-900 px-2 py-1 rounded-full">{client.is_active?"Activo":"Archivado"}</span>{admin&&<div className="flex gap-2 mt-2"><button className="crm-secondary-button rounded-lg px-2 py-1 text-xs" disabled={change.isPending} onClick={()=>change.mutate({id:client.id,action:client.is_active?"archive":"restore"})}>{client.is_active?"Archivar":"Restaurar"}</button><button title={client.first_won_deal_id?"Tiene una venta vinculada: usa Archivar":"Eliminar cliente sin vínculos"} className="rounded-lg px-2 py-1 text-xs text-red-400 disabled:opacity-40" disabled={change.isPending||!!client.first_won_deal_id} onClick={()=>{setMessage("");setConfirmation({id:client.id,name:client.contact.full_name});}}>Eliminar</button></div>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

