// src/sections/DashboardHome.tsx
import { ArrowRight, TrendingUp, CheckCircle2, Clock, Users, Flame, DollarSign, Target } from "lucide-react";
import { useClientes } from "@/hooks/useClientes";
import { formatCurrency, formatDate, getInitials } from "@/utils/formatters";
import type { Section } from "@/pages/Dashboard";

interface Props { isAdmin: boolean; userEmail: string; onNavigate: (s: Section) => void; }

function KPI({ label, value, sub, loading }: { label: string; value: string; sub: string; loading: boolean }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">{label}</p>
      <p className="text-2xl font-bold text-white tabular-nums">
        {loading
          ? <span className="inline-block w-20 h-7 bg-slate-800 rounded animate-pulse" />
          : value}
      </p>
      <p className="text-xs text-slate-600 mt-1.5">{sub}</p>
    </div>
  );
}

export default function DashboardHome({ isAdmin, userEmail, onNavigate }: Props) {
  const { data: all = [], isLoading } = useClientes();

  const clientes = isAdmin ? all : all.filter(c => c.setter_asignado === userEmail.split("@")[0]);

  const total    = clientes.length;
  const cerrados = clientes.filter(c => c.cerro_la_venta).length;
  const activos  = total - cerrados;
  const conv     = total > 0 ? ((cerrados / total) * 100).toFixed(1) : "0.0";
  const pipeline = clientes.reduce((s, c) => s + (c.valor_potencial ?? 0), 0);
  const revenue  = clientes.filter(c => c.cerro_la_venta).reduce((s, c) => s + (c.valor_potencial ?? 0), 0);

  // Distribución por servicio
  const svcMap: Record<string, { total: number; cerrados: number }> = {};
  clientes.forEach(c => {
    const s = c.servicio_adquirido || "Sin servicio";
    if (!svcMap[s]) svcMap[s] = { total: 0, cerrados: 0 };
    svcMap[s].total++;
    if (c.cerro_la_venta) svcMap[s].cerrados++;
  });
  const svcEntries = Object.entries(svcMap).sort((a, b) => b[1].total - a[1].total);
  const maxSvc = svcEntries[0]?.[1].total || 1;

  // Ranking setters (solo admin)
  const setterMap: Record<string, { total: number; cerrados: number; revenue: number }> = {};
  all.forEach(c => {
    const s = c.setter_asignado || "Sin asignar";
    if (!setterMap[s]) setterMap[s] = { total: 0, cerrados: 0, revenue: 0 };
    setterMap[s].total++;
    if (c.cerro_la_venta) {
      setterMap[s].cerrados++;
      setterMap[s].revenue += c.valor_potencial ?? 0;
    }
  });
  const setterRanking = Object.entries(setterMap).sort((a, b) => b[1].revenue - a[1].revenue);

  // Actividad reciente
  const recientes = [...clientes].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()).slice(0, 5);

  const kpis = [
    { label: "Pipeline Total", value: formatCurrency(pipeline), sub: `${total} leads en total`, loading: isLoading },
    { label: "Tasa de Cierre", value: `${conv}%`, sub: `${cerrados} ventas confirmadas`, loading: isLoading },
    { label: "Leads Activos", value: String(activos), sub: "en seguimiento activo", loading: isLoading },
    { label: "Revenue Real", value: formatCurrency(revenue), sub: "ingresos confirmados", loading: isLoading },
  ];

  return (
    <div className="p-5 md:p-6 max-w-5xl mx-auto space-y-5">

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(k => <KPI key={k.label} {...k} />)}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">

        {/* Pipeline por servicio */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white">Distribución por Servicio</h2>
              <p className="text-xs text-slate-600 mt-0.5">Leads activos por categoría</p>
            </div>
            <button onClick={() => onNavigate("leads")}
              className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors">
              Ver todos <ArrowRight size={11} />
            </button>
          </div>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex justify-between mb-1.5">
                    <div className="h-3 bg-slate-800 rounded w-32" />
                    <div className="h-3 bg-slate-800 rounded w-8" />
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full" />
                </div>
              ))}
            </div>
          ) : svcEntries.length === 0 ? (
            <div className="flex flex-col items-center py-10 gap-2">
              <Users size={24} className="text-slate-700" />
              <p className="text-sm text-slate-600">Sin datos aún</p>
            </div>
          ) : (
            <div className="space-y-4">
              {svcEntries.map(([svc, stats], i) => {
                const pct = Math.round((stats.total / maxSvc) * 100);
                const colors = ["bg-blue-500", "bg-cyan-500", "bg-violet-500", "bg-emerald-500", "bg-amber-500"];
                return (
                  <div key={svc}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium text-slate-300">{svc}</span>
                      <span className="text-xs text-slate-500 font-mono">{stats.total} ({stats.cerrados} cerrados)</span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-700 ${colors[i % colors.length]}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Ranking setters */}
        {isAdmin && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-white">Ranking Setters</h2>
                <p className="text-xs text-slate-600 mt-0.5">Por revenue generado</p>
              </div>
              <Flame size={15} className="text-amber-500" />
            </div>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-12 bg-slate-800 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : setterRanking.length === 0 ? (
              <div className="flex flex-col items-center py-10 gap-2">
                <Users size={24} className="text-slate-700" />
                <p className="text-sm text-slate-600">Sin datos de equipo aún</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {setterRanking.slice(0, 5).map(([name, stats], i) => (
                  <div key={name} className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      i === 0 ? "bg-amber-500/20 text-amber-400" :
                      i === 1 ? "bg-slate-600/50 text-slate-300" :
                      "bg-slate-700/50 text-slate-500"
                    }`}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-200 truncate">{name}</p>
                      <p className="text-[10px] text-slate-600">{stats.cerrados}/{stats.total} cerrados</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-mono font-bold text-emerald-400">{formatCurrency(stats.revenue)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actividad reciente */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-white">Actividad Reciente</h2>
          <button onClick={() => onNavigate("leads")}
            className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors">
            Ver todos <ArrowRight size={11} />
          </button>
        </div>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-14 bg-slate-800 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : recientes.length === 0 ? (
          <div className="flex flex-col items-center py-10 gap-2">
            <Users size={24} className="text-slate-700" />
            <p className="text-sm text-slate-600">No hay leads aún. ¡Crea el primero!</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {recientes.map(c => (
              <div key={c.id} className="flex items-center gap-4 py-3 hover:bg-slate-800/30 -mx-2 px-2 rounded-lg transition-colors">
                <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0">
                  <span className="text-[10px] font-bold text-slate-400">{getInitials(c.nombre_y_apellido)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-200 truncate">{c.nombre_y_apellido}</p>
                  <p className="text-xs text-slate-600 truncate">
                    {c.servicio_adquirido || "—"}
                    {isAdmin && c.setter_asignado ? ` · ${c.setter_asignado}` : ""}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className="text-sm font-bold text-slate-200 tabular-nums">
                    {formatCurrency(c.valor_potencial)}
                  </span>
                  {c.cerro_la_venta
                    ? <span className="flex items-center gap-1 text-[10px] text-emerald-500">
                        <CheckCircle2 size={9} /> Cerrado
                      </span>
                    : <span className="flex items-center gap-1 text-[10px] text-slate-500">
                        <Clock size={9} /> Activo
                      </span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}