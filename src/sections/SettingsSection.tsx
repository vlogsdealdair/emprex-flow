import { useState } from "react";
import { Plus, Save } from "lucide-react";
import { useCreateService, useCurrentProfile, useServices, useTeam, useUpdateProfile, useUpdateService } from "@/hooks/useCrm";
import { formatCurrency } from "@/utils/formatters";

export default function SettingsSection({ userEmail }: { userEmail: string }) {
  const { data: profile } = useCurrentProfile();
  const { data: services = [] } = useServices();
  const { data: team = [] } = useTeam(true);
  const createService = useCreateService();
  const updateService = useUpdateService();
  const updateProfile = useUpdateProfile();

  const [serviceName, setServiceName] = useState("");
  const [servicePrice, setServicePrice] = useState("");

  const addService = async () => {
    const name = serviceName.trim();
    if (!name) return;
    await createService.mutateAsync({
      name,
      defaultPriceUsd: servicePrice ? Number(servicePrice) : null,
    });
    setServiceName("");
    setServicePrice("");
  };

  return (
    <div className="p-5 md:p-6 max-w-4xl mx-auto space-y-5">
      <div>
        <h2 className="text-sm font-bold text-white">Configuración</h2>
        <p className="text-xs text-slate-600 mt-0.5">Administración del CRM, equipo y catálogo de servicios.</p>
      </div>

      <section className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Cuenta activa</h3>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600 grid place-items-center text-xs font-bold text-white">
            {(profile?.full_name || userEmail).slice(0,2).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-200">{profile?.full_name || "Administrador"}</p>
            <p className="text-xs text-slate-600">{userEmail}</p>
          </div>
          <span className="ml-auto text-[10px] font-bold uppercase px-2 py-1 rounded-full bg-blue-950 border border-blue-900 text-blue-400">{profile?.role || "admin"}</span>
        </div>
      </section>

      <section className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Equipo y roles</h3>
            <p className="text-xs text-slate-600 mt-1">Cambia rol o activa/desactiva usuarios del CRM.</p>
          </div>
        </div>

        <div className="space-y-2">
          {team.map(member => (
            <div key={member.id} className="flex flex-wrap items-center gap-3 p-3 bg-slate-950 border border-slate-800 rounded-lg">
              <div className="flex-1 min-w-48">
                <p className="text-sm font-semibold text-slate-200">{member.full_name}</p>
                <p className="text-[11px] text-slate-600">{member.email}</p>
              </div>

              <select value={member.role}
                onChange={e => void updateProfile.mutateAsync({ id: member.id, patch: { role: e.target.value as "admin" | "setter" | "closer" } })}
                disabled={member.id === profile?.id}
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 disabled:opacity-50">
                <option value="admin">Admin</option>
                <option value="setter">Setter</option>
                <option value="closer">Closer</option>
              </select>

              <button
                onClick={() => void updateProfile.mutateAsync({ id: member.id, patch: { is_active: !member.is_active } })}
                disabled={member.id === profile?.id}
                className={`px-3 py-2 rounded-lg text-xs font-semibold border disabled:opacity-50 ${member.is_active ? "text-emerald-400 bg-emerald-950 border-emerald-900" : "text-slate-500 bg-slate-800 border-slate-700"}`}>
                {member.is_active ? "Activo" : "Inactivo"}
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="mb-4">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Servicios</h3>
          <p className="text-xs text-slate-600 mt-1">Catálogo disponible al crear oportunidades.</p>
        </div>

        <div className="grid grid-cols-[1fr_140px_auto] gap-2 mb-4">
          <input value={serviceName} onChange={e => setServiceName(e.target.value)} placeholder="Nuevo servicio"
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none" />
          <input type="number" min="0" step="0.01" value={servicePrice} onChange={e => setServicePrice(e.target.value)} placeholder="Precio USD"
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none" />
          <button onClick={() => void addService()} disabled={createService.isPending}
            className="px-3 rounded-lg bg-blue-600 text-white grid place-items-center disabled:opacity-50"><Plus size={14} /></button>
        </div>

        <div className="space-y-2">
          {services.map(service => (
            <div key={service.id} className="flex items-center gap-3 p-3 bg-slate-950 border border-slate-800 rounded-lg">
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-200">{service.name}</p>
                <p className="text-[11px] text-slate-600">{service.default_price_usd == null ? "Sin precio por defecto" : formatCurrency(Number(service.default_price_usd))}</p>
              </div>
              <button onClick={() => void updateService.mutateAsync({ id: service.id, patch: { is_active: !service.is_active } })}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border ${service.is_active ? "text-emerald-400 bg-emerald-950 border-emerald-900" : "text-slate-500 bg-slate-800 border-slate-700"}`}>
                {service.is_active ? "Activo" : "Inactivo"}
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Save size={13} />
          Los cambios se guardan directamente en Supabase y respetan RLS de administrador.
        </div>
      </section>
    </div>
  );
}
