import { useState } from "react";
import { ExternalLink, FileSpreadsheet, Link2, Save, Upload } from "lucide-react";
import { useCurrentProfile, useTeam, useToolLinks, useUpdateToolLink } from "@/hooks/useCrm";
import { importLeadsFile } from "@/services/adminService";

export default function ToolsSection() {
  const { data: profile } = useCurrentProfile();
  const { data: team = [] } = useTeam(profile?.role === "admin");
  const { data: tools = [] } = useToolLinks();
  const updateTool = useUpdateToolLink();
  const [drafts, setDrafts] = useState<Record<string,{name:string;description:string;url:string}>>({});
  const [file, setFile] = useState<File|null>(null);
  const [setterId, setSetterId] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{imported:number;skipped:number;errors:{row:number;message:string}[]}|null>(null);
  const [error, setError] = useState("");
  if (!profile) return null;
  const isAdmin=profile.role==="admin";
  const visibleTools=isAdmin?tools:tools.filter(t=>t.is_active);

  const runImport=async()=>{ if(!file)return; setImporting(true); setError(""); setResult(null); try{ const data=await importLeadsFile(file,setterId||null); setResult(data); setFile(null);}catch(err){setError(err instanceof Error?err.message:"No se pudo importar.");}finally{setImporting(false);} };
  const saveTool=async(id:string)=>{ const tool=tools.find(t=>t.id===id); if(!tool)return; const draft=drafts[id]||{name:tool.name,description:tool.description||"",url:tool.url}; await updateTool.mutateAsync({id,patch:{name:draft.name,description:draft.description||null,url:draft.url}}); };

  return <div className="p-5 md:p-7 max-w-6xl mx-auto space-y-6">
    <div><p className="text-xs uppercase tracking-[.18em] crm-muted">Workspace</p><h2 className="text-2xl font-bold crm-text mt-1">Herramientas</h2><p className="text-sm crm-muted mt-1">{isAdmin?"Administra enlaces y utilidades del equipo.":"Tus accesos de trabajo en un solo lugar."}</p></div>

    {isAdmin&&<section className="crm-card rounded-2xl p-5"><div className="flex items-start gap-3 mb-4"><div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 grid place-items-center"><FileSpreadsheet size={18}/></div><div><h3 className="text-sm font-bold crm-text">Importar leads desde Excel</h3><p className="text-xs crm-muted mt-1">Detecta nombre, WhatsApp, email, empresa, servicio, origen, valor y notas.</p></div></div><div className="grid md:grid-cols-[1fr_220px_auto] gap-3"><label className="cursor-pointer rounded-xl border border-dashed crm-border px-3 py-3 text-xs crm-muted flex items-center gap-2"><Upload size={14}/><span className="truncate">{file?.name||"Seleccionar .xlsx, .xls o .csv"}</span><input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={e=>setFile(e.target.files?.[0]??null)}/></label><select value={setterId} onChange={e=>setSetterId(e.target.value)} className="rounded-xl border crm-border bg-transparent px-3 py-2 text-xs crm-text"><option value="">Sin asignar Setter</option>{team.filter(m=>m.role==="setter").map(m=><option key={m.id} value={m.id}>{m.full_name}</option>)}</select><button onClick={()=>void runImport()} disabled={!file||importing} className="px-4 py-2 rounded-xl bg-[var(--crm-accent)] text-white text-xs font-bold disabled:opacity-50">{importing?"Importando...":"Importar"}</button></div>{result&&<div className="mt-4 rounded-xl border crm-border p-3"><p className="text-xs font-semibold text-emerald-500">{result.imported} leads importados</p><p className="text-xs crm-muted mt-1">{result.skipped} filas omitidas</p></div>}{error&&<p className="mt-3 text-xs text-red-500">{error}</p>}</section>}

    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">{visibleTools.map(tool=>{const draft=drafts[tool.id]||{name:tool.name,description:tool.description||"",url:tool.url}; return <article key={tool.id} className="crm-card crm-card-hover rounded-2xl p-5"><div className="w-10 h-10 rounded-xl bg-[var(--crm-glow)] crm-accent grid place-items-center mb-4"><Link2 size={17}/></div>{isAdmin?<><input value={draft.name} onChange={e=>setDrafts(p=>({...p,[tool.id]:{...draft,name:e.target.value}}))} className="w-full text-sm font-bold crm-text bg-transparent border-0 outline-none"/><textarea value={draft.description} onChange={e=>setDrafts(p=>({...p,[tool.id]:{...draft,description:e.target.value}}))} rows={2} className="w-full mt-2 text-xs crm-muted bg-transparent border crm-border rounded-lg p-2 resize-none"/><input value={draft.url} onChange={e=>setDrafts(p=>({...p,[tool.id]:{...draft,url:e.target.value}}))} className="w-full mt-2 text-xs crm-text bg-transparent border crm-border rounded-lg p-2"/><div className="flex gap-2 mt-3"><button onClick={()=>void saveTool(tool.id)} className="px-3 py-2 rounded-lg bg-[var(--crm-accent)] text-white text-xs font-semibold flex items-center gap-1.5"><Save size={12}/> Guardar</button><button onClick={()=>void updateTool.mutateAsync({id:tool.id,patch:{is_active:!tool.is_active}})} className="px-3 py-2 rounded-lg border crm-border text-xs crm-muted">{tool.is_active?"Suspender":"Activar"}</button></div></>:<><h3 className="text-sm font-bold crm-text">{tool.name}</h3><p className="text-xs crm-muted mt-1 min-h-9">{tool.description}</p><a href={tool.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs crm-accent font-semibold mt-4">Abrir herramienta <ExternalLink size={12}/></a></>}</article>})}</div>
  </div>;
}