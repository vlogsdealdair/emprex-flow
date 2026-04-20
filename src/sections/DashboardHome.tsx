// ============================================================
// Emprex Flow — Sección: Dashboard Home
// KPIs reales, pipeline visual, actividad reciente
// ============================================================
import { TrendingUp, DollarSign, Target, Users, ArrowRight, CheckCircle2, Clock, Flame } from "lucide-react";
import { useClientes } from "@/hooks/useClientes";
import { formatCurrency } from "@/utils/formatters";

interface Props { isAdmin: boolean; onNavigate: (s: any) => void; }

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

const percentWidth = (value: number) => WIDTH_CLASSES[Math.min(100, Math.max(0, Math.round(value / 10) * 10))] || "w-full";

function KPI({ label, value, sub, icon: Icon, color, loading }: any) {
  return (
    <div className={`relative bg-slate-900 border rounded-2xl p-5 overflow-hidden hover:border-slate-600 transition-all duration-300 group ${color.border}`}>
      <div className={`absolute -top-8 -right-8 w-28 h-28 rounded-full blur-2xl opacity-10 group-hover:opacity-20 transition-opacity ${color.glow}`} />
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{label}</span>
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${color.icon}`}>
            <Icon size={15} />
          </div>
        </div>
        <p className="text-3xl font-bold tracking-tight tabular-nums">
          {loading ? <span className="inline-block w-24 h-8 bg-slate-800 rounded-lg animate-pulse" /> : value}
        </p>
        <p className="text-xs text-slate-600 mt-1.5">{sub}</p>
      </div>
    </div>
  );
}

export default function DashboardHome({ isAdmin, onNavigate }: Props) {
  const { data: clientes = [], isLoading } = useClientes();

  const total    = clientes.length;
  const cerrados = clientes.filter(c => c.cerro_la_venta).length;
  const activos  = total - cerrados;
  const conv     = total > 0 ? ((cerrados / total) * 100).toFixed(1) : "0.0";
  const pipeline = clientes.reduce((s, c) => s + (c.valor_potencial ?? 0), 0);
  const revenue  = clientes.filter(c => c.cerro_la_venta).reduce((s, c) => s + (c.valor_potencial ?? 0), 0);

  // Recientes
  const recientes = [...clientes].sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);

  // Por setter
  const setterMap: Record<string, { total: number; cerrados: number; revenue: number }> = {};
  clientes.forEach(c => {
    const s = c.setter_asignado || "Sin asignar";
    if (!setterMap[s]) setterMap[s] = { total: 0, cerrados: 0, revenue: 0 };
    setterMap[s].total++;
    if (c.cerro_la_venta) { setterMap[s].cerrados++; setterMap[s].revenue += c.valor_potencial ?? 0; }
  });
  const setterRanking = Object.entries(setterMap).sort((a,b) => b[1].revenue - a[1].revenue);

  // Por servicio
  const svcMap: Record<string, number> = {};
  clientes.forEach(c => { const s = c.servicio_adquirido || "Otro"; svcMap[s] = (svcMap[s]||0) + 1; });
  const svcEntries = Object.entries(svcMap).sort((a,b) => b[1]-a[1]);
  const maxSvc = svcEntries[0]?.[1] || 1;

  const kpis = [
    { label:"Pipeline Total",  value:formatCurrency(pipeline), sub:`${total} leads en total`,       icon:DollarSign, color:{border:"border-blue-900/60",    glow:"bg-blue-600",    icon:"bg-blue-900/40 border-blue-700/40 text-blue-400"} },
    { label:"Tasa de Cierre",  value:`${conv}%`,               sub:`${cerrados} ventas confirmadas`, icon:Target,     color:{border:"border-emerald-900/60", glow:"bg-emerald-600", icon:"bg-emerald-900/40 border-emerald-700/40 text-emerald-400"} },
    { label:"Leads Activos",   value:String(activos),          sub:"en seguimiento activo",          icon:Users,      color:{border:"border-cyan-900/60",    glow:"bg-cyan-600",    icon:"bg-cyan-900/40 border-cyan-700/40 text-cyan-400"} },
    { label:"Revenue Real",    value:formatCurrency(revenue),  sub:"ingresos confirmados",           icon:TrendingUp, color:{border:"border-violet-900/60",  glow:"bg-violet-600",  icon:"bg-violet-900/40 border-violet-700/40 text-violet-400"} },
  ];

  return (
    <div className="p-5 md:p-7 space-y-6 max-w-7xl mx-auto">

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(k => <KPI key={k.label} {...k} loading={isLoading} />)}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">

        {/* Pipeline por estado (barra visual) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-bold text-slate-100">Pipeline por Servicio</h2>
              <p className="text-xs text-slate-600 mt-0.5">Distribución de leads activos</p>
            </div>
            <button onClick={() => onNavigate("leads")}
              className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors">
              Ver todos <ArrowRight size={11} />
            </button>
          </div>
          {isLoading ? (
            <div className="space-y-3">{Array.from({length:3}).map((_,i)=>(
              <div key={i} className="animate-pulse">
                <div className="flex justify-between mb-1.5">
                  <div className="h-3 bg-slate-800 rounded w-32" />
                  <div className="h-3 bg-slate-800 rounded w-8" />
                </div>
                <div className="h-2 bg-slate-800 rounded-full" />
              </div>
            ))}</div>
          ) : svcEntries.length === 0 ? (
            <p className="text-sm text-slate-600 text-center py-8">Sin datos aún</p>
          ) : (
            <div className="space-y-4">
              {svcEntries.map(([svc, count], i) => {
                const pct = Math.round((count / maxSvc) * 100);
                const colors = ["bg-blue-500","bg-cyan-500","bg-violet-500","bg-emerald-500","bg-amber-500"];
                return (
                  <div key={svc}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium text-slate-300">{svc}</span>
                      <span className="text-xs text-slate-500 font-mono">{count} lead{count!==1?"s":""}</span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-700 ${colors[i%colors.length]} ${percentWidth(pct)}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Barra de conversión global */}
          {!isLoading && total > 0 && (
            <div className="mt-6 pt-5 border-t border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500">Conversión global</span>
                <span className="text-xs font-mono font-bold text-emerald-400">{conv}%</span>
              </div>
              <div className="h-3 bg-slate-800 rounded-full overflow-hidden flex">
                <div className={`bg-emerald-500 h-full transition-all duration-700 ${percentWidth(Math.round(Number(conv)))}`} />
                <div className="bg-amber-500/60 h-full flex-1" />
              </div>
              <div className="flex justify-between mt-1.5">
                <span className="text-[10px] text-emerald-600">{cerrados} cerrados</span>
                <span className="text-[10px] text-amber-600">{activos} activos</span>
              </div>
            </div>
          )}
        </div>

        {/* Top setters */}
        {isAdmin && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-sm font-bold text-slate-100">Ranking Setters</h2>
                <p className="text-xs text-slate-600 mt-0.5">Por revenue generado</p>
              </div>
              <Flame size={15} className="text-amber-500" />
            </div>
            {isLoading ? (
              <div className="space-y-3">{Array.from({length:3}).map((_,i)=>(
                <div key={i} className="h-12 bg-slate-800 rounded-xl animate-pulse" />
              ))}</div>
            ) : setterRanking.length === 0 ? (
              <p className="text-sm text-slate-600 text-center py-8">Sin datos</p>
            ) : (
              <div className="space-y-2.5">
                {setterRanking.map(([name, stats], i) => (
                  <div key={name} className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      i===0?"bg-amber-500/20 text-amber-400":i===1?"bg-slate-600/50 text-slate-300":"bg-slate-700/50 text-slate-500"}`}>
                      {i+1}
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
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-slate-100">Actividad Reciente</h2>
          <button onClick={() => onNavigate("leads")}
            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors">
            Ver todos <ArrowRight size={11} />
          </button>
        </div>
        {isLoading ? (
          <div className="space-y-3">{Array.from({length:4}).map((_,i)=>(
            <div key={i} className="h-14 bg-slate-800 rounded-xl animate-pulse" />
          ))}</div>
        ) : recientes.length === 0 ? (
          <p className="text-sm text-slate-600 text-center py-8">No hay leads aún. ¡Crea el primero!</p>
        ) : (
          <div className="space-y-2">
            {recientes.map(c => (
              <div key={c.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-800/50 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-blue-900/40 border border-blue-800/40 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-blue-400">
                    {c.nombre_y_apellido.split(" ").slice(0,2).map((w:string)=>w[0]).join("").toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-200 truncate">{c.nombre_y_apellido}</p>
                  <p className="text-xs text-slate-600 truncate">{c.servicio_adquirido || "—"} · {c.setter_asignado || "Sin setter"}</p>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className="text-xs font-mono font-bold text-slate-300">{formatCurrency(c.valor_potencial)}</span>
                  {c.cerro_la_venta
                    ? <span className="flex items-center gap-1 text-[10px] text-emerald-400"><CheckCircle2 size={9}/>Cerrado</span>
                    : <span className="flex items-center gap-1 text-[10px] text-amber-400"><Clock size={9}/>Activo</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}