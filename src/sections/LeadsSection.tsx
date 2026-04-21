// ============================================================
// Emprex Flow — Sección: Leads (CRUD completo)
// ============================================================
import { useState } from "react";
import {
  Plus, Search, Edit2, Trash2, CheckCircle2,
  Clock, Calendar, Loader2, Users,
  ChevronUp, ChevronDown, ChevronsUpDown, Eye,
} from "lucide-react";
import { useClientes, useCreateCliente, useUpdateCliente, useDeleteCliente, useToggleClienteStatus } from "@/hooks/useClientes";
import LeadModal from "@/components/LeadModal";
import { formatCurrency, formatDate, getInitials } from "@/utils/formatters";
import type { Cliente, ClienteInsert } from "@/types/cliente";

type Sort = { field: keyof Cliente | null; dir: "asc" | "desc" };

const SRC: Record<string,string> = {
  Instagram:    "bg-pink-900/30 text-pink-400 border-pink-800/40",
  LinkedIn:     "bg-sky-900/30 text-sky-400 border-sky-800/40",
  TikTok:       "bg-violet-900/30 text-violet-400 border-violet-800/40",
  YouTube:      "bg-red-900/30 text-red-400 border-red-800/40",
  Referido:     "bg-amber-900/30 text-amber-400 border-amber-800/40",
};

const SVC: Record<string,string> = {
  "Campañas EMPREX":        "text-blue-400",
  "Diseño de Landing Page": "text-cyan-400",
  "Vlog Growth Specialist": "text-emerald-400",
};

const WIDTH_CLASSES: Record<number,string> = {
  0: "w-0",
  10: "w-[10%]",
  20: "w-[20%]",
  30: "w-[30%]",
  40: "w-[40%]",
  50: "w-[50%]",
  60: "w-[60%]",
  70: "w-[70%]",
  80: "w-[80%]",
  90: "w-[90%]",
  100: "w-[100%]",
};

const SKELETON_WIDTHS = ["w-16", "w-20", "w-24", "w-28", "w-32", "w-36"];

interface Props { isAdmin: boolean; userEmail: string; }

export default function LeadsSection({ isAdmin, userEmail }: Props) {
  const { data: all = [], isLoading } = useClientes();
  const createM = useCreateCliente();
  const updateM = useUpdateCliente();
  const deleteM = useDeleteCliente();
  const toggleM = useToggleClienteStatus();

  const [search,    setSearch]    = useState("");
  const [fStatus,   setFStatus]   = useState<"all"|"open"|"closed">("all");
  const [fSetter,   setFSetter]   = useState("all");
  const [fService,  setFService]  = useState("all");
  const [sort,      setSort]      = useState<Sort>({ field: "created_at", dir: "desc" });
  const [modal,     setModal]     = useState<{ open: boolean; lead: Cliente | null }>({ open: false, lead: null });
  const [deleting,  setDeleting]  = useState<string | null>(null);
  const [preview,   setPreview]   = useState<Cliente | null>(null);

  const setters  = Array.from(new Set(all.map(c => c.setter_asignado).filter(Boolean)));
  const services = Array.from(new Set(all.map(c => c.servicio_adquirido).filter(Boolean)));

  // Filtrar
  let list = all.filter(c => {
    const q = search.toLowerCase();
    const matchQ = !q || [c.nombre_y_apellido, c.setter_asignado, c.servicio_adquirido, c.notas || "", c.usuario_de_origen]
      .some(v => v?.toLowerCase().includes(q));
    const matchS  = fStatus  === "all" ? true : fStatus  === "closed" ? c.cerro_la_venta : !c.cerro_la_venta;
    const matchSt = fSetter  === "all" || c.setter_asignado  === fSetter;
    const matchSv = fService === "all" || c.servicio_adquirido === fService;
    const matchUser = isAdmin || c.setter_asignado === userEmail.split("@")[0];
    return matchQ && matchS && matchSt && matchSv && matchUser;
  });

  // Ordenar
  if (sort.field) {
    list = [...list].sort((a, b) => {
      const av = (a as any)[sort.field!] ?? "";
      const bv = (b as any)[sort.field!] ?? "";
      const cmp = typeof av === "number"
        ? av - bv
        : String(av).localeCompare(String(bv), undefined, { numeric: true });
      return sort.dir === "asc" ? cmp : -cmp;
    });
  }

  const handleSort = (field: keyof Cliente) => {
    setSort(s => s.field === field ? { field, dir: s.dir === "asc" ? "desc" : "asc" } : { field, dir: "desc" });
  };

  const SortIcon = ({ field }: { field: keyof Cliente }) => {
    if (sort.field !== field) return <ChevronsUpDown size={11} className="opacity-30" />;
    return sort.dir === "asc" ? <ChevronUp size={11} /> : <ChevronDown size={11} />;
  };

  const handleSave = async (data: ClienteInsert) => {
    if (modal.lead) {
      await updateM.mutateAsync({ id: modal.lead.id, payload: data });
    } else {
      await createM.mutateAsync(data);
    }
    setModal({ open: false, lead: null });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Eliminar este lead? Esta acción no se puede deshacer.")) return;
    setDeleting(id);
    await deleteM.mutateAsync(id);
    setDeleting(null);
    if (preview?.id === id) setPreview(null);
  };

  const isSubmitting = createM.isPending || updateM.isPending;

  return (
    <div className="p-5 md:p-7 max-w-7xl mx-auto space-y-4">

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-48 max-w-72">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre, setter, servicio..."
            className="w-full pl-8 pr-3 py-2 bg-slate-900 border border-slate-800 text-slate-300 text-xs placeholder-slate-600 rounded-xl outline-none focus:border-blue-600/60 transition-colors" />
        </div>

        {/* Filtros */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-0.5 gap-0.5">
            {(["all","open","closed"] as const).map(v => (
              <button key={v} onClick={() => setFStatus(v)}
                className={`px-3 py-1.5 rounded-lg text-xs transition-all ${fStatus===v?"bg-blue-600/20 text-blue-400 font-semibold border border-blue-700/30":"text-slate-500 hover:text-slate-300"}`}>
                {v==="all"?"Todos":v==="open"?"Activos":"Cerrados"}
              </button>
            ))}
          </div>
          {isAdmin && (
            <>
              <select aria-label="Filtrar leads por setter" value={fSetter} onChange={e=>setFSetter(e.target.value)}
                className="px-3 py-1.5 bg-slate-900 border border-slate-800 text-slate-400 text-xs rounded-xl outline-none focus:border-blue-600/60">
                <option value="all">Todos los setters</option>
                {setters.map(s=><option key={s} value={s}>{s}</option>)}
              </select>
              <select aria-label="Filtrar leads por servicio" value={fService} onChange={e=>setFService(e.target.value)}
                className="px-3 py-1.5 bg-slate-900 border border-slate-800 text-slate-400 text-xs rounded-xl outline-none focus:border-blue-600/60">
                <option value="all">Todos los servicios</option>
                {services.map(s=><option key={s} value={s}>{s}</option>)}
              </select>
            </>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-slate-600">{list.length} leads</span>
          <button onClick={() => setModal({ open: true, lead: null })}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-blue-900/30">
            <Plus size={14} strokeWidth={2.5} /> Nuevo Lead
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/50">
                {[
                  { label:"Prospecto", field:"nombre_y_apellido" as keyof Cliente },
                  { label:"Servicio",  field:null },
                  { label:"Valor",     field:"valor_potencial" as keyof Cliente },
                  { label:"Setter",    field:"setter_asignado" as keyof Cliente },
                  { label:"Reunión",   field:"fecha_de_la_reunion" as keyof Cliente },
                  { label:"Origen",    field:null },
                  { label:"Estado",    field:null },
                ].map(({ label, field }) => (
                  <th key={label}
                    onClick={() => field && handleSort(field)}
                    className={`px-4 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap ${field?"cursor-pointer hover:text-slate-300 select-none":""} transition-colors`}>
                    <span className="inline-flex items-center gap-1">
                      {label}
                      {field && <SortIcon field={field} />}
                    </span>
                  </th>
                ))}
                <th className="px-4 py-3 w-24" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {isLoading
                ? Array.from({length:5}).map((_,i) => (
                    <tr key={i} className="animate-pulse">
                      {Array.from({length:8}).map((_,j) => (
                        <td key={j} className="px-4 py-4">
                          <div className={`h-3.5 bg-slate-800 rounded ${SKELETON_WIDTHS[(i*j) % SKELETON_WIDTHS.length]}`} />
                        </td>
                      ))}
                    </tr>
                  ))
                : list.length === 0
                  ? <tr><td colSpan={8}>
                      <div className="flex flex-col items-center py-16 gap-3 text-center">
                        <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center">
                          <Users size={22} className="text-slate-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-400">Sin resultados</p>
                          <p className="text-xs text-slate-600 mt-1">
                            {search || fStatus!=="all" ? "Prueba otros filtros" : "Crea el primer lead con el botón +"}
                          </p>
                        </div>
                      </div>
                    </td></tr>
                  : list.map(c => (
                      <tr key={c.id}
                        className="hover:bg-slate-800/30 transition-colors duration-150 group cursor-default">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-900/40 border border-blue-800/30 flex items-center justify-center flex-shrink-0">
                              <span className="text-[10px] font-bold text-blue-400">{getInitials(c.nombre_y_apellido)}</span>
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-200 leading-tight">{c.nombre_y_apellido}</p>
                              <p className="text-[11px] text-slate-600 mt-0.5">{formatDate(c.fecha)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`text-xs font-medium ${SVC[c.servicio_adquirido || ""] || "text-slate-400"}`}>
                            {c.servicio_adquirido || "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-sm font-bold text-slate-100 tabular-nums">
                            {formatCurrency(c.valor_potencial)}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-xs text-slate-400">{c.setter_asignado || "—"}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <Calendar size={11} className="text-slate-700" />
                            {c.fecha_de_la_reunion ? formatDate(c.fecha_de_la_reunion) : "—"}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${SRC[c.usuario_de_origen || ""] || "bg-slate-800 text-slate-400 border-slate-700"}`}>
                            {c.usuario_de_origen || "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          {c.cerro_la_venta
                            ? <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-900/30 text-emerald-400 border border-emerald-800/40 whitespace-nowrap">
                                <CheckCircle2 size={10} />Cerrado
                              </span>
                            : <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-900/30 text-amber-400 border border-amber-800/40 whitespace-nowrap">
                                <Clock size={10} />Activo
                              </span>}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setPreview(c)}
                              title="Ver detalle"
                              className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-all">
                              <Eye size={12} />
                            </button>
                            <button onClick={() => setModal({ open: true, lead: c })}
                              title="Editar"
                              className="w-7 h-7 rounded-lg bg-blue-900/40 hover:bg-blue-900/70 border border-blue-800/40 flex items-center justify-center text-blue-400 hover:text-blue-300 transition-all">
                              <Edit2 size={12} />
                            </button>
                            <button
                              onClick={() => toggleM.mutate({ id: c.id, cerro_la_venta: !c.cerro_la_venta })}
                              disabled={toggleM.isPending && toggleM.variables?.id === c.id}
                              title={c.cerro_la_venta ? "Reabrir" : "Cerrar venta"}
                              className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-all disabled:opacity-50 ${c.cerro_la_venta ? "bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300" : "bg-emerald-900/30 border-emerald-800/40 text-emerald-400 hover:bg-emerald-900/60"}`}>
                              {toggleM.isPending && toggleM.variables?.id === c.id
                                ? <Loader2 size={11} className="animate-spin" />
                                : <CheckCircle2 size={11} />}
                            </button>
                            {isAdmin && (
                              <button onClick={() => handleDelete(c.id)}
                                disabled={deleting === c.id}
                                title="Eliminar"
                                className="w-7 h-7 rounded-lg bg-red-900/20 hover:bg-red-900/50 border border-red-900/40 flex items-center justify-center text-red-500 hover:text-red-400 transition-all disabled:opacity-50">
                                {deleting === c.id ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
              }
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {!isLoading && list.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-800/60 flex items-center justify-between">
            <span className="text-xs text-slate-600">{list.length} de {all.length} leads</span>
            <span className="text-xs text-slate-600">
              Pipeline: <span className="text-slate-400 font-mono font-bold">
                {formatCurrency(list.reduce((s,c)=>s+(c.valor_potencial??0),0))}
              </span>
            </span>
          </div>
        )}
      </div>

      {/* Panel de detalle (preview) */}
      {preview && (
        <div className="fixed inset-y-0 right-0 w-80 bg-slate-900 border-l border-slate-800 z-40 flex flex-col shadow-2xl">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
            <h3 className="text-sm font-bold text-slate-100">Detalle del Lead</h3>
            <button onClick={() => setPreview(null)} className="text-slate-600 hover:text-slate-300">✕</button>
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-900/40 border border-blue-800/30 flex items-center justify-center">
                <span className="text-sm font-bold text-blue-400">{getInitials(preview.nombre_y_apellido)}</span>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-100">{preview.nombre_y_apellido}</p>
                {preview.cerro_la_venta
                  ? <span className="text-xs text-emerald-400">● Cerrado</span>
                  : <span className="text-xs text-amber-400">● Activo</span>}
              </div>
            </div>
            {[
              { label:"Servicio",     value:preview.servicio_adquirido },
              { label:"Valor",        value:formatCurrency(preview.valor_potencial) },
              { label:"Setter",       value:preview.setter_asignado },
              { label:"Origen",       value:preview.usuario_de_origen },
              { label:"Fecha ingreso",value:formatDate(preview.fecha) },
              { label:"Fecha reunión",value:preview.fecha_de_la_reunion ? formatDate(preview.fecha_de_la_reunion) : "—" },
            ].map(({label,value})=>(
              <div key={label} className="border-b border-slate-800 pb-3">
                <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-1">{label}</p>
                <p className="text-sm text-slate-200 font-medium">{value || "—"}</p>
              </div>
            ))}
            {preview.notas && (
              <div>
                <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-1">Notas</p>
                <p className="text-xs text-slate-400 leading-relaxed">{preview.notas}</p>
              </div>
            )}
          </div>
          <div className="p-4 border-t border-slate-800">
            <button onClick={() => { setModal({ open: true, lead: preview }); setPreview(null); }}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2">
              <Edit2 size={13} /> Editar Lead
            </button>
          </div>
        </div>
      )}
      {preview && <div className="fixed inset-0 z-30 bg-black/30" onClick={() => setPreview(null)} />}

      {/* Modal */}
      <LeadModal
        isOpen={modal.open}
        lead={modal.lead}
        isSubmitting={isSubmitting}
        onClose={() => setModal({ open: false, lead: null })}
        onSubmit={handleSave}
      />
    </div>
  );
}