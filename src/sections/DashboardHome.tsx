import { ArrowRight, CalendarCheck2, CheckCircle2, CircleDollarSign, Target, TrendingUp, Users } from "lucide-react";
import { useCommissions, useCurrentProfile, useDeals } from "@/hooks/useCrm";
import { formatCurrency } from "@/utils/formatters";
import type { Section } from "@/pages/Dashboard";

interface Props { onNavigate: (s: Section) => void; }

export default function DashboardHome({ onNavigate }: Props) {
  const { data: profile } = useCurrentProfile();
  const { data: deals = [], isLoading } = useDeals();
  const { data: commissions = [] } = useCommissions();
  if (!profile) return null;

  const wonDeals = deals.filter(d => d.stage.is_won);
  const activeDeals = deals.filter(d => !d.stage.is_won && !d.stage.is_lost);
  const total = deals.length;
  const won = wonDeals.length;
  const active = activeDeals.length;
  const conversion = total ? Math.round((won / total) * 100) : 0;
  const pipeline = activeDeals.reduce((sum,d)=>sum+Number(d.potential_value_usd||0),0);
  const revenue = wonDeals.reduce((sum,d)=>sum+Number(d.actual_value_usd ?? d.potential_value_usd ?? 0),0);
  const own = profile.role === "admin" ? commissions : commissions.filter(c => c.profile_id === profile.id);
  const earned = own.reduce((sum,c)=>sum+Number(c.commission_amount_usd||0),0);
  const paid = own.reduce((sum,c)=>sum+c.payments.reduce((x,p)=>x+Number(p.amount_usd||0),0),0);
  const pending = Math.max(0,earned-paid);
  const meetings = deals.filter(d=>d.stage.name.toLowerCase().includes("reunión")).length;
  const contacted = deals.filter(d=>!d.stage.name.toLowerCase().includes("nuevo")).length;
  const overdue = activeDeals.filter(d=>d.next_follow_up_at && new Date(d.next_follow_up_at).getTime()<Date.now()).slice(0,5);
  const admin = profile.role==="admin";
  const setter = profile.role==="setter";
  const firstName = profile.full_name.split(" ")[0] || "equipo";

  const kpis = admin ? [
    ["Leads activos",String(active),String(total)+" oportunidades",<Users size={17}/>],
    ["Ventas cerradas",String(won),String(conversion)+"% conversión",<CheckCircle2 size={17}/>],
    ["Pipeline",formatCurrency(pipeline),"Potencial activo",<Target size={17}/>],
    ["Revenue",formatCurrency(revenue),"Ventas ganadas",<CircleDollarSign size={17}/>],
  ] : setter ? [
    ["Leads asignados",String(total),String(active)+" activos",<Users size={17}/>],
    ["Contactados",String(contacted),"Oportunidades trabajadas",<TrendingUp size={17}/>],
    ["Reuniones",String(meetings),"En etapa de reunión",<CalendarCheck2 size={17}/>],
    ["Conversión",String(conversion)+"%",String(won)+" cerradas",<Target size={17}/>],
  ] : [
    ["Oportunidades",String(active),String(total)+" asignadas",<Users size={17}/>],
    ["Ventas cerradas",String(won),formatCurrency(revenue),<CheckCircle2 size={17}/>],
    ["Pipeline",formatCurrency(pipeline),"Potencial asignado",<Target size={17}/>],
    ["Comisión pendiente",formatCurrency(pending),formatCurrency(earned)+" generadas",<CircleDollarSign size={17}/>],
  ];

  return <div className="p-5 md:p-8 max-w-[1440px] mx-auto space-y-6">
    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
      <div className="flex-1">
        <p className="text-[11px] uppercase tracking-[.18em] crm-muted">{admin?"Visión general":"Rendimiento personal"}</p>
        <h1 className="text-[28px] md:text-[32px] font-semibold crm-text mt-2">Hola, {firstName}.</h1>
        <p className="text-sm crm-muted mt-2">{admin?"Aquí tienes el estado general de EMPREX y las oportunidades que necesitan atención.":setter?"Prioriza tus leads, genera reuniones y mantén tu seguimiento al día.":"Identifica qué oportunidades puedes cerrar y cuánto puedes generar en comisiones."}</p>
      </div>
      <button onClick={()=>onNavigate("leads")} className="crm-primary-button rounded-xl px-4 py-2.5 text-xs font-semibold self-start">{admin?"+ Nueva oportunidad":setter?"Ver mis leads":"Ver oportunidades"}</button>
    </div>

    <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {kpis.map(([label,value,sub,icon])=><Kpi key={String(label)} label={String(label)} value={String(value)} sub={String(sub)} icon={icon as React.ReactNode} loading={isLoading}/>)}
    </div>

    <div className="grid xl:grid-cols-[1.65fr_.85fr] gap-5">
      <div className="crm-card p-5 md:p-6">
        <div className="mb-6"><h2 className="text-sm font-semibold crm-text">Rendimiento mensual</h2><p className="text-xs crm-muted mt-1">Leads creados y ventas cerradas en los últimos 6 meses.</p></div>
        <SalesChart deals={deals}/>
      </div>
      <div className="crm-card p-5 md:p-6">
        <h2 className="text-sm font-semibold crm-text">Embudo de conversión</h2><p className="text-xs crm-muted mt-1">Lectura rápida del pipeline.</p>
        <div className="mt-6 space-y-4">
          <Funnel label="Leads" value={total} total={Math.max(total,1)}/>
          <Funnel label="Contactados" value={contacted} total={Math.max(total,1)}/>
          <Funnel label="Reunión" value={meetings} total={Math.max(total,1)}/>
          <Funnel label="Cerrados" value={won} total={Math.max(total,1)}/>
        </div>
      </div>
    </div>

    <div className="grid xl:grid-cols-3 gap-5">
      <div className="crm-card p-5 md:p-6 xl:col-span-2">
        <div className="flex items-center justify-between"><div><h2 className="text-sm font-semibold crm-text">Prioridades de hoy</h2><p className="text-xs crm-muted mt-1">Seguimientos abiertos que requieren acción.</p></div><button onClick={()=>onNavigate("leads")} className="text-xs crm-accent flex items-center gap-1">Ver leads <ArrowRight size={12}/></button></div>
        <div className="mt-4 divide-y crm-border">{overdue.length?overdue.map(d=><div key={d.id} className="py-3.5 flex items-center gap-3"><div className="flex-1 min-w-0"><p className="text-sm font-medium crm-text truncate">{d.contact.full_name}</p><p className="text-[11px] crm-muted truncate">{d.next_action || "Seguimiento pendiente"} · {d.stage.name}</p></div><span className="text-[11px] crm-muted">{new Date(d.next_follow_up_at!).toLocaleString("es-EC",{dateStyle:"short",timeStyle:"short"})}</span></div>):<p className="text-sm crm-muted py-6">No hay seguimientos vencidos.</p>}</div>
      </div>
      <div className="crm-card p-5 md:p-6">
        <h2 className="text-sm font-semibold crm-text">{admin?"Finanzas":"Mis comisiones"}</h2><p className="text-xs crm-muted mt-1">Resumen financiero.</p>
        <div className="mt-5 space-y-3"><Money label="Generadas" value={formatCurrency(earned)}/><Money label="Pagadas" value={formatCurrency(paid)}/><Money label="Pendiente" value={formatCurrency(pending)}/></div>
        <button onClick={()=>onNavigate("finance")} className="crm-secondary-button w-full rounded-xl px-3 py-2.5 text-xs font-semibold mt-5">{admin?"Ver Finanzas":"Ver mis comisiones"}</button>
      </div>
    </div>

    {admin&&<div className="crm-card p-5 md:p-6"><div className="flex items-center justify-between"><div><h2 className="text-sm font-semibold crm-text">Servicios activos</h2><p className="text-xs crm-muted mt-1">Portafolio comercial principal.</p></div><button onClick={()=>onNavigate("settings")} className="text-xs crm-accent">Gestionar servicios →</button></div><div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3 mt-5">{["EMPREX Patient Funnel","EMPREX Smart Agent","EMPREX Growth Content","EMPREX Híbrido"].map(name=><div key={name} className="rounded-xl border crm-border bg-[var(--crm-surface-muted)] px-4 py-3 text-xs font-medium crm-text">{name}</div>)}</div></div>}
  </div>;
}

function Kpi({icon,label,value,sub,loading}:{icon:React.ReactNode;label:string;value:string;sub:string;loading:boolean}) {
  return <div className="crm-card crm-card-hover p-5"><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] uppercase tracking-[.15em] crm-muted">{label}</p><p className="text-[28px] font-semibold crm-text mt-3">{loading?"…":value}</p><p className="text-xs crm-muted mt-1">{sub}</p></div><div className="w-9 h-9 rounded-xl bg-[var(--crm-accent-soft)] crm-accent grid place-items-center">{icon}</div></div></div>;
}
function Funnel({label,value,total}:{label:string;value:number;total:number}) { const pct=Math.round(value/total*100); return <div><div className="flex justify-between text-xs"><span className="crm-muted">{label}</span><span className="crm-text">{value} · {pct}%</span></div><div className="h-1.5 rounded-full bg-[var(--crm-surface-muted)] mt-2 overflow-hidden"><div className="h-full bg-[var(--crm-accent)] rounded-full" style={{width:String(pct)+"%"}}/></div></div>; }
function Money({label,value}:{label:string;value:string}) { return <div className="flex justify-between py-2 border-b crm-border last:border-0"><span className="text-xs crm-muted">{label}</span><span className="text-sm font-semibold crm-text">{value}</span></div>; }
function SalesChart({deals}:{deals:any[]}) {
  const now=new Date(); const data=[] as {label:string;leads:number;won:number}[];
  for(let i=5;i>=0;i--){const d=new Date(now.getFullYear(),now.getMonth()-i,1);data.push({label:d.toLocaleDateString("es-EC",{month:"short"}),leads:0,won:0});}
  deals.forEach(deal=>{const d=new Date(deal.created_at);const diff=(now.getFullYear()-d.getFullYear())*12+(now.getMonth()-d.getMonth());if(diff>=0&&diff<6){const idx=5-diff;data[idx].leads++;if(deal.stage.is_won)data[idx].won++;}});
  const max=Math.max(1,...data.flatMap(d=>[d.leads,d.won])); const pts=(key:"leads"|"won")=>data.map((d,i)=>String(i*20)+","+String(88-(d[key]/max)*68)).join(" ");
  return <div><svg viewBox="0 0 100 96" className="w-full h-64" preserveAspectRatio="none">{[20,37,54,71,88].map(y=><line key={y} x1="0" x2="100" y1={y} y2={y} stroke="var(--crm-border)" strokeWidth=".45"/>)}<polyline fill="none" stroke="var(--crm-accent)" strokeWidth="1.8" vectorEffect="non-scaling-stroke" points={pts("leads")}/><polyline fill="none" stroke="var(--crm-accent-hover)" strokeOpacity=".45" strokeWidth="1.4" vectorEffect="non-scaling-stroke" points={pts("won")}/></svg><div className="grid grid-cols-6 mt-2">{data.map(d=><span key={d.label} className="text-center text-[10px] crm-muted capitalize">{d.label}</span>)}</div></div>;
}
