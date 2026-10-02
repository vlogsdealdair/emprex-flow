import { useState } from "react";
import { FileSpreadsheet, Upload } from "lucide-react";
import { useCurrentProfile, useTeam } from "@/hooks/useCrm";
import { importLeadsFile } from "@/services/adminService";

const TOOLS = [
  { name: "WhatsApp Business", desc: "Comunicación con leads y clientes", href: "https://web.whatsapp.com" },
  { name: "Google Calendar", desc: "Agenda de reuniones y seguimientos", href: "https://calendar.google.com" },
  { name: "Google Drive", desc: "Documentos y recursos compartidos", href: "https://drive.google.com" },
];

export default function ToolsSection() {
  const { data: profile } = useCurrentProfile();
  const { data: team = [] } = useTeam(profile?.role === "admin");
  const [file, setFile] = useState<File | null>(null);
  const [setterId, setSetterId] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ imported: number; skipped: number; errors: { row: number; message: string }[] } | null>(null);
  const [error, setError] = useState("");

  const runImport = async () => {
    if (!file) return;
    setImporting(true);
    setError("");
    setResult(null);
    try {
      const data = await importLeadsFile(file, setterId || null);
      setResult(data);
      setFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo importar el archivo.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="p-5 md:p-6 max-w-5xl mx-auto space-y-5">
      <div>
        <h2 className="text-sm font-bold text-white">Herramientas</h2>
        <p className="text-xs text-slate-600 mt-0.5">Accesos rápidos y utilidades de EMPREX CRM.</p>
      </div>

      {profile?.role === "admin" && (
        <section className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-900 grid place-items-center text-emerald-400">
              <FileSpreadsheet size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Importar leads desde Excel</h3>
              <p className="text-xs text-slate-600 mt-1">
                Sube .xlsx, .xls o .csv. El sistema detecta columnas como nombre, teléfono/WhatsApp, email, empresa, servicio, origen, valor y notas.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-[1fr_220px_auto] gap-3">
            <label className="cursor-pointer bg-slate-950 border border-dashed border-slate-700 rounded-lg px-3 py-3 text-xs text-slate-400 flex items-center gap-2">
              <Upload size={14} />
              <span className="truncate">{file?.name || "Seleccionar archivo Excel"}</span>
              <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={e => setFile(e.target.files?.[0] ?? null)} />
            </label>

            <select value={setterId} onChange={e => setSetterId(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300">
              <option value="">Sin asignar Setter</option>
              {team.filter(m => m.role === "setter").map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
            </select>

            <button onClick={() => void runImport()} disabled={!file || importing}
              className="px-4 py-2 rounded-lg bg-blue-600 disabled:opacity-50 text-white text-xs font-bold">
              {importing ? "Importando..." : "Importar leads"}
            </button>
          </div>

          <div className="mt-3 text-[11px] text-slate-600">
            Cada fila válida se crea como contacto + oportunidad en la etapa <strong className="text-slate-400">Nuevo</strong>. Los teléfonos ecuatorianos 09xxxxxxxx se convierten automáticamente a +593.
          </div>

          {result && (
            <div className="mt-4 bg-slate-950 border border-slate-800 rounded-lg p-3">
              <p className="text-xs font-semibold text-emerald-400">{result.imported} leads importados.</p>
              <p className="text-xs text-slate-500 mt-1">{result.skipped} filas omitidas.</p>
              {result.errors.length > 0 && (
                <div className="mt-2 max-h-28 overflow-y-auto text-[11px] text-amber-500 space-y-1">
                  {result.errors.slice(0, 10).map(e => <p key={`${e.row}-${e.message}`}>Fila {e.row}: {e.message}</p>)}
                </div>
              )}
            </div>
          )}

          {error && <div className="mt-3 text-xs text-red-400">{error}</div>}
        </section>
      )}

      <div className="grid md:grid-cols-3 gap-3">
        {TOOLS.map(tool => (
          <a key={tool.name} href={tool.href} target="_blank" rel="noreferrer"
            className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition-colors">
            <p className="text-sm font-semibold text-slate-200">{tool.name}</p>
            <p className="text-xs text-slate-500 mt-1">{tool.desc}</p>
            <p className="text-xs text-blue-400 mt-4">Abrir →</p>
          </a>
        ))}
      </div>
    </div>
  );
}
