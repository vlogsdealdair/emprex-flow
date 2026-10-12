import { useState, type ReactNode, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCurrentProfile, useTeam } from '@/hooks/useCrm';
import { formatUsd as formatCurrency } from '@/services/productionService';
import { fetchProduction, fetchProductionDetail, productionAction, productionKey, PRODUCTION_STATES, productionMetrics, projectFinance, uploadProductionFile, openProductionFile, type ProductionProject } from '@/services/productionService';
import type { Json } from '@/integrations/supabase/database.types';

const input='crm-input w-full rounded-lg border px-3 py-2 text-sm';
const button='production-button rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50';
export default function ProductionSection({dashboard=false}: {dashboard?:boolean}) {
  const {data:profile}=useCurrentProfile();
  const {data:projects=[],isLoading,error}=useQuery({queryKey:[...productionKey,profile?.id],queryFn:fetchProduction,enabled:!!profile,refetchInterval:30000});
  const [selected,setSelected]=useState<string|null>(null);
  const [filter,setFilter]=useState('Todos');
  const [search,setSearch]=useState('');
  const metrics=productionMetrics(projects);
  const project=projects.find(p=>p.id===selected);
  const admin=profile?.role==='admin';
  const visible=projects.filter(p=>(filter==='Todos'||p.status===filter)&&`${p.client_name} ${p.service_name??''}`.toLowerCase().includes(search.toLowerCase()));
  return <div className="p-5 md:p-7 space-y-6 crm-text max-w-7xl mx-auto">
    <div><h1 className="text-2xl font-bold">{dashboard?'Mi operación técnica':'Producción'}</h1><p className="crm-muted text-sm mt-1">{admin?'Asigna proyectos, aprueba cotizaciones y controla entregas.':'Tus proyectos, entregas y pagos aprobados.'}</p></div>
    {isLoading?<p role="status">Cargando proyectos…</p>:error?<div role="alert" className="text-red-500">No se pudo cargar Producción: {error.message}</div>:<>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">{[
        ['Proyectos activos',metrics.active],['Entregados este mes',metrics.deliveredMonth],['Entregas a tiempo',metrics.onTime===null?'—':`${metrics.onTime}%`],
        [admin?'Costo técnico aprobado':'Mis ganancias',formatCurrency(metrics.earnings)],['Pendiente de pago',formatCurrency(metrics.pending)]
      ].map(([label,value])=><div key={label} className="crm-card border rounded-xl p-4"><p className="text-xs crm-muted">{label}</p><p className="text-2xl font-bold mt-2">{value}</p></div>)}</div>
      <p className="text-xs crm-muted">Ganancias = honorarios aprobados acumulados. Entregas a tiempo = entregadas dentro de su fecha aprobada, incluidos ajustes autorizados.</p>
      <div className="flex flex-wrap gap-3"><input aria-label="Buscar proyecto" placeholder="Buscar cliente o servicio" className={`${input} max-w-sm`} value={search} onChange={e=>setSearch(e.target.value)}/><select aria-label="Filtrar por estado" className={`${input} max-w-xs`} value={filter} onChange={e=>setFilter(e.target.value)}><option>Todos</option>{PRODUCTION_STATES.map(s=><option key={s}>{s}</option>)}</select></div>
      {visible.length===0?<div className="crm-card border rounded-xl p-10 text-center crm-muted">{projects.length===0?(admin?'Los deals ganados crearán sus proyectos aquí. Crea el acceso del socio en Configuración → Crear usuario → Socio técnico.':'Todavía no tienes proyectos asignados.'):'No hay proyectos con este filtro.'}</div>:<div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">{visible.map(p=><button key={p.id} onClick={()=>setSelected(p.id)} className="crm-card border rounded-xl p-5 text-left hover:border-blue-500"><div className="flex justify-between gap-2"><h2 className="font-bold">{p.client_name}</h2><span className="text-xs crm-accent">{p.status}</span></div><p className="text-sm crm-muted mt-1">{p.service_name??'Servicio sin especificar'}</p><p className="text-xs crm-muted mt-4">{p.partner_name??'Sin socio asignado'} · Entrega: {p.due_date??'Por aprobar'}</p><progress aria-label={`Avance de ${p.client_name}`} value={p.progress} max={100} className="w-full h-2 mt-3"/><div className="flex justify-between text-xs mt-2"><span>{p.progress}%</span><span>{p.approved_cost===null?'Cotización pendiente':`${formatCurrency(p.approved_cost)} aprobados`}</span></div></button>)}</div>}
      {project?<ProjectEditor key={`${project.id}-${project.updated_at}`} project={project} admin={admin} close={()=>setSelected(null)}/>:null}
    </>}
  </div>;
}
function Field({label,children}: {label:string;children:ReactNode}) {return <label className="block text-sm space-y-1"><span className="crm-muted">{label}</span>{children}</label>}
function ProjectEditor({project:p,admin,close}: {project:ProductionProject;admin:boolean;close:()=>void}) {
  const qc=useQueryClient();
  const {data:team=[]}=useTeam(admin);
  const detail=useQuery({queryKey:[...productionKey,'detail',p.id],queryFn:()=>fetchProductionDetail(p.id)});
  const [message,setMessage]=useState('');
  const [cost,setCost]=useState(String(p.estimated_cost??''));
  const [days,setDays]=useState(String(p.estimated_days??''));
  const [complexity,setComplexity]=useState(p.complexity);
  const [status,setStatus]=useState(p.status);
  const [progress,setProgress]=useState(p.progress);
  const [materials,setMaterials]=useState(p.materials_ready);
  const [design,setDesign]=useState(p.design_approved);
  const [preview,setPreview]=useState(p.preview_url??'');
  const [due,setDue]=useState(p.due_date??'');
  const [scope,setScope]=useState(p.scope);
  const [note,setNote]=useState('');
  const [extraReason,setExtraReason]=useState('');
  const [extraCost,setExtraCost]=useState('');
  const [extraDays,setExtraDays]=useState('');
  const [amount,setAmount]=useState('');
  const [otherAmount,setOtherAmount]=useState('');
  const [paymentNote,setPaymentNote]=useState('');
  const [costDescription,setCostDescription]=useState('');
  const mutation=useMutation({mutationFn:({action,data}:{action:string;data:Record<string,Json|undefined>})=>productionAction(p.id,action,data),onSuccess:async()=>{setMessage('Cambios guardados.');await qc.invalidateQueries({queryKey:productionKey});},onError:(e)=>setMessage(e.message)});
  const upload=useMutation({mutationFn:(file:File)=>uploadProductionFile(p.id,file),onSuccess:()=>qc.invalidateQueries({queryKey:[...productionKey,'detail',p.id]}),onError:e=>setMessage(e.message)});
  const busy=mutation.isPending||upload.isPending;
  const act=(action:string,data:Record<string,Json|undefined>)=>{setMessage('');mutation.mutate({action,data});};
  const submit=(action:string,data:Record<string,Json|undefined>)=>(e:FormEvent)=>{e.preventDefault();act(action,data);};
  const finance=projectFinance(p);
  return <section className="crm-card border rounded-2xl p-5 space-y-6" aria-label={`Detalle de ${p.client_name}`}>
    <div className="flex justify-between"><div><h2 className="text-xl font-bold">{p.client_name}</h2><p className="crm-muted text-sm">{p.company} · {p.client_email} · {p.client_phone}</p></div><button className={button} onClick={close}>Cerrar detalle</button></div>
    {message?<p role="status" className="text-sm crm-accent">{message}</p>:null}
    {admin?<Field label="Socio asignado"><select className={input} value={p.partner_id??''} disabled={busy||!!p.approved_at} onChange={e=>act('assign',{partner_id:e.target.value})}><option value="" disabled>Selecciona un socio</option>{team.filter(t=>t.role==='technical_partner').map(t=><option key={t.id} value={t.id}>{t.full_name}</option>)}</select></Field>:null}
    <div><h3 className="font-semibold mb-2">Alcance contratado</h3>{admin?<form onSubmit={submit('scope',{scope})} className="space-y-2"><textarea aria-label="Alcance contratado" className={input} value={scope} onChange={e=>setScope(e.target.value)}/><button className={button} disabled={busy}>Guardar alcance</button></form>:<p className="text-sm whitespace-pre-wrap">{p.scope||'El administrador debe completar el alcance.'}</p>}</div>
    <form onSubmit={submit('estimate',{cost:Number(cost),days:Number(days),complexity})} className="space-y-3"><h3 className="font-semibold">Cotización técnica {p.approved_at?'· Aprobada y bloqueada':''}</h3><div className="grid md:grid-cols-3 gap-3"><Field label="Mi costo técnico (USD)"><input className={input} type="number" min="0" step="0.01" required disabled={!!p.approved_at} value={cost} onChange={e=>setCost(e.target.value)}/></Field><Field label="Tiempo de entrega (días calendario)"><input className={input} type="number" min="1" step="1" required disabled={!!p.approved_at} value={days} onChange={e=>setDays(e.target.value)}/></Field><Field label="Complejidad"><select className={input} disabled={!!p.approved_at} value={complexity} onChange={e=>setComplexity(e.target.value as typeof complexity)}>{['Básica','Media','Avanzada'].map(c=><option key={c}>{c}</option>)}</select></Field></div>{!p.approved_at?<button className={button} disabled={busy}>Enviar estimación</button>:<p className="text-sm crm-muted">Total aprobado con extras: {formatCurrency(p.approved_cost??0)} · {p.approved_days} días</p>}</form>
    {admin&&!p.approved_at?<form onSubmit={submit('approve',{due_date:due})} className="flex items-end gap-3"><Field label="Fecha de entrega aprobada"><input className={input} type="date" required value={due} onChange={e=>setDue(e.target.value)}/></Field><button className={button} disabled={busy||p.estimated_cost===null||!p.partner_id}>Aprobar costo y plazo</button></form>:null}
    <form onSubmit={submit('progress',{status,progress,materials_ready:materials,design_approved:design,preview_url:preview})} className="space-y-3"><h3 className="font-semibold">Ejecución y entrega</h3><div className="grid md:grid-cols-3 gap-3"><Field label="Estado"><select className={input} value={status} onChange={e=>setStatus(e.target.value as typeof status)}>{PRODUCTION_STATES.map(s=><option key={s}>{s}</option>)}</select></Field><Field label="Avance (%)"><input className={input} type="number" min="0" max="100" required value={progress} onChange={e=>setProgress(Number(e.target.value))}/></Field><Field label="Enlace de prueba"><input className={input} type="url" value={preview} onChange={e=>setPreview(e.target.value)} placeholder="https://…"/></Field></div><div className="flex flex-wrap gap-4 text-sm"><label><input type="checkbox" checked={materials} onChange={e=>setMaterials(e.target.checked)}/> Materiales críticos completos</label><label><input type="checkbox" checked={design} onChange={e=>setDesign(e.target.checked)}/> Diseño aprobado por el cliente</label></div><button className={button} disabled={busy}>Guardar avance</button><p className="crm-muted text-xs">Logo, textos, fotos y accesos necesarios deben estar listos antes de Diseño. Desarrollo requiere diseño aprobado. Fecha comprometida: {p.due_date??'Por aprobar'}.</p></form>
    <div><h3 className="font-semibold mb-3">Rentabilidad del proyecto</h3><div className="grid grid-cols-2 md:grid-cols-4 gap-3">{[['Precio vendido',formatCurrency(p.sold_price)],['Comisión comercial',formatCurrency(p.commercial_commission)],['Otros costos',formatCurrency(p.other_costs)],['Margen EMPREX',finance.margin===null?'Por aprobar':formatCurrency(finance.margin)],['Mi pago aprobado',p.approved_cost===null?'Por aprobar':formatCurrency(p.approved_cost)],['Pagado',formatCurrency(p.technical_paid)],['Pendiente',formatCurrency(finance.pending)]].map(([k,v])=><div key={k} className="border crm-border rounded-lg p-3"><p className="text-xs crm-muted">{k}</p><p className="font-bold mt-1">{v}</p></div>)}</div></div>
    {p.approved_at?<form onSubmit={submit('adjustment',{reason:extraReason,cost:Number(extraCost),days:Number(extraDays)})} className="space-y-3"><h3 className="font-semibold">Solicitar ajuste por extras</h3><Field label="Motivo y trabajo fuera del alcance"><textarea className={input} required value={extraReason} onChange={e=>setExtraReason(e.target.value)}/></Field><div className="grid md:grid-cols-2 gap-3"><Field label="Costo técnico adicional (USD)"><input className={input} type="number" min="0" step="0.01" required value={extraCost} onChange={e=>setExtraCost(e.target.value)}/></Field><Field label="Días adicionales"><input className={input} type="number" min="0" step="1" required value={extraDays} onChange={e=>setExtraDays(e.target.value)}/></Field></div><button className={button} disabled={busy||p.status==='Cerrado'}>Solicitar aprobación</button></form>:null}
    {detail.isLoading?<p>Cargando archivos y movimientos…</p>:detail.error?<p role="alert" className="text-red-500">{detail.error.message}</p>:<>
      <div className="space-y-3"><h3 className="font-semibold">Solicitudes de ajuste</h3>{detail.data?.adjustments.map(a=><div key={a.id} className="border crm-border rounded-lg p-3"><p className="text-sm">{a.reason}</p><p className="crm-muted text-xs mt-1">{formatCurrency(a.extra_cost)} · {a.extra_days} días · {a.status}</p>{admin&&a.status==='Pendiente'?<div className="flex gap-2 mt-2"><button className={button} disabled={busy} onClick={()=>act('review_adjustment',{adjustment_id:a.id,decision:'Aprobado'})}>Aprobar</button><button className={button} disabled={busy} onClick={()=>act('review_adjustment',{adjustment_id:a.id,decision:'Rechazado'})}>Rechazar</button></div>:null}</div>)}</div>
      <div><h3 className="font-semibold mb-2">Pagos propios</h3>{detail.data?.payments.length===0?<p className="text-sm crm-muted">Sin pagos registrados.</p>:detail.data?.payments.map(pay=><p key={pay.id} className="text-sm py-1">{formatCurrency(pay.amount)} · {new Date(pay.paid_at).toLocaleDateString('es-EC')} · {pay.note}</p>)}</div>
      <div className="space-y-2"><h3 className="font-semibold">Archivos privados</h3><label className="text-sm crm-muted">Subir archivo (máximo 20 MB)<input type="file" className="block mt-2" disabled={busy} onChange={e=>{const f=e.target.files?.[0];if(f)upload.mutate(f);e.target.value='';}}/></label>{detail.data?.files.map(f=><button key={f.name} className="block text-sm crm-accent underline break-all text-left" onClick={()=>void openProductionFile(p.id,f.name).catch(e=>setMessage(e.message))}>{f.name.slice(37)}</button>)}</div>
      <div><h3 className="font-semibold mb-2">Historial de avances</h3>{detail.data?.events.map(event=><div key={event.id} className="text-xs crm-muted border-b crm-border py-2"><span>{new Date(event.created_at).toLocaleString('es-EC')} · {eventLabels[event.action]??event.action}</span>{event.action==='note'?<p className="crm-text mt-1">{readNote(event.body)}</p>:null}</div>)}</div>
    </>}
    <form onSubmit={submit('note',{note})} className="space-y-2"><Field label="Registrar avance o corrección"><textarea className={input} required value={note} onChange={e=>setNote(e.target.value)}/></Field><button className={button} disabled={busy}>Registrar nota</button></form>
    {admin?<div className="grid md:grid-cols-2 gap-4"><form onSubmit={submit('payment',{amount:Number(amount),note:paymentNote})} className="space-y-2"><h3 className="font-semibold">Registrar pago al socio</h3><Field label="Monto pagado (USD)"><input type="number" min="0.01" max={finance.pending} step="0.01" required className={input} value={amount} onChange={e=>setAmount(e.target.value)}/></Field><button className={button} disabled={busy||!finance.pending}>Registrar pago</button><Field label="Referencia del pago"><input className={input} value={paymentNote} onChange={e=>setPaymentNote(e.target.value)}/></Field></form><form onSubmit={submit('cost',{amount:Number(otherAmount),description:costDescription})} className="space-y-2"><h3 className="font-semibold">Registrar otro costo</h3><Field label="Monto de otro costo (USD)"><input type="number" min="0.01" step="0.01" required className={input} value={otherAmount} onChange={e=>setOtherAmount(e.target.value)}/></Field><Field label="Descripción / referencia"><input className={input} required value={costDescription} onChange={e=>setCostDescription(e.target.value)}/></Field><button className={button} disabled={busy}>Registrar costo</button></form></div>:null}
  </section>;
}
function readNote(body:string|null) {try {return String(JSON.parse(body??'{}').note??'');}catch{return body;}}

const eventLabels: Record<string,string>={assign:"Socio asignado",estimate:"Cotización enviada",approve:"Cotización aprobada",progress:"Avance actualizado",adjustment:"Ajuste solicitado",review_adjustment:"Ajuste revisado",payment:"Pago registrado",cost:"Costo registrado",scope:"Alcance actualizado",note:"Nota de avance"};
