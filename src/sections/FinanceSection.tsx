import { useMemo, useState } from "react";
import { BadgeDollarSign, Banknote, Coins, TrendingUp } from "lucide-react";
import { useCommissionRules, useCommissions, useCreateCommissionPayment, useCurrentProfile, useDeals, useUpdateCommissionRule } from "@/hooks/useCrm";
import { formatCurrency } from "@/utils/formatters";

export default function FinanceSection() {
  const { data: profile } = useCurrentProfile();
  const { data: deals = [] } = useDeals();
  const { data: commissions = [] } = useCommissions();
  const { data: rules = [] } = useCommissionRules();
  const createPayment = useCreateCommissionPayment();
  const updateRule = useUpdateCommissionRule();
  const [paymentDrafts, setPaymentDrafts] = useState<Record<string,string>>({});

  const isAdmin = profile?.role === "admin";
  const own = isAdmin ? commissions : commissions.filter(c => c.profile_id === profile?.id);
  const earned = own.reduce((sum,c) => sum + Number(c.commission_amount_usd || 0), 0);
  const paid = own.reduce((sum,c) => sum + c.payments.reduce((s,p) => s + Number(p.amount_usd || 0),0), 0);
  const pending = Math.max(0, earned - paid);
  const activeDeals = deals.filter(d => !d.stage.is_won && !d.stage.is_lost);
  const setterRule = rules.find(r => r.role === "setter" && r.event_key === "meeting_scheduled" && r.is_active);
  const closerRule = rules.find(r => r.role === "closer" && r.event_key === "won_sale" && r.is_active);

  const potential = useMemo(() => {
    if (!profile || profile.role === "admin") return 0;
    if (profile.role === "setter" && setterRule) {
      const count = activeDeals.filter(d => d.setter_id === profile.id).length;
      return setterRule.calculation_type === "flat" ? count * Number(setterRule.value || 0) : 0;
    }
    if (profile.role === "closer" && closerRule) {
      const mine = activeDeals.filter(d => d.closer_id === profile.id);
      const base = mine.reduce((s,d) => s + Number(d.potential_value_usd || 0),0);
      return closerRule.calculation_type === "percentage" ? base * Number(closerRule.value || 0) / 100 : mine.length * Number(closerRule.value || 0);
    }
    return 0;
  }, [profile, activeDeals, setterRule, closerRule]);

  if (!profile) return null;

  const pay = async (commissionId: string, max: number) => {
    const value = Number(paymentDrafts[commissionId] || 0);
    if (!value || value <= 0 || value > max) return;
    await createPayment.mutateAsync({ commissionId, amountUsd: value, createdBy: profile.id });
    setPaymentDrafts(p => ({...p,[commissionId]:""}));
  };

  return (
    <div className="p-5 md:p-7 max-w-7xl mx-auto space-y-6">
      <div><p className="text-xs uppercase tracking-[.18em] crm-muted">Finanzas</p><h2 className="text-2xl font-bold crm-text mt-1">{isAdmin ? "Comisiones del equipo" : "Mis comisiones"}</h2><p className="text-sm crm-muted mt-1">{isAdmin ? "Control de comisiones, pagos parciales y saldos." : "Lo generado, pagado y tu potencial con el pipeline actual."}</p></div>
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Stat icon={<Coins size={18}/>} label="Comisión generada" value={formatCurrency(earned)} sub={String(own.length) + " movimientos"} />
        <Stat icon={<Banknote size={18}/>} label="Pagado" value={formatCurrency(paid)} sub="Histórico acreditado" />
        <Stat icon={<BadgeDollarSign size={18}/>} label="Por cobrar" value={formatCurrency(pending)} sub="Saldo pendiente" accent />
        <Stat icon={<TrendingUp size={18}/>} label={isAdmin ? "Reglas activas" : "Potencial estimado"} value={isAdmin ? String(rules.filter(r=>r.is_active).length) : formatCurrency(potential)} sub={isAdmin ? "Setter + Closer" : "Si avanzas tu pipeline actual"} />
      </div>

      {isAdmin && <section className="crm-card rounded-2xl p-5"><div className="mb-4"><h3 className="text-sm font-bold crm-text">Reglas de comisión</h3><p className="text-xs crm-muted mt-1">Tú defines la política real de EMPREX.</p></div><div className="grid md:grid-cols-2 gap-4">{rules.map(rule => <div key={rule.id} className="rounded-xl border crm-border p-4"><div className="flex items-center justify-between mb-3"><div><p className="text-sm font-semibold crm-text">{rule.role === "setter" ? "Setter · reunión agendada" : "Closer · venta cerrada"}</p><p className="text-[11px] crm-muted">{rule.calculation_type === "flat" ? "Monto fijo" : "Porcentaje sobre venta"}</p></div><button onClick={() => void updateRule.mutateAsync({id:rule.id,patch:{is_active:!rule.is_active}})} className={rule.is_active ? "px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500" : "px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-500/10 crm-muted"}>{rule.is_active ? "Activa" : "Suspendida"}</button></div><div className="grid grid-cols-[130px_1fr] gap-2"><select value={rule.calculation_type} onChange={e => void updateRule.mutateAsync({id:rule.id,patch:{calculation_type:e.target.value}})} className="rounded-lg border crm-border bg-transparent px-3 py-2 text-xs crm-text"><option value="flat">Monto fijo</option><option value="percentage">Porcentaje</option></select><input type="number" min="0" step="0.01" defaultValue={Number(rule.value)} onBlur={e => void updateRule.mutateAsync({id:rule.id,patch:{value:Number(e.target.value)||0}})} className="rounded-lg border crm-border bg-transparent px-3 py-2 text-xs crm-text" /></div></div>)}</div></section>}

      <section className="crm-card rounded-2xl overflow-hidden"><div className="px-5 py-4 border-b crm-border"><h3 className="text-sm font-bold crm-text">{isAdmin ? "Detalle por persona" : "Historial de comisiones"}</h3></div><div className="overflow-x-auto"><table className="w-full min-w-[850px]"><thead><tr className="border-b crm-border">{["Persona","Origen","Lead","Generado","Pagado","Pendiente",isAdmin ? "Registrar pago" : "Estado"].map(h => <th key={h} className="px-4 py-3 text-left text-[10px] uppercase tracking-wider crm-muted">{h}</th>)}</tr></thead><tbody>{own.map(c => { const rowPaid=c.payments.reduce((s,p)=>s+Number(p.amount_usd||0),0); const rowPending=Math.max(0,Number(c.commission_amount_usd||0)-rowPaid); return <tr key={c.id} className="border-b crm-border last:border-0"><td className="px-4 py-3"><p className="text-sm font-semibold crm-text">{c.profile.full_name}</p><p className="text-[10px] crm-muted uppercase">{c.role}</p></td><td className="px-4 py-3 text-xs crm-muted">{c.event_key === "meeting_scheduled" ? "Reunión agendada" : "Venta cerrada"}</td><td className="px-4 py-3 text-xs crm-text">{c.deal?.contact?.full_name || "—"}</td><td className="px-4 py-3 text-sm font-bold crm-text">{formatCurrency(Number(c.commission_amount_usd||0))}</td><td className="px-4 py-3 text-sm text-emerald-500">{formatCurrency(rowPaid)}</td><td className="px-4 py-3 text-sm font-semibold text-amber-500">{formatCurrency(rowPending)}</td><td className="px-4 py-3">{isAdmin ? <div className="flex gap-2"><input value={paymentDrafts[c.id] ?? ""} onChange={e => setPaymentDrafts(p=>({...p,[c.id]:e.target.value}))} type="number" min="0" max={rowPending} step="0.01" placeholder="Monto" className="w-24 rounded-lg border crm-border bg-transparent px-2 py-1.5 text-xs crm-text" /><button disabled={rowPending<=0} onClick={() => void pay(c.id,rowPending)} className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold disabled:opacity-40">Pagar</button></div> : <span className={rowPending > 0 ? "text-[10px] font-bold px-2 py-1 rounded-full bg-amber-500/10 text-amber-500" : "text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-500"}>{rowPending > 0 ? "Por cobrar" : "Pagado"}</span>}</td></tr>; })}{own.length===0 && <tr><td colSpan={7} className="px-4 py-12 text-center text-sm crm-muted">Todavía no hay comisiones generadas.</td></tr>}</tbody></table></div></section>
    </div>
  );
}

function Stat({icon,label,value,sub,accent=false}:{icon:React.ReactNode;label:string;value:string;sub:string;accent?:boolean}) {
  return <div className={"crm-card crm-card-hover rounded-2xl p-5 " + (accent ? "crm-kpi-accent" : "")}><div className="w-9 h-9 rounded-xl bg-[var(--crm-glow)] crm-accent grid place-items-center mb-4">{icon}</div><p className="text-[11px] uppercase tracking-wider crm-muted">{label}</p><p className="text-2xl font-bold crm-text mt-1">{value}</p><p className="text-xs crm-muted mt-1">{sub}</p></div>;
}