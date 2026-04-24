import { useClientes } from "@/hooks/useClientes";
import { formatCurrency } from "@/utils/formatters";

export function TeamSection() {
  const { data: all = [], isLoading } = useClientes();
  const setterMap: Record<string, { total: number; cerrados: number; activos: number; revenue: number; pipeline: number; servicios: Record<string, number> }> = {};
  all.forEach(c => {
    const s = c.setter_asignado || "Sin asignar";
    if (!setterMap[s]) setterMap[s] = { total: 0, cerrados: 0, activos: 0, revenue: 0, pipeline: 0, servicios: {} };
    setterMap[s].total++;
    setterMap[s].pipeline += c.valor_potencial ?? 0;
    const svc = c.servicio_adquirido || "Otro";
    setterMap[s].servicios[svc] = (setterMap[s].servicios[svc] || 0) + 1;
    if (c.cerro_la_venta) { setterMap[s].cerrados++; setterMap[s].revenue += c.valor_potencial ?? 0; }
    else setterMap[s].activos++;
  });
  const ranking = Object.entries(setterMap).sort((a, b) => b[1].cerrados - a[1].cerrados);

  return (
    <div className="p-5 md:p-6 max-w-5xl mx-auto space-y-5">
      <div>
        <h2 className="text-sm font-bold text-white">Rendimiento del Equipo</h2>
        <p className="text-xs text-slate-600 mt-0.5">Métricas individuales por setter</p>
      </div>
      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-4">{[1,2].map(i => <div key={i} className="h-44 bg-slate-900 border border-slate-800 rounded-xl animate-pulse" />)}</div>
      ) : ranking.length === 0 ? (
        <div className="text-center py-16 text-slate-600 text-sm">Sin datos de equipo aún.</div>
      ) : (
        <>
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60">
                  {["#","Setter","Total","Cerrados","Activos","Conversión","Revenue"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {ranking.map(([name, s], i) => {
                  const conv = s.total > 0 ? Math.round((s.cerrados / s.total) * 100) : 0;
                  return (
                    <tr key={name} className="hover:bg-slate-800/25 transition-colors">
                      <td className="px-4 py-3.5"><span className="text-xs font-bold text-slate-500">#{i+1}</span></td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-md bg-slate-800 border border-slate-700 flex items-center justify-center">
                            <span className="text-[10px] font-bold text-slate-400">{name.slice(0,2).toUpperCase()}</span>
                          </div>
                          <span className="text-sm font-semibold text-slate-200">{name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5"><span className="text-sm text-slate-300 tabular-nums">{s.total}</span></td>
                      <td className="px-4 py-3.5"><span className="text-sm font-semibold text-emerald-400 tabular-nums">{s.cerrados}</span></td>
                      <td className="px-4 py-3.5"><span className="text-sm text-slate-400 tabular-nums">{s.activos}</span></td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${conv}%` }} />
                          </div>
                          <span className="text-xs text-slate-400 tabular-nums">{conv}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5"><span className="text-sm font-bold text-white tabular-nums">{formatCurrency(s.revenue)}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {ranking.map(([name, s]) => {
              const conv = s.total > 0 ? Math.round((s.cerrados / s.total) * 100) : 0;
              const topSvc = Object.entries(s.servicios).sort((a,b) => b[1]-a[1])[0]?.[0] ?? "—";
              return (
                <div key={name} className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center">
                        <span className="text-xs font-bold text-slate-300">{name.slice(0,2).toUpperCase()}</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{name}</p>
                        <p className="text-xs text-slate-600">Principal: {topSvc}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-600">Revenue</p>
                      <p className="text-sm font-bold text-white tabular-nums">{formatCurrency(s.revenue)}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {([["Total", s.total], ["Cerrados", s.cerrados], ["Activos", s.activos]] as [string, number][]).map(([l, v]) => (
                      <div key={l} className="bg-slate-800/50 rounded-lg p-2.5 text-center">
                        <p className="text-lg font-bold text-white tabular-nums">{v}</p>
                        <p className="text-[10px] text-slate-600 mt-0.5">{l}</p>
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-[10px] text-slate-600">Tasa de cierre</span>
                      <span className="text-[10px] font-bold text-slate-300">{conv}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${conv}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default TeamSection;

const TOOLS = [
  { category: "Scripts de Venta", items: [
    { name: "Script: Discovery Call", desc: "Preguntas clave para la llamada inicial", tag: "Script", link: "#" },
    { name: "Script: Manejo de Objeciones", desc: "Respuestas para las 5 objeciones más comunes", tag: "Script", link: "#" },
    { name: "Script: Cierre de Venta", desc: "Técnicas de cierre probadas por servicio", tag: "Script", link: "#" },
  ]},
  { category: "Agendamiento", items: [
    { name: "Calendly — Leandro", desc: "Enlace para agendar llamadas de discovery", tag: "Calendly", link: "https://calendly.com" },
    { name: "Calendly — Equipo", desc: "Enlace general del equipo de setters", tag: "Calendly", link: "https://calendly.com" },
  ]},
  { category: "Recursos EMPREX", items: [
    { name: "Portafolio de Servicios", desc: "Presentación para enviar al cliente", tag: "PDF", link: "#" },
    { name: "Casos de Éxito", desc: "Resultados reales de clientes anteriores", tag: "Doc", link: "#" },
    { name: "Propuesta Comercial", desc: "Template editable de propuesta", tag: "Doc", link: "#" },
  ]},
  { category: "Herramientas", items: [
    { name: "Notion — Workspace", desc: "Base de conocimiento y docs del equipo", tag: "Tool", link: "https://notion.so" },
    { name: "Google Drive", desc: "Archivos y recursos compartidos", tag: "Tool", link: "https://drive.google.com" },
    { name: "WhatsApp Business", desc: "Canal de comunicación con leads", tag: "WA", link: "https://wa.me" },
  ]},
];

export function ToolsSection() {
  return (
    <div className="p-5 md:p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-sm font-bold text-white">Herramientas</h2>
        <p className="text-xs text-slate-600 mt-0.5">Scripts, recursos y herramientas del equipo</p>
      </div>
      {TOOLS.map(({ category, items }) => (
        <div key={category}>
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3 px-1">{category}</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {items.map(tool => (
              <a key={tool.name} href={tool.link} target="_blank" rel="noopener noreferrer"
                className="group bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition-all flex flex-col gap-2.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">{tool.name}</p>
                  <span className="flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400">{tool.tag}</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">{tool.desc}</p>
                <p className="text-xs text-blue-400 group-hover:text-blue-300 transition-colors mt-auto">Abrir →</p>
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function SettingsSection({ userEmail }: { userEmail: string }) {
  const SETTERS = ["Leandro M.", "Aldair V."];
  const SERVICIOS = ["Campañas EMPREX", "Diseño de Landing Page", "Vlog Growth Specialist"];
  return (
    <div className="p-5 md:p-6 max-w-2xl mx-auto space-y-5">
      <div>
        <h2 className="text-sm font-bold text-white">Configuración</h2>
        <p className="text-xs text-slate-600 mt-0.5">Gestión del sistema · Solo administradores</p>
      </div>
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Cuenta Activa</h3>
        <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
          <div className="w-8 h-8 rounded-md bg-blue-600 flex items-center justify-center">
            <span className="text-xs font-bold text-white">{userEmail.slice(0,2).toUpperCase()}</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-200">{userEmail}</p>
            <p className="text-xs text-blue-400">Administrador</p>
          </div>
        </div>
      </div>
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Setters Registrados</h3>
        <div className="space-y-2">
          {SETTERS.map(name => (
            <div key={name} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-md bg-slate-700 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-slate-300">{name.slice(0,2).toUpperCase()}</span>
                </div>
                <span className="text-sm text-slate-200">{name}</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 border border-emerald-900 px-2 py-0.5 rounded">Activo</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-600 mt-3 leading-relaxed">Para agregar un setter: Supabase → Authentication → Users → Add User.</p>
      </div>
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Servicios</h3>
        <div className="space-y-2">
          {SERVICIOS.map(svc => (
            <div key={svc} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
              <span className="text-sm text-slate-200">{svc}</span>
              <span className="text-[10px] font-bold text-blue-400 bg-blue-950 border border-blue-900 px-2 py-0.5 rounded">Activo</span>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Base de Datos</h3>
        <p className="text-xs text-slate-500 leading-relaxed mb-3">Los datos se sincronizan en tiempo real entre todos los usuarios.</p>
        <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 transition-colors border border-slate-800 hover:border-slate-700 px-3 py-2 rounded-lg">
          Ir a Supabase Dashboard →
        </a>
      </div>
    </div>
  );
}