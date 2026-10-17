import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/database.types';

export type Prospect = {
 id:string; owner_id:string; owner_name:string; campaign_id:string|null; campaign_name:string|null; name:string; company:string; email:string; website:string; city:string; niche:string; source:string; source_url:string; notes:string;
 score:number|null; status:string; analyzed_at:string|null; replied_at:string|null; meeting_at:string|null; next_followup_at:string|null; deal_id:string|null; won:boolean; revenue:number; service_name:string|null; created_at:string;
 analysis:{summary:string;findings:string[];limitations:string;next_action:string;subject:string;body:string;sources:{uri:string;title:string}[]}|null;
};
export type ProspectMessage={id:string;prospect_id:string;template_id:string|null;subject:string;body:string;status:string;sequence:number;scheduled_at:string|null;sent_at:string|null;error:string|null;updated_at:string};
export type Campaign={id:string;name:string;niche:string;city:string;status:string};
export type EmailTemplate={id:string;name:string;subject:string;body:string;active:boolean;updated_at:string};
export type ProspectSettings={daily_limit:number;start_hour:number;end_hour:number;min_score:number;max_followups:number;followup_days:number;gemini_model:string;sending_enabled:boolean};
export type ProspectWorkspace={prospects:Prospect[];messages:ProspectMessage[];campaigns:Campaign[];templates:EmailTemplate[];events:{id:string;kind:string;detail:string;created_at:string;prospect_id:string|null}[];suppression:{email:string;reason:string}[];settings:ProspectSettings};
export type ConnectionStatus={gemini:boolean;gmail:boolean;sender:string;scheduler:boolean};
export const prospectionKey=['crm','prospection'] as const;
export async function fetchProspection():Promise<ProspectWorkspace>{
 const {data,error}=await supabase.rpc('prospection_workspace');if(error)throw error;return data as unknown as ProspectWorkspace;
}
export async function prospectAction(id:string|null,action:string,data:Record<string,Json|undefined>={}){
 const result=await supabase.rpc('prospection_action',{p_id:id,p_action:action,p_data:data});if(result.error)throw result.error;return result.data;
}
export async function prospectEngine<T=ConnectionStatus>(action:string,data:Record<string,Json|undefined>={}):Promise<T>{
 const result=await supabase.functions.invoke('prospection',{body:{action,...data}});
 if(result.error){
  const context=result.error.context;
  if(context instanceof Response){const body=await context.json().catch(()=>null);if(body?.error)throw new Error(body.error);}
  throw result.error;
 }
 if(result.data?.error)throw new Error(result.data.error);return result.data as T;
}
export function prospectMetrics(w:ProspectWorkspace){
 const sent=new Set(w.messages.filter(m=>m.status==='Enviado').map(m=>m.prospect_id));
 return {analyzed:w.prospects.filter(p=>p.analyzed_at).length,contacted:sent.size,replied:w.prospects.filter(p=>p.replied_at).length,meetings:w.prospects.filter(p=>p.meeting_at).length,won:w.prospects.filter(p=>p.won).length,revenue:w.prospects.reduce((sum,p)=>sum+Number(p.revenue||0),0),pending:w.messages.filter(m=>m.status==='Por aprobar').length};
}
export function nextProspectAction(p:Prospect,messages:ProspectMessage[],minScore:number){
 if(p.status==='No contactar'||p.status==='Descartado')return 'No contactar';
 if(p.replied_at)return p.deal_id?'Atender respuesta en Leads':'Responder y convertir en oportunidad';
 if(p.meeting_at)return 'Preparar reunión';
 if(messages.some(m=>m.status==='Por aprobar'))return 'Revisar y aprobar correo';
 if(messages.some(m=>m.status==='Aprobado'))return 'Revisar programación del correo';
 if(p.next_followup_at&&new Date(p.next_followup_at)<=new Date())return 'Preparar seguimiento';
 if(!p.analyzed_at)return 'Analizar prospecto';
 if((p.score??0)<minScore)return 'Revisar encaje comercial';
 return 'Preparar correo para aprobación';
}
export function personalize(text:string,p:Prospect){return text.replace(/\{\{(nombre|empresa|ciudad|servicio)\}\}/g,(_,key:string)=>({nombre:p.name,empresa:p.company,ciudad:p.city,servicio:p.service_name??''}[key]??''));}

