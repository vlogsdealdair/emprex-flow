import { useDeals, useTeam } from "@/hooks/useCrm";
import { formatCurrency } from "@/utils/formatters";

export default function TeamSection() {
  const { data: team = [], isLoading: loadingTeam } = useTeam(true);
  const { data: deals = [], isLoading: loadingDeals } = useDeals();
  const loading = loadingTeam || loadingDeals;

  const stats = team.map(member => {
    const assigned = deals.filter(d => d.setter_id === member.id || d.closer_id === member.id);
    const won = assigned.filter(d => d.stage.is_won);
    const active = assigned.filter(d => !d.stage.is_won && !d.stage.is_lost);
    const pipeline = active.reduce((sum, d) => sum + Number(d.potential_value_usd || 0), 0);
    const revenue = won.reduce((sum, d) => sum + Number(d.actual_value_usd ?? d.potential_value_usd ?? 0), 0);
    const conversion = assigned.length ? Math.round((won.length / assigned.length) * 100) : 0;

    return { member, assigned, won, active, pipeline, revenue, conversion };
  });

  return (
    <div className="p-5 md:p-6 max-w-6xl mx-auto space-y-5">
      <div>
        <h2 className="text-sm font-bold text-white">Equipo comercial</h2>
        <p className="text-xs text-slate-600 mt-0.5">Roles, asignación y rendimiento sobre el pipeline real.</p>
      </div>

      {loading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[1,2].map(i => <div key={i} className="h-44 bg-slate-900 border border-slate-800 rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <>
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-slate-950/60 border-b border-slate-800">
                <tr>
                  {["Miembro", "Rol", "Asignadas", "Activas", "Ganadas", "Conversión", "Pipeline", "Revenue"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {stats.map(({ member, assigned, won, active, pipeline, revenue, conversion }) => (
                  <tr key={member.id} className="hover:bg-slate-800/20">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 grid place-items-center">
                          <span className="text-[10px] font-bold text-slate-300">
                            {member.full_name.split(" ").map(p => p[0]).join("").slice(0,2).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-200">{member.full_name}</p>
                          <p className="text-[11px] text-slate-600">{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-blue-950 border border-blue-900 text-blue-400">
                        {member.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-300">{assigned.length}</td>
                    <td className="px-4 py-3 text-sm text-slate-300">{active.length}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-emerald-400">{won.length}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${conversion}%` }} />
                        </div>
                        <span className="text-xs text-slate-400">{conversion}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-200">{formatCurrency(pipeline)}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-white">{formatCurrency(revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.map(({ member, assigned, won, active, pipeline, revenue, conversion }) => (
              <article key={member.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-bold text-white">{member.full_name}</p>
                    <p className="text-xs text-slate-600 mt-0.5">{member.email}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full border ${member.is_active ? "text-emerald-400 bg-emerald-950 border-emerald-900" : "text-slate-500 bg-slate-800 border-slate-700"}`}>
                    {member.is_active ? "Activo" : "Inactivo"}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-4">
                  <Metric label="Asignadas" value={assigned.length} />
                  <Metric label="Activas" value={active.length} />
                  <Metric label="Ganadas" value={won.length} />
                </div>

                <div className="space-y-3">
                  <Row label="Conversión" value={`${conversion}%`} />
                  <Row label="Pipeline" value={formatCurrency(pipeline)} />
                  <Row label="Revenue" value={formatCurrency(revenue)} />
                </div>
              </article>
            ))}
          </div>

          {stats.length === 0 && (
            <div className="text-center py-16 text-sm text-slate-600">No hay miembros activos registrados.</div>
          )}
        </>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-center">
      <p className="text-lg font-bold text-white">{value}</p>
      <p className="text-[10px] text-slate-600 mt-0.5">{label}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-slate-600">{label}</span>
      <span className="font-semibold text-slate-300">{value}</span>
    </div>
  );
}
