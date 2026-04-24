import { ArrowRight, TrendingUp, CheckCircle2, Clock, Users } from "lucide-react";
import { useClientes } from "@/hooks/useClientes";
import { formatCurrency, formatDate, getInitials } from "@/utils/formatters";
import type { Section } from "@/pages/Dashboard";

interface Props { isAdmin: boolean; userEmail: string; onNavigate: (s: Section) => void; }

function KPI({ label, value, sub, loading }: { label: string; value: string; sub: string; loading: boolean }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">{label}</p>
      <p className="text-2xl font-bold text-white tabular-nums">
        {loading ? <span className="inline-block w-20 h-7 bg-slate-800 rounded animate-pulse" /> : value}
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
  const svcMap: Record<string, { total: number; cerrados: number }> = {};
  clientes.forEach(c => {
    const s = c.servicio_adquirido || "Sin servicio";
    if (!svcMap[s]) svcMap[s] = { total: 0, cerrados: 0 };
    svcMap[s].total++;
    if (c.cerro_la_venta) svcMap[s].cerrados++;
  });
  const svcEntries = Object.entries(svcMap).sort((a, b) => b[1].total - a[1].total);
  const maxSvc = svcEntries[0]?.[1].total || 1;
  const setterMap: Record<string, { total: number; cerrados: number; revenue: number }> = {};
  all.forEach(c => {
    const s = c.setter_asignado || "Sin asignar";
    if (!setterMap[s]) setterMap[s] = { total: 0, cerrados: 0, revenue: 0 };
    setterMap[s].total++;
    if (c.cerro_la_venta) { setterMap[s].cerrados++; setterMap[s].revenue += c.valor_potencial ?? 0; }
  });
  const setterRanking = Object.entries(setterMap).sort((a, b) => b[1].cerrados - a[1].cerrados);
  const recientes = [...clientes].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 6);

  return (
    <div className="p-5 md:p-6 space-y-5 max-w-6xl mx-auto">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPI label="Pipeline Total" value={formatCurrency(pipeline)} sub={`${total} leads en total`} loading={isLoading} />
        <KPI label="Tasa de Cierre" value={`${conv}%`} sub={`${cerrados} ventas confirmadas`} loading={isLoading} />
        <KPI label="Leads Activos" value={String(activos)} sub="en seguimiento" loading={isLoading} />
        <KPI label="Revenue Real" value={formatCurrency(revenue)} sub="ingresos confirmados" loading={isLoading} />
      </div>
      <div className={`grid gap-4 ${isAdmin ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
        <div className={`bg-slate-900 border border-slate-800 rounded-xl p-5 ${isAdmin ? "lg:col-span-2" : ""}`}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-bold text-white">Pipeline por Servicio</h2>
              <p className="text-xs text-slate-600 mt-0.5">Distribución de leads</p>
            </div>
            <button onClick={() => onNavigate("leads")} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors">
              Ver leads <ArrowRight size={11} />
            </button>
          </div>
          {isLoading ? (
            <div className="space-y-4">{[1,2,3].map(i => (<div key={i} className="animate-pulse space-y-1.5"><div className="h-3 bg-slate-800 rounded w-32" /><div className="h-1.5 bg-slate-800 rounded-full" /></div>))}</div>
          ) : svcEntries.length === 0 ? (
            <div className="flex flex-col items-center py-10 gap-2"><TrendingUp size={24} className="text-slate-700" /><p className="text-sm text-slate-600">Sin datos aún</p></div>
          ) : (
            <div className="space-y-4">
              {svcEntries.map(([svc, counts]) => {
                const pct = Math.round((counts.total / maxSvc) * 100);
                const convPct = counts.total > 0 ? Math.round((counts.cerrados / counts.total) * 100) : 0;
                return (
                  <div key={svc}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium text-slate-300 truncate max-w-[60%]">{svc}</span>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span>{counts.total} leads</span>
                        <span className="text-emerald-500">{convPct}% cerrado</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {!isLoading && total > 0 && (
            <div className="mt-5 pt-4 border-t border-slate-800">
              <div className="flex justify-between mb-1.5">
                <span className="text-xs text-slate-600">Conversión global</span>
                <span className="text-xs font-semibold text-white">{conv}%</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden flex">
                <div className="bg-emerald-600 h-full transition-all duration-500" style={{ width: `${conv}%` }} />
              </div>
              <div className="flex justify-between mt-1.5 text-[10px] text-slate-600">
                <span>{cerrados} cerrados</span>
                <span>{activos} activos</span>
              </div>
            </div>
          )}
        </div>
        {isAdmin && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="mb-5">
              <h2 className="text-sm font-bold text-white">Equipo</h2>
              <p className="text-xs text-slate-600 mt-0.5">Rendimiento por setter</p>
            </div>
            {isLoading ? (
              <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-12 bg-slate-800 rounded-lg animate-pulse" />)}</div>
            ) : setterRanking.length === 0 ? (
              <p className="text-sm text-slate-600 text-center py-8">Sin datos</p>
            ) : (
              <div className="space-y-2">
                {setterRanking.map(([name, s], i) => {
                  const pct = s.total > 0 ? Math.round((s.cerrados / s.total) * 100) : 0;
                  return (
                    <div key={name} className="p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-500 w-4">#{i+1}</span>
                          <span className="text-xs font-semibold text-slate-200">{name}</span>
                        </div>
                        <span className="text-xs font-mono text-slate-300">{s.cerrados}/{s.total}</span>
                      </div>
                      <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-white">Actividad Reciente</h2>
            <p className="text-xs text-slate-600 mt-0.5">Últimos leads registrados</p>
          </div>
          <button onClick={() => onNavigate("leads")} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors">
            Ver todos <ArrowRight size={11} />
          </button>
        </div>
        {isLoading ? (
          <div className="space-y-2">{[1,2,3,4].map(i => <div key={i} className="h-14 bg-slate-800 rounded-lg animate-pulse" />)}</div>
        ) : recientes.length === 0 ? (
          <div className="flex flex-col items-center py-10 gap-2"><Users size={24} className="text-slate-700" /><p className="text-sm text-slate-600">No hay leads aún</p></div>
        ) : (
          <div className="divide-y divide-slate-800">
            {recientes.map(c => (
              <div key={c.id} className="flex items-center gap-4 py-3 hover:bg-slate-800/30 -mx-2 px-2 rounded-lg transition-colors">
                <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center flex-shrink-0">
                  <span className="text-[10px] font-bold text-slate-400">{getInitials(c.nombre_y_apellido)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-200 truncate">{c.nombre_y_apellido}</p>
                  <p className="text-xs text-slate-600 truncate">{c.servicio_adquirido || "—"}{isAdmin && c.setter_asignado ? ` · ${c.setter_asignado}` : ""}</p>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className="text-sm font-bold text-slate-200 tabular-nums">{formatCurrency(c.valor_potencial)}</span>
                  {c.cerro_la_venta
                    ? <span className="flex items-center gap-1 text-[10px] text-emerald-500"><CheckCircle2 size={9} /> Cerrado</span>
                    : <span className="flex items-center gap-1 text-[10px] text-slate-500"><Clock size={9} /> Activo</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}