import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/database.types';

export const PRODUCTION_STATES = ['Por revisar','Pendiente de materiales','Cotización técnica','Aprobado','Diseño','Desarrollo','Revisión 1','Revisión 2','Listo para entrega','Entregado','Garantía','Cerrado'] as const;
export type ProductionState = typeof PRODUCTION_STATES[number];
export interface ProductionProject {
  id: string; deal_id: string; client_id: string; partner_id: string | null; partner_name: string | null;
  status: ProductionState; scope: string; complexity: 'Básica' | 'Media' | 'Avanzada';
  estimated_cost: number | null; estimated_days: number | null; approved_cost: number | null; approved_days: number | null;
  approved_at: string | null; due_date: string | null; delivered_at: string | null; delivered_due_date: string | null;
  progress: number; materials_ready: boolean; design_approved: boolean; preview_url: string | null;
  client_name: string; client_email: string | null; client_phone: string | null; company: string | null;
  service_name: string | null; sold_price: number; commercial_commission: number; other_costs: number; technical_paid: number;
  created_at: string; updated_at: string;
}
export type ProductionAdjustment = {
  id: string; project_id: string; reason: string; extra_cost: number; extra_days: number;
  status: 'Pendiente' | 'Aprobado' | 'Rechazado'; review_note: string | null; created_at: string;
}
export type ProductionPayment = { id: string; project_id: string; amount: number; note: string | null; paid_at: string }
export type ProductionEvent = { id: string; project_id: string; action: string; body: string | null; created_at: string }
export const productionKey = ['crm', 'production'] as const;
export const formatUsd = (amount:number) => new Intl.NumberFormat('es-EC',{style:'currency',currency:'USD',minimumFractionDigits:2,maximumFractionDigits:2}).format(amount);
export async function fetchProduction(): Promise<ProductionProject[]> {
  const {data,error} = await supabase.rpc('production_list');
  if(error) throw error;
  return (data ?? []) as unknown as ProductionProject[];
}
export async function productionAction(id: string, action: string, data: Record<string, Json | undefined>) {
  const {error} = await supabase.rpc('production_action', { p_id:id, p_action:action, p_data:data });
  if(error) throw error;
}
export async function fetchProductionDetail(id: string) {
  const [adjustments,payments,events,files] = await Promise.all([
    supabase.from('production_adjustments').select('*').eq('project_id',id).order('created_at',{ascending:false}),
    supabase.from('production_payments').select('*').eq('project_id',id).order('paid_at',{ascending:false}),
    supabase.from('production_events').select('*').eq('project_id',id).order('created_at',{ascending:false}),
    supabase.storage.from('production-files').list(id,{limit:1000}),
  ]);
  for(const result of [adjustments,payments,events,files]) if(result.error) throw result.error;
  return {adjustments:adjustments.data ?? [],payments:payments.data ?? [],events:events.data ?? [],files:files.data ?? []};
}
export async function uploadProductionFile(id: string,file: File) {
  if(file.size>20*1024*1024) throw new Error('El archivo supera los 20 MB.');
  const name = file.name.replace(/[^a-zA-Z0-9._-]/g,'_');
  const {error} = await supabase.storage.from('production-files').upload(`${id}/${crypto.randomUUID()}-${name}`,file);
  if(error) throw error;
}
export async function openProductionFile(id: string,name: string) {
  const {data,error} = await supabase.storage.from('production-files').createSignedUrl(`${id}/${name}`,60);
  if(error) throw error;
  const anchor=document.createElement('a'); anchor.href=data.signedUrl; anchor.target='_blank'; anchor.rel='noopener noreferrer'; anchor.click();
}
export function projectFinance(p: ProductionProject) {
  return { margin:p.approved_cost===null?null:Number(p.sold_price)-Number(p.approved_cost)-Number(p.other_costs)-Number(p.commercial_commission), pending:Math.max(0,Number(p.approved_cost ?? 0)-Number(p.technical_paid)) };
}
export function productionMetrics(projects: ProductionProject[], now=new Date()) {
  const month=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Guayaquil',year:'numeric',month:'2-digit'});
  const delivered=projects.filter(p=>p.delivered_at);
  const timely=delivered.filter(p=>p.delivered_due_date && new Intl.DateTimeFormat('en-CA',{timeZone:'America/Guayaquil',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(p.delivered_at!))<=p.delivered_due_date);
  return {active:projects.filter(p=>!['Entregado','Garantía','Cerrado'].includes(p.status)).length, deliveredMonth:delivered.filter(p=>month.format(new Date(p.delivered_at!))===month.format(now)).length, onTime:delivered.length?Math.round(timely.length/delivered.length*100):null, earnings:projects.reduce((s,p)=>s+Number(p.approved_cost ?? 0),0), pending:projects.reduce((s,p)=>s+projectFinance(p).pending,0)};
}
