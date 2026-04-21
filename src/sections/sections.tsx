// ============================================================
// Emprex Flow — TeamSection
// ============================================================
import { useClientes } from "@/hooks/useClientes";
import { formatCurrency } from "@/utils/formatters";
import { Trophy, Target, TrendingUp } from "lucide-react";

const WIDTH_CLASSES: Record<number,string> = {
  0: "w-0",
  10: "w-[10%]",
  20: "w-[20%]",
  30: "w-[30%]",
  40: "w-[40%]",
  50: "w-[50%]",
  60: "w-[60%]",
  70: "w-[70%]",
  80: "w-[80%]",
  90: "w-[90%]",
  100: "w-[100%]",
};

const percentWidth = (value: number) => WIDTH_CLASSES[Math.min(100, Math.max(0, Math.round(value / 10) * 10))] || "w-full";

export function TeamSection() {
  const { data: all = [], isLoading } = useClientes();

  const setterMap: Record<string, { total: number; cerrados: number; activos: number; revenue: number; pipeline: number; servicios: Record<string,number> }> = {};
  all.forEach(c => {
    const s = c.setter_asignado || "Sin asignar";
    if (!setterMap[s]) setterMap[s] = { total:0, cerrados:0, activos:0, revenue:0, pipeline:0, servicios:{} };
    setterMap[s].total++;
    setterMap[s].pipeline += c.valor_potencial ?? 0;
    const svc = c.servicio_adquirido || "Otro";
    setterMap[s].servicios[svc] = (setterMap[s].servicios[svc]||0)+1;
    if (c.cerro_la_venta) { setterMap[s].cerrados++; setterMap[s].revenue += c.valor_potencial ?? 0; }
    else setterMap[s].activos++;
  });

  const ranking = Object.entries(setterMap).sort((a,b) => b[1].revenue - a[1].revenue);
  const medalColors = ["text-amber-400","text-slate-400","text-amber-700"];
  const medalBg = ["bg-amber-900/30 border-amber-800/40","bg-slate-800 border-slate-700","bg-amber-900/20 border-amber-900/30"];

  return (
    <div className="p-5 md:p-7 max-w-7xl mx-auto space-y-5">
      <div>
        <h2 className="text-base font-bold text-slate-100">Rendimiento del Equipo</h2>
        <p className="text-xs text-slate-600 mt-0.5">Métricas por setter · Ordenado por revenue</p>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {Array.from({length:4}).map((_,i)=>(
            <div key={i} className="h-40 bg-slate-900 border border-slate-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : ranking.length === 0 ? (
        <div className="text-center py-16 text-slate-600 text-sm">No hay datos de equipo aún.</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {ranking.map(([name, s], i) => {
            const conv = s.total > 0 ? +((s.cerrados/s.total)*100).toFixed(0) : 0;
            const topSvc = Object.entries(s.servicios).sort((a,b)=>b[1]-a[1])[0]?.[0] ?? "—";
            return (
              <div key={name} className={`bg-slate-900 border rounded-2xl p-5 hover:border-slate-700 transition-all ${i < 3 ? medalBg[i] : "border-slate-800"}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border font-bold text-sm ${i < 3 ? medalBg[i] : "bg-slate-800 border-slate-700 text-slate-400"} ${i < 3 ? medalColors[i] : ""}`}>
                      {i < 3 ? <Trophy size={16} /> : `#${i+1}`}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-100">{name}</p>
                      <p className="text-xs text-slate-600">Principal: {topSvc}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-600">Revenue</p>
                    <p className="text-sm font-bold text-emerald-400 font-mono">{formatCurrency(s.revenue)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[
                    { label:"Leads", value:String(s.total), icon:Target },
                    { label:"Cerrados", value:String(s.cerrados), icon:Trophy },
                    { label:"Activos", value:String(s.activos), icon:TrendingUp },
                  ].map(({label,value,icon:Icon})=>(
                    <div key={label} className="bg-slate-800/50 rounded-xl p-3 text-center">
                      <Icon size={14} className="text-slate-500 mx-auto mb-1" />
                      <p className="text-lg font-bold text-slate-200 font-mono">{value}</p>
                      <p className="text-[10px] text-slate-600 mt-0.5">{label}</p>
                    </div>
                  ))}
                </div>

                {/* Barra de conversión */}
                <div>
                  <div className="flex justify-between mb-1.5">
                    <span className="text-[10px] text-slate-600">Tasa de cierre</span>
                    <span className="text-[10px] font-bold text-emerald-400">{conv}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full bg-emerald-500 rounded-full transition-all duration-700 ${percentWidth(conv)}`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default TeamSection;


// ============================================================
// Emprex Flow — ToolsSection
// ============================================================
export function ToolsSection({ isAdmin }: { isAdmin: boolean }) {
  const tools = [
    {
      category: "Scripts de Venta",
      items: [
        { name:"Script: Discovery Call",     desc:"Preguntas clave para la llamada de descubrimiento", tag:"Script", color:"bg-blue-900/30 text-blue-400 border-blue-800/40", link:"#" },
        { name:"Script: Manejo de Objeciones",desc:"Respuestas para las 5 objeciones más comunes",     tag:"Script", color:"bg-blue-900/30 text-blue-400 border-blue-800/40", link:"#" },
        { name:"Script: Cierre de Venta",    desc:"Técnicas de cierre probadas para cada servicio",    tag:"Script", color:"bg-blue-900/30 text-blue-400 border-blue-800/40", link:"#" },
      ]
    },
    {
      category: "Agendamiento",
      items: [
        { name:"Calendly — Leandro",   desc:"Enlace para agendar llamadas con Leandro",   tag:"Calendly", color:"bg-cyan-900/30 text-cyan-400 border-cyan-800/40", link:"https://calendly.com" },
        { name:"Calendly — Equipo",    desc:"Enlace general del equipo de setters",       tag:"Calendly", color:"bg-cyan-900/30 text-cyan-400 border-cyan-800/40", link:"https://calendly.com" },
      ]
    },
    {
      category: "Recursos EMPREX",
      items: [
        { name:"Portafolio de Servicios", desc:"Presentación de servicios para enviar al cliente", tag:"PDF", color:"bg-violet-900/30 text-violet-400 border-violet-800/40", link:"#" },
        { name:"Casos de Éxito",          desc:"Resultados reales de clientes anteriores",         tag:"Doc",  color:"bg-violet-900/30 text-violet-400 border-violet-800/40", link:"#" },
        { name:"Propuesta Comercial",     desc:"Template editable de propuesta en Notion/Docs",    tag:"Doc",  color:"bg-violet-900/30 text-violet-400 border-violet-800/40", link:"#" },
      ]
    },
    {
      category: "Herramientas de Trabajo",
      items: [
        { name:"Notion — Workspace",    desc:"Base de conocimiento y docs del equipo",    tag:"Tool", color:"bg-slate-700/50 text-slate-300 border-slate-600/40", link:"https://notion.so" },
        { name:"Google Drive",          desc:"Archivos y recursos compartidos",           tag:"Tool", color:"bg-slate-700/50 text-slate-300 border-slate-600/40", link:"https://drive.google.com" },
        { name:"WhatsApp Business",     desc:"Canal de comunicación con leads",           tag:"Tool", color:"bg-emerald-900/30 text-emerald-400 border-emerald-800/40", link:"https://wa.me" },
      ]
    },
  ];

  return (
    <div className="p-5 md:p-7 max-w-7xl mx-auto space-y-6">
      <div>
        <h2 className="text-base font-bold text-slate-100">Centro de Herramientas</h2>
        <p className="text-xs text-slate-600 mt-0.5">Scripts, recursos y herramientas del equipo de ventas</p>
      </div>

      {tools.map(({ category, items }) => (
        <div key={category}>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 px-1">{category}</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {items.map(tool => (
              <a key={tool.name} href={tool.link} target="_blank" rel="noopener noreferrer"
                className="group bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 transition-all duration-200 hover:bg-slate-800/50 flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <p className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">{tool.name}</p>
                  <span className={`flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-md border ml-2 ${tool.color}`}>{tool.tag}</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">{tool.desc}</p>
                <p className="text-xs text-blue-400 mt-auto group-hover:text-blue-300 transition-colors">Abrir →</p>
              </a>
            ))}
          </div>
        </div>
      ))}

      {isAdmin && (
        <div className="bg-blue-900/20 border border-blue-800/30 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-blue-300 mb-1">Personalizar Herramientas</h3>
          <p className="text-xs text-slate-500">Como administrador puedes editar los enlaces y agregar nuevas herramientas. Próximamente disponible en Configuración.</p>
        </div>
      )}
    </div>
  );
}


// ============================================================
// Emprex Flow — SettingsSection
// ============================================================
export function SettingsSection() {
  const SETTERS_DISPONIBLES = ["Leandro M.", "Aldair V."];
  const SERVICIOS_DISPONIBLES = ["Campañas EMPREX","Diseño de Landing Page","Vlog Growth Specialist"];

  return (
    <div className="p-5 md:p-7 max-w-3xl mx-auto space-y-5">
      <div>
        <h2 className="text-base font-bold text-slate-100">Configuración del CRM</h2>
        <p className="text-xs text-slate-600 mt-0.5">Solo visible para administradores</p>
      </div>

      {/* Equipo */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <h3 className="text-sm font-bold text-slate-100 mb-4">Setters del Equipo</h3>
        <div className="space-y-2">
          {SETTERS_DISPONIBLES.map(name => (
            <div key={name} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-900/40 border border-blue-800/30 flex items-center justify-center">
                  <span className="text-xs font-bold text-blue-400">{name.slice(0,2).toUpperCase()}</span>
                </div>
                <span className="text-sm text-slate-200">{name}</span>
              </div>
              <span className="text-xs text-emerald-400 bg-emerald-900/30 border border-emerald-800/40 px-2 py-0.5 rounded-md">Activo</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-600 mt-3">Para agregar setters, crea el usuario en Supabase Auth y luego indica su nombre aquí en el código.</p>
      </div>

      {/* Servicios */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <h3 className="text-sm font-bold text-slate-100 mb-4">Servicios Disponibles</h3>
        <div className="space-y-2">
          {SERVICIOS_DISPONIBLES.map(svc => (
            <div key={svc} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl">
              <span className="text-sm text-slate-200">{svc}</span>
              <span className="text-xs text-blue-400 bg-blue-900/30 border border-blue-800/40 px-2 py-0.5 rounded-md">Activo</span>
            </div>
          ))}
        </div>
      </div>

      {/* Info Supabase */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <h3 className="text-sm font-bold text-slate-100 mb-2">Usuarios con Acceso</h3>
        <p className="text-xs text-slate-500 mb-4">Para dar acceso a un nuevo setter ve a Supabase → Authentication → Users → Add User. Coloca su email y contraseña. El CRM detecta automáticamente quién es admin y quién es setter.</p>
        <a href="https://supabase.com" target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 transition-colors bg-blue-900/20 border border-blue-800/30 px-3 py-2 rounded-xl">
          Ir a Supabase Auth →
        </a>
      </div>
    </div>
  );
}