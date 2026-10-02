import { useMemo, useState } from "react";
import { Download, FileSpreadsheet, Target } from "lucide-react";
import { useDeals, useSalesTargets, useTeam, useUpsertSalesTarget } from "@/hooks/useCrm";
import { formatCurrency } from "@/utils/formatters";

function monthBounds(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { start: fmt(start), end: fmt(end), label: date.toLocaleDateString("es-EC", { month: "long", year: "numeric" }) };
}

export default function ReportsSection() {
  const { data: deals = [] } = useDeals();
  const { data: team = [] } = useTeam(true);
  const { data: targets = [] } = useSalesTargets();
  const saveTarget = useUpsertSalesTarget();
  const period = monthBounds();

  const [drafts, setDrafts] = useState<Record<string, { revenue: string; wins: string }>>({});

  const rows = useMemo(() => team.map(member => {
    const memberDeals = deals.filter(d => d.setter_id === member.id || d.closer_id === member.id);
    const won = memberDeals.filter(d => d.stage.is_won);
    const active = memberDeals.filter(d => !d.stage.is_won && !d.stage.is_lost);
    const revenue = won.reduce((s, d) => s + Number(d.actual_value_usd ?? d.potential_value_usd ?? 0), 0);
    const pipeline = active.reduce((s, d) => s + Number(d.potential_value_usd || 0), 0);
    const target = targets.find(t => t.profile_id === member.id && t.period_start === period.start && t.period_end === period.end);
    return { member, won, active, revenue, pipeline, target };
  }), [team, deals, targets, period.start, period.end]);

  const exportCsv = () => {
    const headers = ["Miembro","Rol","Ganadas","Activas","Revenue USD","Pipeline USD","Meta Revenue USD","Meta Ganadas"];
    const data = rows.map(r => [
      r.member.full_name,
      r.member.role,
      r.won.length,
      r.active.length,
      r.revenue.toFixed(2),
      r.pipeline.toFixed(2),
      Number(r.target?.target_revenue_usd ?? 0).toFixed(2),
      r.target?.target_wins ?? 0,
    ]);
    const csv = [headers, ...data].map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `emprex-reporte-${period.start}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportExcel = () => {
    const body = rows.map(r => `<tr><td>${r.member.full_name}</td><td>${r.member.role}</td><td>${r.won.length}</td><td>${r.active.length}</td><td>${r.revenue.toFixed(2)}</td><td>${r.pipeline.toFixed(2)}</td><td>${Number(r.target?.target_revenue_usd ?? 0).toFixed(2)}</td><td>${r.target?.target_wins ?? 0}</td></tr>`).join("");
    const html = `<html><head><meta charset="UTF-8"></head><body><table border="1"><tr><th>Miembro</th><th>Rol</th><th>Ganadas</th><th>Activas</th><th>Revenue USD</th><th>Pipeline USD</th><th>Meta Revenue USD</th><th>Meta Ganadas</th></tr>${body}</table></body></html>`;
    const blob = new Blob([html], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `emprex-reporte-${period.start}.xls`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const save = async (profileId: string) => {
    const current = rows.find(r => r.member.id === profileId);
    const draft = drafts[profileId] ?? {
      revenue: String(current?.target?.target_revenue_usd ?? ""),
      wins: String(current?.target?.target_wins ?? ""),
    };
    await saveTarget.mutateAsync({
      profileId,
      periodStart: period.start,
      periodEnd: period.end,
      targetRevenueUsd: draft.revenue === "" ? null : Number(draft.revenue),
      targetWins: draft.wins === "" ? null : Number(draft.wins),
    });
  };

  return (
    <div className="p-5 md:p-6 max-w-6xl mx-auto space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h2 className="text-sm font-bold text-white">Reportes</h2>
          <p className="text-xs text-slate-600 mt-0.5 capitalize">Rendimiento comercial · {period.label}</p>
        </div>
        <div className="ml-auto flex gap-2">
          <button onClick={exportCsv} className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center gap-1.5"><Download size={13}/> CSV</button>
          <button onClick={exportExcel} className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 flex items-center gap-1.5"><FileSpreadsheet size={13}/> Excel</button>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto">
        <table className="w-full min-w-[1050px]">
          <thead className="bg-slate-950/60 border-b border-slate-800">
            <tr>{["Miembro","Rol","Ganadas","Activas","Revenue","Pipeline","Meta Revenue","Meta Ganadas",""].map(h => <th key={h} className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-slate-500">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {rows.map(r => {
              const draft = drafts[r.member.id] ?? {
                revenue: String(r.target?.target_revenue_usd ?? ""),
                wins: String(r.target?.target_wins ?? ""),
              };
              return (
                <tr key={r.member.id} className="hover:bg-slate-800/20">
                  <td className="px-4 py-3 text-sm font-semibold text-slate-200">{r.member.full_name}</td>
                  <td className="px-4 py-3 text-xs text-slate-400 uppercase">{r.member.role}</td>
                  <td className="px-4 py-3 text-sm text-emerald-400 font-semibold">{r.won.length}</td>
                  <td className="px-4 py-3 text-sm text-slate-300">{r.active.length}</td>
                  <td className="px-4 py-3 text-sm font-bold text-white">{formatCurrency(r.revenue)}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-slate-300">{formatCurrency(r.pipeline)}</td>
                  <td className="px-4 py-3"><input type="number" min="0" value={draft.revenue} onChange={e => setDrafts(p => ({...p,[r.member.id]:{...draft,revenue:e.target.value}}))} className="w-28 bg-slate-950 border border-slate-700 rounded-md px-2 py-1.5 text-xs text-slate-200"/></td>
                  <td className="px-4 py-3"><input type="number" min="0" value={draft.wins} onChange={e => setDrafts(p => ({...p,[r.member.id]:{...draft,wins:e.target.value}}))} className="w-20 bg-slate-950 border border-slate-700 rounded-md px-2 py-1.5 text-xs text-slate-200"/></td>
                  <td className="px-4 py-3"><button onClick={() => void save(r.member.id)} disabled={saveTarget.isPending} className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold flex items-center gap-1.5"><Target size={12}/> Guardar</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
