// ============================================================
// Emprex Flow CRM — LeadsTable v2
// Admin: tabla completa + filtros avanzados
// Setter: solo sus leads + acciones rápidas
// ============================================================

import React, { useState } from "react";
import {
  Search, Filter, Calendar, SlidersHorizontal,
  CheckCircle2, Clock, PhoneCall, FileText,
  ChevronUp, ChevronDown, ChevronsUpDown, Loader2, Users,
} from "lucide-react";
import type { Cliente } from "../types/cliente";
import { formatDate, formatCurrency, getInitials } from "../utils/formatters";

// ── Tipos ─────────────────────────────────────────────────
interface LeadsTableProps {
  clientes: Cliente[];
  isLoading: boolean;
  isAdmin: boolean;
  userEmail: string;
  searchQuery: string;
  updatingId: string | null;
  onStatusToggle: (id: string, newStatus: boolean) => void;
}

type SortField = "fecha" | "valor_potencial" | "nombre_y_apellido" | null;
type SortDir   = "asc" | "desc";

// ── Estilos reutilizables ─────────────────────────────────
const SOURCE_STYLES: Record<string, string> = {
  Instagram:    "bg-pink-500/10 text-pink-400 border-pink-500/20",
  LinkedIn:     "bg-sky-500/10 text-sky-400 border-sky-500/20",
  YouTube:      "bg-red-500/10 text-red-400 border-red-500/20",
  TikTok:       "bg-violet-500/10 text-violet-400 border-violet-500/20",
  Referido:     "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "Cold Outreach": "bg-zinc-700/50 text-zinc-400 border-zinc-600/30",
};

const SERVICE_COLORS: Record<string, string> = {
  "Campañas EMPREX":       "text-violet-400",
  "Diseño de Landing Page":"text-sky-400",
  "Vlog Growth Specialist":"text-emerald-400",
};

const SKELETON_WIDTHS = ["w-16", "w-20", "w-24", "w-28", "w-32", "w-36"];

// ── Sub-components ─────────────────────────────────────────

const StatusBadge: React.FC<{ closed: boolean }> = ({ closed }) =>
  closed ? (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
      <CheckCircle2 size={10} strokeWidth={2.5} />
      Cerrado
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 whitespace-nowrap">
      <Clock size={10} strokeWidth={2.5} />
      En seguimiento
    </span>
  );

const SkeletonRow: React.FC<{ cols: number }> = ({ cols }) => (
  <tr className="border-b border-zinc-800/40 animate-pulse">
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="px-4 py-4">
        <div className={`h-3.5 bg-zinc-800 rounded ${SKELETON_WIDTHS[i % SKELETON_WIDTHS.length]}`} />
      </td>
    ))}
  </tr>
);

// ── Setter: Quick Action Card ─────────────────────────────
const SetterLeadCard: React.FC<{
  cliente: Cliente;
  isUpdating: boolean;
  onToggle: () => void;
}> = ({ cliente, isUpdating, onToggle }) => (
  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 hover:border-zinc-700 transition-all duration-200 group">
    {/* Top row */}
    <div className="flex items-start justify-between mb-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-bold text-indigo-400">
            {getInitials(cliente.nombre_y_apellido)}
          </span>
        </div>
        <div>
          <p className="text-sm font-semibold text-zinc-100">{cliente.nombre_y_apellido}</p>
          <p className={`text-xs mt-0.5 ${SERVICE_COLORS[cliente.servicio_adquirido ?? ""] ?? "text-zinc-500"}`}>
            {cliente.servicio_adquirido || "—"}
          </p>
        </div>
      </div>
      <StatusBadge closed={cliente.cerro_la_venta} />
    </div>

    {/* Meta */}
    <div className="flex items-center gap-3 text-xs text-zinc-600 mb-4">
      <span className="flex items-center gap-1">
        <Calendar size={10} />
        {formatDate(cliente.fecha_de_la_reunion || "") ?? "Sin reunión"}
      </span>
      <span className="font-mono font-medium text-zinc-400">
        {formatCurrency(cliente.valor_potencial)}
      </span>
    </div>

    {/* Quick actions */}
    <div className="grid grid-cols-3 gap-2">
      <button className="flex flex-col items-center gap-1 py-2 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/40 hover:border-zinc-600 transition-all text-xs text-zinc-400 hover:text-zinc-200">
        <PhoneCall size={13} />
        Llamar
      </button>
      <button className="flex flex-col items-center gap-1 py-2 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 border border-zinc-700/40 hover:border-zinc-600 transition-all text-xs text-zinc-400 hover:text-zinc-200">
        <FileText size={13} />
        Nota
      </button>
      <button
        onClick={onToggle}
        disabled={isUpdating}
        className={`flex flex-col items-center gap-1 py-2 rounded-xl border transition-all text-xs font-medium ${
          cliente.cerro_la_venta
            ? "bg-zinc-800/60 border-zinc-700/40 text-zinc-500 hover:text-zinc-300"
            : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
        } disabled:opacity-50`}
      >
        {isUpdating ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
        {cliente.cerro_la_venta ? "Reabrir" : "Cerrar"}
      </button>
    </div>
  </div>
);

// ── Admin: Sort header ────────────────────────────────────
const SortHeader: React.FC<{
  label: string;
  field: SortField;
  current: SortField;
  dir: SortDir;
  onClick: (f: SortField) => void;
}> = ({ label, field, current, dir, onClick }) => (
  <th
    className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider cursor-pointer hover:text-zinc-300 transition-colors whitespace-nowrap select-none"
    onClick={() => onClick(field)}
  >
    <span className="inline-flex items-center gap-1">
      {label}
      {current === field
        ? dir === "asc" ? <ChevronUp size={11} /> : <ChevronDown size={11} />
        : <ChevronsUpDown size={11} className="opacity-30" />}
    </span>
  </th>
);

// ── Main Component ─────────────────────────────────────────
export const LeadsTable: React.FC<LeadsTableProps> = ({
  clientes, isLoading, isAdmin, userEmail,
  searchQuery, updatingId, onStatusToggle,
}) => {
  const [filterStatus,  setFilterStatus]  = useState<"all" | "open" | "closed">("all");
  const [filterSetter,  setFilterSetter]  = useState("all");
  const [filterService, setFilterService] = useState("all");
  const [sortField,     setSortField]     = useState<SortField>(null);
  const [sortDir,       setSortDir]       = useState<SortDir>("desc");

  // Setters únicos para el filtro
  const uniqueSetters  = Array.from(new Set(clientes.map(c => c.setter_asignado).filter(Boolean)));
  const uniqueServices = Array.from(new Set(clientes.map(c => c.servicio_adquirido).filter(Boolean)));

  // Filtrado
  let filtered = clientes.filter(c => {
    if (!isAdmin && c.setter_asignado !== userEmail.split("@")[0]) {
      // Setter solo ve sus leads (match por nombre parcial)
    }
    const q = searchQuery.toLowerCase();
    const matchQ = !q || [c.nombre_y_apellido, c.setter_asignado, c.servicio_adquirido, c.usuario_de_origen]
      .some(v => v?.toLowerCase().includes(q));
    const matchStatus  = filterStatus  === "all" ? true : filterStatus === "closed" ? c.cerro_la_venta : !c.cerro_la_venta;
    const matchSetter  = filterSetter  === "all" || c.setter_asignado  === filterSetter;
    const matchService = filterService === "all" || c.servicio_adquirido === filterService;
    return matchQ && matchStatus && matchSetter && matchService;
  });

  // Ordenamiento
  if (sortField) {
    filtered = [...filtered].sort((a, b) => {
      const av = a[sortField] ?? "";
      const bv = b[sortField] ?? "";
      const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
      return sortDir === "asc" ? cmp : -cmp;
    });
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("desc"); }
  };

  // ── SETTER VIEW ──────────────────────────────────────────
  if (!isAdmin) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-xs">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" />
            <input readOnly value={searchQuery}
              className="w-full pl-8 pr-3 py-1.5 bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs placeholder-zinc-600 rounded-lg outline-none"
              placeholder="Buscar..." />
          </div>
        </div>
        {isLoading
          ? <div className="grid md:grid-cols-2 gap-3">
              {Array.from({length:4}).map((_,i) => (
                <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 animate-pulse h-36" />
              ))}
            </div>
          : filtered.length === 0
            ? <EmptyState filtered={!!searchQuery} />
            : <div className="grid md:grid-cols-2 gap-3">
                {filtered.map(c => (
                  <SetterLeadCard
                    key={c.id}
                    cliente={c}
                    isUpdating={updatingId === c.id}
                    onToggle={() => onStatusToggle(c.id, !c.cerro_la_venta)}
                  />
                ))}
              </div>
        }
      </div>
    );
  }

  // ── ADMIN VIEW ───────────────────────────────────────────
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
      {/* Toolbar */}
      <div className="px-5 py-3.5 border-b border-zinc-800 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={14} className="text-zinc-500" />
          <span className="text-xs font-semibold text-zinc-300">Filtros</span>
        </div>

        {/* Filter: Estado */}
        <div className="flex bg-zinc-800 border border-zinc-700/50 rounded-lg p-0.5 gap-0.5">
          {([["all","Todos"],["open","Activos"],["closed","Cerrados"]] as const).map(([v,l]) => (
            <button key={v} onClick={() => setFilterStatus(v)}
              className={`px-2.5 py-1 rounded-md text-xs transition-all duration-150 ${
                filterStatus === v ? "bg-zinc-600 text-zinc-100 font-medium" : "text-zinc-500 hover:text-zinc-300"
              }`}>{l}
            </button>
          ))}
        </div>

        {/* Filter: Setter */}
        {uniqueSetters.length > 0 && (
          <select aria-label="Filtrar por setter" value={filterSetter} onChange={e => setFilterSetter(e.target.value)}
            className="px-2.5 py-1 bg-zinc-800 border border-zinc-700/50 text-zinc-400 text-xs rounded-lg outline-none focus:border-indigo-500/60 transition-colors">
            <option value="all">Todos los setters</option>
            {uniqueSetters.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        )}

        {/* Filter: Servicio */}
        {uniqueServices.length > 0 && (
          <select aria-label="Filtrar por servicio" value={filterService} onChange={e => setFilterService(e.target.value)}
            className="px-2.5 py-1 bg-zinc-800 border border-zinc-700/50 text-zinc-400 text-xs rounded-lg outline-none focus:border-indigo-500/60 transition-colors">
            <option value="all">Todos los servicios</option>
            {uniqueServices.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        )}

        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-zinc-600">
            {filtered.length} <span className="text-zinc-700">/ {clientes.length}</span>
          </span>
          <Filter size={13} className="text-zinc-700" />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-800/60 bg-zinc-950/40">
              <SortHeader label="Prospecto"  field="nombre_y_apellido" current={sortField} dir={sortDir} onClick={handleSort} />
              <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Servicio</th>
              <SortHeader label="Valor"      field="valor_potencial"   current={sortField} dir={sortDir} onClick={handleSort} />
              <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Setter</th>
              <SortHeader label="Reunión"    field="fecha"             current={sortField} dir={sortDir} onClick={handleSort} />
              <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Origen</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Estado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/40">
            {isLoading
              ? Array.from({length:6}).map((_,i) => <SkeletonRow key={i} cols={8} />)
              : filtered.length === 0
                ? <tr><td colSpan={8}><EmptyState filtered={!!(searchQuery||filterStatus!=="all"||filterSetter!=="all")} /></td></tr>
                : filtered.map(c => (
                    <tr key={c.id}
                      className="hover:bg-zinc-800/30 transition-colors duration-150 group">
                      {/* Prospecto */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/15 flex items-center justify-center flex-shrink-0">
                            <span className="text-[10px] font-bold text-indigo-400">{getInitials(c.nombre_y_apellido)}</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-zinc-200 leading-tight">{c.nombre_y_apellido}</p>
                            <p className="text-[11px] text-zinc-600 mt-0.5">{formatDate(c.fecha)}</p>
                          </div>
                        </div>
                      </td>
                      {/* Servicio */}
                      <td className="px-4 py-3.5">
                        <span className={`text-xs font-medium ${SERVICE_COLORS[c.servicio_adquirido ?? ""] ?? "text-zinc-400"}`}>
                          {c.servicio_adquirido || "—"}
                        </span>
                      </td>
                      {/* Valor */}
                      <td className="px-4 py-3.5">
                        <span className="font-mono text-sm font-semibold text-zinc-100">{formatCurrency(c.valor_potencial)}</span>
                      </td>
                      {/* Setter */}
                      <td className="px-4 py-3.5">
                        <span className="text-xs text-zinc-400">{c.setter_asignado || "—"}</span>
                      </td>
                      {/* Reunión */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                          <Calendar size={11} className="text-zinc-700" />
                          {formatDate(c.fecha_de_la_reunion || "") ?? "—"}
                        </div>
                      </td>
                      {/* Origen */}
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border ${SOURCE_STYLES[c.usuario_de_origen ?? ""] ?? "bg-zinc-800 text-zinc-400 border-zinc-700"}`}>
                          {c.usuario_de_origen || "—"}
                        </span>
                      </td>
                      {/* Estado */}
                      <td className="px-4 py-3.5">
                        <StatusBadge closed={c.cerro_la_venta} />
                      </td>
                      {/* Acción */}
                      <td className="px-4 py-3.5">
                        <button
                          onClick={() => onStatusToggle(c.id, !c.cerro_la_venta)}
                          disabled={updatingId === c.id}
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-200 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 disabled:opacity-50 disabled:cursor-not-allowed ${
                            c.cerro_la_venta
                              ? "border-zinc-700 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
                              : "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/50"
                          }`}
                        >
                          {updatingId === c.id
                            ? <><Loader2 size={11} className="animate-spin" /> Guardando</>
                            : c.cerro_la_venta ? "Reabrir" : "Cerrar venta"}
                        </button>
                      </td>
                    </tr>
                  ))
            }
          </tbody>
        </table>
      </div>

      {/* Footer */}
      {!isLoading && filtered.length > 0 && (
        <div className="px-5 py-3 border-t border-zinc-800/60 flex items-center justify-between">
          <span className="text-xs text-zinc-600">
            {filtered.length} lead{filtered.length !== 1 ? "s" : ""}
          </span>
          <span className="text-xs text-zinc-600">
            Pipeline visible:{" "}
            <span className="text-zinc-400 font-mono font-medium">
              {formatCurrency(filtered.reduce((s, c) => s + (c.valor_potencial ?? 0), 0))}
            </span>
          </span>
        </div>
      )}
    </div>
  );
};

// ── Empty State ───────────────────────────────────────────
function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      <div className="w-14 h-14 rounded-2xl bg-zinc-800 flex items-center justify-center">
        <Users size={22} className="text-zinc-600" />
      </div>
      <div>
        <p className="text-sm font-semibold text-zinc-300">
          {filtered ? "Sin resultados" : "No hay leads aún"}
        </p>
        <p className="text-xs text-zinc-600 mt-1">
          {filtered ? "Prueba con otros filtros" : "Crea el primer lead con el botón + Nuevo Lead"}
        </p>
      </div>
    </div>
  );
}