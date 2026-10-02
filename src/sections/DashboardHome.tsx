import { AlertTriangle, ArrowRight, CheckCircle2, CircleDollarSign, Target, TrendingDown, TrendingUp, Users } from "lucide-react";
import { useCommissions, useCurrentProfile, useDeals } from "@/hooks/useCrm";
import { formatCurrency } from "@/utils/formatters";
import type { Section } from "@/pages/Dashboard";

interface Props { onNavigate: (s: Section) => void; }

export default function DashboardHome({ onNavigate }: Props) {
  const { data: profile } = useCurrentProfile();
  const { data: deals = [], isLoading } = useDeals();
  const { data: commissions = [] } = useCommissions();

  if (!profile) return null;
  const total = deals.length;
  const won = deals.filter(d => d.stage.is_won).length;
  const lost = deals.filter(d => d.stage.is_lost).length;
  const active = total - won - lost;
  const conversion = total ? Math.round((won / total) * 100) : 0;
  const pipeline = deals.filter(d => !d.stage.is_lost).reduce((s,d)=>s+Number(d.potential_value_usd||0),0);
  const revenue = deals.filter(d => d.stage.is_won).reduce((s,d)=>s+Number(d.actual_value_usd ?? d.potential_value_usd ?? 0),0);
  const ownCommissions = profile.role === "admin" ? commissions : commissions.filter(c => c.profile_id === profile.id);
  const commissionEarned = ownCommissions.reduce((s,c)=>s+Number(c.commission_amount_usd||0),0);
  const commissionPaid = ownCommissions.reduce((s,c)=>s+c.payments.reduce((x,p)=>x+Number(p.amount_usd||0),0),0);
  const commissionPending = Math.max(0, commissionEarned - commissionPaid);
  const overdue = deals.filter(d => d.next_follow_up_at && new Date(d.next_follow_up_at).getTime() < Date.now() && !d.stage.is_won && !d.stage.is_lost).slice(0,5);

  const chart = buildMonthlySeries(deals);
  const roleTitle = profile.role === "admin" ? "Visión general del negocio" : profile.role === "setter" ? "Mi rendimiento como Setter" : "Mi rendimiento como Closer";
  const roleSubtitle = profile.role === "admin" ? "Pipeline, cierres, pérdidas y evolución comercial." : "Tus resultados, progreso y oportunidades para mejorar tus ingresos.";

  return (
    <div className="p-5 md:p-7 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <div><p className="text-[11px] uppercase tracking-[.18em] crm-muted">Analytics</p><h2 className="text-2xl md:text-3xl font-bold crm-text mt-1">{roleTitle}</h2><p className="text-sm crm-muted mt-1">{roleSubtitle}</p></div>
        {profile.role !== "admin" && <button onClick={()=>onNavigate("finance")} className="ml-auto px-4 py-2 rounded-xl bg-[var(--crm-accent)] text-white text-xs font-semibold shadow-lg">Ver mis comisiones</button>}
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
        <Kpi icon={<Users size={17}/>} label="Leads" value={String(total)} sub={String(active)+" activos"} loading={isLoading}/>
        <Kpi icon={<CheckCircle2 size={17}/>} label="Cerrados" value={String(won)} sub={String(conversion)+"% conversión"} loading={isLoading} positive/>
        <Kpi icon={<TrendingDown size={17}/>} label="Perdidos" value={String(lost)} sub="Para analizar objeciones" loading={isLoading}/>
        <Kpi icon={<Target size={17}/>} label={profile.role==="admin" ? "Pipeline" : "Pipeline asignado"} value={formatCurrency(pipeline)} sub="Potencial comercial" loading={isLoading}/>
        <Kpi icon={<CircleDollarSign size={17}/>} label={profile.role==="admin" ? "Revenue" : "Por cobrar"} value={profile.role==="admin" ? formatCurrency(revenue) : formatCurrency(commissionPending)} sub={profile.role==="admin" ? "Ventas ganadas" : "Comisiones pendientes"} loading={isLoading} accent/>
      </div>

      <div className="grid xl:grid-cols-[1.7fr_1fr] gap-5">
        <section className="crm-card rounded-2xl p-5 md:p-6">
          <div className="flex items-start justify-between mb-5"><div><h3 className="text-sm font-bold crm-text">Evolución comercial</h3><p className="text-xs crm-muted mt-1">Leads creados, ganados y perdidos en los últimos 6 meses.</p></div><div className="flex gap-3 text-[10px] crm-muted"><span><i className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-1"/>Leads</span><span><i className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-1"/>Ganados</span></div></div>
          <SalesChart data={chart}/>
        </section>

        <section className="crm-card rounded-2xl p-5">
          <div className="flex items-center justify-between"><div><h3 className="text-sm font-bold crm-text">Estado del pipeline</h3><p className="text-xs crm-muted mt-1">Lectura rápida de resultados.</p></div><TrendingUp size={18} className="crm-accent"/></div>
          <div className="mt-6 space-y-5">
            <Progress label="Cerrados" value={won} total={Math.max(total,1)} tone="emerald"/>
            <Progress label="Perdidos" value={lost} total={Math.max(total,1)} tone="rose"/>
            <Progress label="Activos" value={active} total={Math.max(total,1)} tone="blue"/>
          </div>
          {profile.role !== "admin" && <div className="mt-6 p-4 rounded-xl bg-[var(--crm-glow)] border crm-border"><p className="text-[10px] uppercase tracking-wider crm-muted">Comisiones generadas</p><p className="text-xl font-bold crm-text mt-1">{formatCurrency(commissionEarned)}</p><p className="text-xs crm-muted mt-1">Pagado: {formatCurrency(commissionPaid)}</p></div>}
        </section>
      </div>

      {overdue.length > 0 && <section className="crm-card rounded-2xl p-5 border-amber-500/20"><div className="flex items-center justify-between mb-3"><div><h3 className="text-sm font-bold text-amber-500 flex items-center gap-2"><AlertTriangle size={15}/> Requiere atención</h3><p className="text-xs crm-muted mt-1">Seguimientos vencidos todavía abiertos.</p></div><button onClick={()=>onNavigate("leads")} className="text-xs crm-accent flex items-center gap-1">Ver leads <ArrowRight size={11}/></button></div><div className="divide-y crm-border">{overdue.map(d=><div key={d.id} className="py-3 flex items-center gap-3"><div className="flex-1 min-w-0"><p className="text-sm font-semibold crm-text truncate">{d.contact.full_name}</p><p className="text-[11px] crm-muted truncate">{d.next_action || "Seguimiento pendiente"}</p></div><span className="text-[11px] font-semibold text-amber-500">{new Date(d.next_follow_up_at!).toLocaleString("es-EC",{dateStyle:"short",timeStyle:"short"})}</span></div>)}</div></section>}
    </div>
  );
}

function Kpi({icon,label,value,sub,loading,positive=false,accent=false}:{icon:React.ReactNode;label:string;value:string;sub:string;loading:boolean;positive?:boolean;accent?:boolean}) {
  return <div className={"crm-card crm-card-hover rounded-2xl p-5 "+(accent?"crm-kpi-accent":"")}><div className={"w-9 h-9 rounded-xl grid place-items-center mb-4 "+(positive?"bg-emerald-500/10 text-emerald-500":"bg-[var(--crm-glow)] crm-accent")}>{icon}</div><p className="text-[10px] uppercase tracking-wider crm-muted">{label}</p><p className="text-2xl font-bold crm-text mt-1">{loading ? "…" : value}</p><p className="text-xs crm-muted mt-1">{sub}</p></div>;
}

function Progress({label,value,total,tone}:{label:string;value:number;total:number;tone:"emerald"|"rose"|"blue"}) {
  const pct=Math.min(100,Math.round(value/total*100));
  const bar=tone==="emerald"?"bg-emerald-500":tone==="rose"?"bg-rose-500":"bg-blue-500";
  return <div><div className="flex justify-between text-xs mb-2"><span className="crm-muted">{label}</span><span className="font-semibold crm-text">{value} · {pct}%</span></div><div className="h-2 rounded-full bg-slate-500/10 overflow-hidden"><div className={"h-full rounded-full "+bar} style={{width:String(pct)+"%"}}/></div></div>;
}

function buildMonthlySeries(deals:any[]) {
  const now=new Date(); const months=[] as {label:string;leads:number;won:number;lost:number}[];
  for(let i=5;i>=0;i--){ const d=new Date(now.getFullYear(),now.getMonth()-i,1); months.push({label:d.toLocaleDateString("es-EC",{month:"short"}),leads:0,won:0,lost:0}); }
  deals.forEach(deal=>{ const d=new Date(deal.created_at); const diff=(now.getFullYear()-d.getFullYear())*12+(now.getMonth()-d.getMonth()); if(diff>=0&&diff<6){ const idx=5-diff; months[idx].leads++; if(deal.stage.is_won)months[idx].won++; if(deal.stage.is_lost)months[idx].lost++; }});
  return months;
}

function SalesChart({data}:{data:{label:string;leads:number;won:number;lost:number}[]}) {
  const max=Math.max(1,...data.flatMap(d=>[d.leads,d.won,d.lost]));
  const points=(key:"leads"|"won"|"lost")=>data.map((d,i)=>String(i*20)+","+String(90-(d[key]/max)*72)).join(" ");
  return <div><svg viewBox="0 0 100 100" className="w-full h-64 overflow-visible" preserveAspectRatio="none"><defs><linearGradient id="leadArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--crm-accent)" stopOpacity=".18"/><stop offset="100%" stopColor="var(--crm-accent)" stopOpacity="0"/></linearGradient></defs>{[18,36,54,72,90].map(y=><line key={y} x1="0" x2="100" y1={y} y2={y} stroke="var(--crm-border)" strokeWidth=".45"/>)}<polyline fill="none" stroke="var(--crm-accent)" strokeWidth="1.8" vectorEffect="non-scaling-stroke" points={points("leads")}/><polyline fill="none" stroke="#10b981" strokeWidth="1.5" vectorEffect="non-scaling-stroke" points={points("won")}/><polyline fill="none" stroke="#f43f5e" strokeWidth="1.2" strokeDasharray="3 2" vectorEffect="non-scaling-stroke" points={points("lost")}/></svg><div className="grid grid-cols-6 mt-2">{data.map(d=><span key={d.label} className="text-center text-[10px] crm-muted capitalize">{d.label}</span>)}</div></div>;
}