import { useMemo, useState } from "react";
import { CalendarClock, Edit2, KanbanSquare, List, MessageCircle, Plus, Search, Trash2, Users } from "lucide-react";
import LeadModal from "@/components/LeadModal";
import {
  useCreateDeal,
  useCurrentProfile,
  useDeals,
  useDeleteDeal,
  useMoveDealStage,
  usePipelineStages,
  useServices,
  useTeam,
  useUpdateDeal,
} from "@/hooks/useCrm";
import { whatsappUrl, type DealFormPayload, type DealView } from "@/services/crmService";
import { formatCurrency } from "@/utils/formatters";

type ViewMode = "table" | "kanban";

export default function LeadsSection() {
  const { data: profile } = useCurrentProfile();
  const { data: deals = [], isLoading } = useDeals();
  const { data: stages = [] } = usePipelineStages();
  const { data: services = [] } = useServices();
  const { data: team = [] } = useTeam(profile?.role === "admin");
  const createM = useCreateDeal();
  const updateM = useUpdateDeal();
  const moveM = useMoveDealStage();
  const deleteM = useDeleteDeal();

  const [view, setView] = useState<ViewMode>("kanban");
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [modal, setModal] = useState<{ open: boolean; deal: DealView | null }>({ open: false, deal: null });

  const visibleTeam = profile?.role === "admin" ? team : profile ? [profile] : [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return deals.filter(d => {
      const matchStage = stageFilter === "all" || d.stage_id === stageFilter;
      const haystack = [
        d.contact.full_name,
        d.contact.phone_e164,
        d.contact.email,
        d.contact.company,
        d.service?.name,
        d.setter?.full_name,
        d.closer?.full_name,
        d.source,
        d.next_action,
      ].filter(Boolean).join(" ").toLowerCase();
      return matchStage && (!q || haystack.includes(q));
    });
  }, [deals, search, stageFilter]);

  if (!profile) return null;

  const save = async (payload: DealFormPayload) => {
    if (modal.deal) await updateM.mutateAsync({ deal: modal.deal, payload });
    else await createM.mutateAsync({ payload, profile });
    setModal({ open: false, deal: null });
  };

  const remove = async (deal: DealView) => {
    if (!window.confirm(`¿Eliminar permanentemente la oportunidad de ${deal.contact.full_name}?`)) return;
    await deleteM.mutateAsync(deal);
  };

  const move = async (dealId: string, stageId: string) => {
    await moveM.mutateAsync({ id: dealId, stage_id: stageId });
  };

  return (
    <div className="p-5 md:p-6 max-w-[1500px] mx-auto space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-56 flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar lead, empresa, servicio..."
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 outline-none focus:border-slate-600" />
        </div>

        <select value={stageFilter} onChange={e => setStageFilter(e.target.value)}
          className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-400 outline-none">
          <option value="all">Todas las etapas</option>
          {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>

        <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-0.5">
          <button onClick={() => setView("kanban")} className={`px-2.5 py-1.5 rounded-md text-xs flex items-center gap-1.5 ${view === "kanban" ? "bg-slate-700 text-white" : "text-slate-500"}`}>
            <KanbanSquare size={13} /> Kanban
          </button>
          <button onClick={() => setView("table")} className={`px-2.5 py-1.5 rounded-md text-xs flex items-center gap-1.5 ${view === "table" ? "bg-slate-700 text-white" : "text-slate-500"}`}>
            <List size={13} /> Tabla
          </button>
        </div>

        <span className="text-xs text-slate-600 ml-auto">{filtered.length} oportunidades</span>
        <button onClick={() => setModal({ open: true, deal: null })}
          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5">
          <Plus size={13} /> Nuevo lead
        </button>
      </div>

      {isLoading ? (
        <div className="h-64 bg-slate-900 border border-slate-800 rounded-xl animate-pulse" />
      ) : view === "kanban" ? (
        <Kanban deals={filtered} stages={stages} onMove={move} onEdit={deal => setModal({ open: true, deal })} />
      ) : (
        <DealsTable deals={filtered} stages={stages} isAdmin={profile.role === "admin"} onMove={move} onEdit={deal => setModal({ open: true, deal })} onDelete={remove} />
      )}

      <LeadModal
        isOpen={modal.open}
        deal={modal.deal}
        stages={stages}
        services={services}
        team={visibleTeam}
        currentProfile={profile}
        isSubmitting={createM.isPending || updateM.isPending}
        onClose={() => setModal({ open: false, deal: null })}
        onSubmit={save}
      />
    </div>
  );
}

function Kanban({ deals, stages, onMove, onEdit }: {
  deals: DealView[];
  stages: { id: string; name: string; position: number }[];
  onMove: (dealId: string, stageId: string) => Promise<void>;
  onEdit: (deal: DealView) => void;
}) {
  return (
    <div className="overflow-x-auto pb-3">
      <div className="flex gap-3 min-w-max">
        {stages.map(stage => {
          const stageDeals = deals.filter(d => d.stage_id === stage.id);
          const total = stageDeals.reduce((sum, d) => sum + Number(d.potential_value_usd || 0), 0);
          return (
            <section key={stage.id}
              onDragOver={e => e.preventDefault()}
              onDrop={e => {
                const id = e.dataTransfer.getData("text/deal-id");
                if (id) void onMove(id, stage.id);
              }}
              className="w-72 bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden">
              <div className="px-3.5 py-3 border-b border-slate-800 bg-slate-900">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-200">{stage.name}</h3>
                  <span className="text-[10px] text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">{stageDeals.length}</span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1">{formatCurrency(total)}</p>
              </div>
              <div className="p-2 space-y-2 min-h-40">
                {stageDeals.map(deal => (
                  <DealCard key={deal.id} deal={deal} onEdit={() => onEdit(deal)} />
                ))}
                {stageDeals.length === 0 && <div className="border border-dashed border-slate-800 rounded-lg py-8 text-center text-[11px] text-slate-700">Arrastra un lead aquí</div>}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function DealCard({ deal, onEdit }: { deal: DealView; onEdit: () => void }) {
  return (
    <article draggable
      onDragStart={e => e.dataTransfer.setData("text/deal-id", deal.id)}
      className="bg-slate-950 border border-slate-800 rounded-lg p-3 cursor-grab active:cursor-grabbing hover:border-slate-700">
      <div className="flex gap-2 items-start">
        <button onClick={onEdit} className="text-left flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-200 truncate">{deal.contact.full_name}</p>
          <p className="text-[11px] text-slate-600 truncate mt-0.5">{deal.service?.name || "Sin servicio"}</p>
        </button>
        <span className="text-xs font-bold text-white">{formatCurrency(Number(deal.potential_value_usd || 0))}</span>
      </div>
      <div className="mt-3 flex items-center gap-2">
        {deal.contact.phone_e164 && (
          <a href={whatsappUrl(deal.contact.phone_e164)} target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300">
            <MessageCircle size={12} /> WhatsApp
          </a>
        )}
        {deal.next_follow_up_at && (
          <span className="ml-auto inline-flex items-center gap-1 text-[10px] text-slate-500">
            <CalendarClock size={11} /> {new Date(deal.next_follow_up_at).toLocaleDateString("es-EC")}
          </span>
        )}
      </div>
      <div className="mt-2 text-[10px] text-slate-600 truncate">
        {deal.setter?.full_name || deal.closer?.full_name || "Sin asignar"}
      </div>
    </article>
  );
}

function DealsTable({ deals, stages, isAdmin, onMove, onEdit, onDelete }: {
  deals: DealView[];
  stages: { id: string; name: string }[];
  isAdmin: boolean;
  onMove: (dealId: string, stageId: string) => Promise<void>;
  onEdit: (deal: DealView) => void;
  onDelete: (deal: DealView) => Promise<void>;
}) {
  if (!deals.length) {
    return <div className="bg-slate-900 border border-slate-800 rounded-xl py-20 text-center"><Users size={28} className="mx-auto text-slate-700 mb-3" /><p className="text-sm text-slate-500">No hay oportunidades</p></div>;
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto">
      <table className="w-full min-w-[1000px]">
        <thead className="bg-slate-950/60 border-b border-slate-800">
          <tr>{["Prospecto", "WhatsApp", "Servicio", "Valor", "Responsable", "Etapa", "Seguimiento", ""].map(h => <th key={h} className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-slate-500">{h}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60">
          {deals.map(deal => (
            <tr key={deal.id} className="hover:bg-slate-800/20">
              <td className="px-4 py-3">
                <p className="text-sm font-semibold text-slate-200">{deal.contact.full_name}</p>
                <p className="text-[11px] text-slate-600">{deal.contact.company || deal.contact.email || "—"}</p>
              </td>
              <td className="px-4 py-3">
                {deal.contact.phone_e164 ? <a href={whatsappUrl(deal.contact.phone_e164)} target="_blank" rel="noreferrer" className="text-emerald-400 text-xs inline-flex items-center gap-1"><MessageCircle size={12} /> Abrir</a> : <span className="text-slate-700">—</span>}
              </td>
              <td className="px-4 py-3 text-xs text-slate-400">{deal.service?.name || "—"}</td>
              <td className="px-4 py-3 text-sm font-bold text-white">{formatCurrency(Number(deal.potential_value_usd || 0))}</td>
              <td className="px-4 py-3 text-xs text-slate-400">{deal.closer?.full_name || deal.setter?.full_name || "Sin asignar"}</td>
              <td className="px-4 py-3">
                <select value={deal.stage_id} onChange={e => void onMove(deal.id, e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-md px-2 py-1.5 text-xs text-slate-300">
                  {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </td>
              <td className="px-4 py-3 text-xs text-slate-500">
                {deal.next_follow_up_at ? new Date(deal.next_follow_up_at).toLocaleString("es-EC", { dateStyle: "short", timeStyle: "short" }) : "—"}
              </td>
              <td className="px-4 py-3">
                <div className="flex gap-1">
                  <button onClick={() => onEdit(deal)} className="w-7 h-7 rounded-md bg-slate-800 grid place-items-center text-slate-400 hover:text-blue-400"><Edit2 size={12} /></button>
                  {isAdmin && <button onClick={() => void onDelete(deal)} className="w-7 h-7 rounded-md bg-slate-800 grid place-items-center text-slate-500 hover:text-red-400"><Trash2 size={12} /></button>}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
