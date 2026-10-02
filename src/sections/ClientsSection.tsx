import { Search, UsersRound } from "lucide-react";
import { useMemo, useState } from "react";
import { useClients } from "@/hooks/useCrm";
import { formatCurrency } from "@/utils/formatters";

export default function ClientsSection() {
  const { data: clients = [], isLoading } = useClients();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(c => [
      c.contact.full_name,
      c.contact.company,
      c.contact.email,
      c.contact.phone_e164,
    ].filter(Boolean).join(" ").toLowerCase().includes(q));
  }, [clients, search]);

  return (
    <div className="p-5 md:p-6 max-w-6xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <div>
          <h2 className="text-sm font-bold text-white">Clientes</h2>
          <p className="text-xs text-slate-600 mt-0.5">Contactos convertidos automáticamente desde oportunidades ganadas.</p>
        </div>
        <span className="ml-auto text-xs text-slate-600">{filtered.length} clientes</span>
      </div>

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
                  <td className="px-4 py-3"><span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 border border-emerald-900 px-2 py-1 rounded-full">Activo</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
