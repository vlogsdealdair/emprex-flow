import { useEffect, useState } from "react";
import { Loader2, Plus, Save, X } from "lucide-react";
import type { DealFormPayload, DealView, PipelineStage, Profile, Service } from "@/services/crmService";

interface Props {
  isOpen: boolean;
  deal: DealView | null;
  stages: PipelineStage[];
  services: Service[];
  team: Profile[];
  currentProfile: Profile;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (payload: DealFormPayload) => Promise<void>;
}

const sources = ["Instagram", "LinkedIn", "YouTube", "TikTok", "Referido", "Cold Outreach", "Sitio Web", "Email Marketing"];
const inputClass = "w-full bg-slate-950 border border-slate-700 text-slate-200 placeholder-slate-600 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-600";
const labelClass = "block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5";

const empty = (stageId = ""): DealFormPayload => ({
  full_name: "",
  phone_e164: "",
  email: "",
  company: "",
  service_id: "",
  stage_id: stageId,
  setter_id: "",
  closer_id: "",
  source: "",
  potential_value_usd: 0,
  actual_value_usd: null,
  next_action: "",
  next_follow_up_at: "",
  notes: "",
});

export default function LeadModal({ isOpen, deal, stages, services, team, currentProfile, isSubmitting, onClose, onSubmit }: Props) {
  const firstStage = stages[0]?.id ?? "";
  const [form, setForm] = useState<DealFormPayload>(empty(firstStage));
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    if (deal) {
      setForm({
        full_name: deal.contact.full_name,
        phone_e164: deal.contact.phone_e164 ?? "",
        email: deal.contact.email ?? "",
        company: deal.contact.company ?? "",
        service_id: deal.service_id ?? "",
        stage_id: deal.stage_id,
        setter_id: deal.setter_id ?? "",
        closer_id: deal.closer_id ?? "",
        source: deal.source ?? "",
        potential_value_usd: Number(deal.potential_value_usd ?? 0),
        actual_value_usd: deal.actual_value_usd == null ? null : Number(deal.actual_value_usd),
        next_action: deal.next_action ?? "",
        next_follow_up_at: deal.next_follow_up_at ? deal.next_follow_up_at.slice(0, 16) : "",
        notes: deal.notes ?? "",
      });
    } else {
      setForm(empty(firstStage));
    }
    setError("");
  }, [isOpen, deal, firstStage]);

  if (!isOpen) return null;

  const set = <K extends keyof DealFormPayload>(key: K, value: DealFormPayload[K]) => setForm(p => ({ ...p, [key]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.full_name.trim().length < 3) return setError("Ingresa el nombre completo del prospecto.");
    if (form.phone_e164 && !/^\+[1-9]\d{7,14}$/.test(form.phone_e164.replace(/\s/g, ""))) {
      return setError("El WhatsApp debe incluir código internacional, por ejemplo +593991234567.");
    }
    if (!form.stage_id) return setError("Selecciona una etapa.");
    if (form.potential_value_usd < 0) return setError("El valor potencial no puede ser negativo.");

    await onSubmit({
      ...form,
      phone_e164: form.phone_e164 ? form.phone_e164.replace(/\s/g, "") : null,
      next_follow_up_at: form.next_follow_up_at ? new Date(form.next_follow_up_at).toISOString() : null,
    });
  };

  const setters = team.filter(p => p.role === "setter");
  const closers = team.filter(p => p.role === "closer");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div>
            <h2 className="text-sm font-bold text-white">{deal ? "Editar oportunidad" : "Nuevo lead"}</h2>
            <p className="text-xs text-slate-500 mt-0.5">Contacto + oportunidad comercial</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-slate-800 grid place-items-center text-slate-400"><X size={14} /></button>
        </div>

        <form onSubmit={submit}>
          <div className="p-5 grid md:grid-cols-2 gap-4 max-h-[68vh] overflow-y-auto">
            <div className="md:col-span-2">
              <label className={labelClass}>Nombre completo *</label>
              <input className={inputClass} value={form.full_name} onChange={e => set("full_name", e.target.value)} placeholder="Nombre y apellido" />
            </div>

            <div>
              <label className={labelClass}>WhatsApp</label>
              <input className={inputClass} value={form.phone_e164 ?? ""} onChange={e => set("phone_e164", e.target.value)} placeholder="+593991234567" />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input type="email" className={inputClass} value={form.email ?? ""} onChange={e => set("email", e.target.value)} placeholder="cliente@empresa.com" />
            </div>

            <div>
              <label className={labelClass}>Empresa</label>
              <input className={inputClass} value={form.company ?? ""} onChange={e => set("company", e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Origen</label>
              <select className={inputClass} value={form.source ?? ""} onChange={e => set("source", e.target.value)}>
                <option value="">Seleccionar...</option>
                {sources.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className={labelClass}>Servicio</label>
              <select className={inputClass} value={form.service_id ?? ""} onChange={e => set("service_id", e.target.value)}>
                <option value="">Sin servicio</option>
                {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Etapa *</label>
              <select className={inputClass} value={form.stage_id} onChange={e => set("stage_id", e.target.value)}>
                {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div>
              <label className={labelClass}>Valor potencial USD</label>
              <input type="number" min="0" step="0.01" className={inputClass} value={form.potential_value_usd} onChange={e => set("potential_value_usd", Number(e.target.value))} />
            </div>
            <div>
              <label className={labelClass}>Valor real USD</label>
              <input type="number" min="0" step="0.01" className={inputClass} value={form.actual_value_usd ?? ""} onChange={e => set("actual_value_usd", e.target.value === "" ? null : Number(e.target.value))} />
            </div>

            {currentProfile.role === "admin" && (
              <>
                <div>
                  <label className={labelClass}>Setter</label>
                  <select className={inputClass} value={form.setter_id ?? ""} onChange={e => set("setter_id", e.target.value)}>
                    <option value="">Sin asignar</option>
                    {setters.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Closer</label>
                  <select className={inputClass} value={form.closer_id ?? ""} onChange={e => set("closer_id", e.target.value)}>
                    <option value="">Sin asignar</option>
                    {closers.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                  </select>
                </div>
              </>
            )}

            <div>
              <label className={labelClass}>Próxima acción</label>
              <input className={inputClass} value={form.next_action ?? ""} onChange={e => set("next_action", e.target.value)} placeholder="Ej. enviar propuesta" />
            </div>
            <div>
              <label className={labelClass}>Próximo seguimiento</label>
              <input type="datetime-local" className={inputClass} value={form.next_follow_up_at ?? ""} onChange={e => set("next_follow_up_at", e.target.value)} />
            </div>

            <div className="md:col-span-2">
              <label className={labelClass}>Notas</label>
              <textarea rows={3} className={`${inputClass} resize-none`} value={form.notes ?? ""} onChange={e => set("notes", e.target.value)} placeholder="Necesidades, objeciones y contexto..." />
            </div>

            {error && <div className="md:col-span-2 bg-red-950 border border-red-900 text-red-400 text-xs rounded-lg px-3 py-2">{error}</div>}
          </div>

          <div className="px-5 py-4 border-t border-slate-800 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-400">Cancelar</button>
            <button disabled={isSubmitting} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-bold rounded-lg flex items-center gap-2">
              {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : deal ? <Save size={14} /> : <Plus size={14} />}
              {deal ? "Guardar cambios" : "Crear lead"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
