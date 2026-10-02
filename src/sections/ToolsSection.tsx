const TOOLS = [
  { name: "WhatsApp Business", desc: "Comunicación con leads y clientes", href: "https://web.whatsapp.com" },
  { name: "Google Calendar", desc: "Agenda de reuniones y seguimientos", href: "https://calendar.google.com" },
  { name: "Google Drive", desc: "Documentos y recursos compartidos", href: "https://drive.google.com" },
];

export default function ToolsSection() {
  return (
    <div className="p-5 md:p-6 max-w-5xl mx-auto space-y-5">
      <div>
        <h2 className="text-sm font-bold text-white">Herramientas</h2>
        <p className="text-xs text-slate-600 mt-0.5">Accesos rápidos para el equipo comercial.</p>
      </div>
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
