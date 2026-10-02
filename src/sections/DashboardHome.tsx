import { ArrowRight, CheckCircle2, Clock, TrendingUp, Users } from "lucide-react";
import { useDeals } from "@/hooks/useCrm";
import { formatCurrency } from "@/utils/formatters";
import type { Section } from "@/pages/Dashboard";

interface Props { onNavigate: (s: Section) => void; }

function KPI({ label, value, sub, loading }: { label: string; value: string; sub: string; loading: boolean }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">{label}</p>
      <p className="text-2xl font-bold text-white tabular-nums">{loading ? <span className="inline-block w-20 h-7 bg-slate-800 rounded animate-pulse" /> : value}</p>
      <p className="text-xs text-slate-600 mt-1.5">{sub}</p>
    </div>
  );
}

export default function DashboardHome({ onNavigate }: Props) {
  const { data: deals = [], isLoading } = useDeals();

  const total = deals.length;
  const won = deals.filter(d => d.stage.is_won).length;
  const lost = deals.filter(d => d.stage.is_lost).length;
  const active = total - won - lost;
  const conversion = total ? ((won / total) * 100).toFixed(1) : "0.0";
  const pipeline = deals.filter(d => !d.stage.is_lost).reduce((s, d) => s + Number(d.potential_value_usd || 0), 0);
  const revenue = deals.filter(d => d.stage.is_won).reduce((s, d) => s + Number(d.actual_value_usd ?? d.potential_value_usd ?? 0), 0);

  const byService = Object.entries(deals.reduce<Record<string, { total: number; won: number }>>((acc, d) => {
    const key = d.service?.name || "Sin servicio";
    acc[key] ??= { total: 0, won: 0 };
    acc[key].total++;
    if (d.stage.is_won) acc[key].won++;
    return acc;
  }, {})).sort((a, b) => b[1].total - a[1].total);

  const recent = deals.slice(0, 6);

  return (
    <div className="p-5 md:p-6 space-y-5 max-w-6xl mx-auto">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPI label="Pipeline Total" value={formatCurrency(pipeline)} sub={`${total} oportunidades`} loading={isLoading} />
        <KPI label="Tasa de Cierre" value={`${conversion}%`} sub={`${won} ganadas`} loading={isLoading} />
        <KPI label="Leads Activos" value={String(active)} sub="en seguimiento" loading={isLoading} />
        <KPI label="Revenue Real" value={formatCurrency(revenue)} sub="ventas ganadas" loading={isLoading} />
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-sm font-bold text-white">Pipeline por servicio</h2>
            <p className="text-xs text-slate-600 mt-0.5">Distribución y cierre</p>
          </div>
          <button onClick={() => onNavigate("leads")} className="text-xs text-blue-400 flex items-center gap-1">Ver pipeline <ArrowRight size={11} /></button>
        </div>

        {byService.length === 0 ? (
          <div className="py-10 text-center"><TrendingUp size={24} className="mx-auto text-slate-700 mb-2" /><p className="text-sm text-slate-600">Sin datos todavía</p></div>
        ) : (
          <div className="space-y-4">
            {byService.map(([service, stats]) => {
              const pct = stats.total ? Math.round((stats.won / stats.total) * 100) : 0;
              return (
                <div key={service}>
                  <div className="flex justify-between mb-1.5">
                    <span className="text-xs font-medium text-slate-300">{service}</span>
                    <span className="text-xs text-slate-500">{stats.total} leads · <span className="text-emerald-500">{pct}% ganado</span></span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden"><div className="h-full bg-blue-600 rounded-full" style={{ width: `${pct}%` }} /></div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-white">Actividad comercial reciente</h2>
            <p className="text-xs text-slate-600 mt-0.5">Últimas oportunidades creadas</p>
          </div>
          <button onClick={() => onNavigate("leads")} className="text-xs text-blue-400 flex items-center gap-1">Ver todos <ArrowRight size={11} /></button>
        </div>

        {recent.length === 0 ? (
          <div className="py-10 text-center"><Users size={24} className="mx-auto text-slate-700 mb-2" /><p className="text-sm text-slate-600">No hay leads todavía</p></div>
        ) : (
          <div className="divide-y divide-slate-800">
            {recent.map(d => (
              <div key={d.id} className="flex items-center gap-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-200 truncate">{d.contact.full_name}</p>
                  <p className="text-xs text-slate-600 truncate">{d.service?.name || "Sin servicio"} · {d.stage.name}</p>
                </div>
                <span className="text-sm font-bold text-slate-200">{formatCurrency(Number(d.potential_value_usd || 0))}</span>
                {d.stage.is_won ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Clock size={14} className="text-slate-600" />}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
