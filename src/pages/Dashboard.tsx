// ============================================================
// Emprex Flow CRM — Layout principal + Routing de secciones
// Paleta: Navy Blue / Slate
// ============================================================
import { useState, useEffect } from "react";
import {
  LayoutDashboard, Users, UserSquare2, Wrench,
  Settings, LogOut, Menu, X, Zap, Bell, ChevronRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import DashboardHome  from "@/sections/DashboardHome";
import LeadsSection   from "@/sections/LeadsSection";
import TeamSection    from "@/sections/TeamSection";
import ToolsSection   from "@/sections/ToolsSection";
import SettingsSection from "@/sections/SettingsSection";

export const ADMIN_EMAIL = "vlogsdealdair@gmail.com";

type Section = "home" | "leads" | "team" | "tools" | "settings";

const NAV = [
  { id: "home"     as Section, icon: LayoutDashboard, label: "Dashboard"    },
  { id: "leads"    as Section, icon: Users,            label: "Leads"        },
  { id: "team"     as Section, icon: UserSquare2,      label: "Equipo", adminOnly: true },
  { id: "tools"    as Section, icon: Wrench,           label: "Herramientas" },
  { id: "settings" as Section, icon: Settings,         label: "Configuración", adminOnly: true },
];

export default function Dashboard() {
  const [section,     setSection]     = useState<Section>("home");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userEmail,   setUserEmail]   = useState("");
  const [userName,    setUserName]    = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const email = data.user?.email ?? "";
      setUserEmail(email);
      setUserName(email.split("@")[0]);
    });
  }, []);

  const isAdmin    = userEmail === ADMIN_EMAIL;
  const initials   = userName.slice(0, 2).toUpperCase() || "AD";
  const navVisible = NAV.filter(n => !n.adminOnly || isAdmin);

  const sectionTitles: Record<Section, string> = {
    home:     "Dashboard",
    leads:    "Gestión de Leads",
    team:     "Equipo",
    tools:    "Herramientas",
    settings: "Configuración",
  };

  return (
    <div className="flex h-screen bg-[#020817] text-slate-100 overflow-hidden font-sans">

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/70 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar ── */}
      <aside className={`fixed md:relative z-30 h-full flex flex-col w-60 bg-[#030d1f] border-r border-slate-800/60 transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>

        {/* Logo */}
        <div className="flex items-center gap-3 px-5 h-16 border-b border-slate-800/60 flex-shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow-lg shadow-blue-900/40">
            <Zap size={15} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white tracking-tight">Emprex Flow</p>
            <p className="text-[10px] text-slate-600 uppercase tracking-widest">CRM System</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} aria-label="Cerrar menú" className="md:hidden text-slate-600">
            <X size={15} />
          </button>
        </div>

        {/* Role badge */}
        <div className="px-4 py-3 flex-shrink-0">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border ${isAdmin ? "bg-blue-900/30 border-blue-700/30 text-blue-400" : "bg-slate-800/40 border-slate-700/30 text-slate-400"}`}>
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isAdmin ? "bg-blue-400" : "bg-slate-500"}`} />
            {isAdmin ? "Administrador" : "Setter"}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto py-1">
          {navVisible.map(({ id, icon: Icon, label }) => {
            const active = section === id;
            return (
              <button key={id} onClick={() => { setSection(id); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 group ${active ? "bg-blue-600/15 text-blue-400 font-medium border border-blue-600/20" : "text-slate-500 hover:text-slate-200 hover:bg-slate-800/50"}`}>
                <Icon size={16} className={active ? "text-blue-400" : "text-slate-600 group-hover:text-slate-400"} />
                {label}
                {active && <ChevronRight size={13} className="ml-auto text-blue-600/60" />}
              </button>
            );
          })}
        </nav>

        {/* User */}
        <div className="p-3 border-t border-slate-800/60 flex-shrink-0">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-800/50 transition-colors group cursor-default">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-white">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-300 truncate">{userName || "Usuario"}</p>
              <p className="text-[10px] text-slate-600 truncate">{userEmail}</p>
            </div>
            <button onClick={() => supabase.auth.signOut()}
              title="Cerrar sesión"
              className="text-slate-700 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Header */}
        <header className="flex-shrink-0 h-16 bg-[#030d1f]/80 backdrop-blur-sm border-b border-slate-800/60 flex items-center gap-4 px-5">
          <button onClick={() => setSidebarOpen(true)} aria-label="Abrir menú" className="md:hidden text-slate-500 hover:text-slate-300">
            <Menu size={20} />
          </button>
          <div>
            <h1 className="text-sm font-bold text-white">{sectionTitles[section]}</h1>
            <p className="text-[11px] text-slate-600">
              {isAdmin ? "Vista de administrador" : `Bienvenido, ${userName}`}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button aria-label="Ver notificaciones" className="relative w-9 h-9 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-all">
              <Bell size={15} />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-blue-500 rounded-full" />
            </button>
          </div>
        </header>

        {/* Canvas */}
        <main className="flex-1 overflow-y-auto bg-[#020817]">
          {section === "home"     && <DashboardHome  isAdmin={isAdmin} onNavigate={setSection} />}
          {section === "leads"    && <LeadsSection   isAdmin={isAdmin} userEmail={userEmail} />}
          {section === "team"     && <TeamSection    />}
          {section === "tools"    && <ToolsSection   isAdmin={isAdmin} />}
          {section === "settings" && <SettingsSection />}
        </main>
      </div>
    </div>
  );
}
