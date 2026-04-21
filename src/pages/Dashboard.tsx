// src/pages/Dashboard.tsx
import { useState, useEffect } from "react";
import {
  LayoutDashboard, Users, UserSquare2, Wrench,
  Settings, LogOut, Menu, X, ChevronRight, Wifi,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import DashboardHome   from "@/sections/DashboardHome";
import LeadsSection    from "@/sections/LeadsSection";
import TeamSection     from "@/sections/TeamSection";
import ToolsSection    from "@/sections/ToolsSection";
import SettingsSection from "@/sections/SettingsSection";

export const ADMIN_EMAIL = "vlogsdealdair@gmail.com";
export type Section = "home" | "leads" | "team" | "tools" | "settings";

const NAV = [
  { id: "home"     as Section, icon: LayoutDashboard, label: "Dashboard"     },
  { id: "leads"    as Section, icon: Users,            label: "Leads"         },
  { id: "team"     as Section, icon: UserSquare2,      label: "Equipo",  adminOnly: true },
  { id: "tools"    as Section, icon: Wrench,           label: "Herramientas"  },
  { id: "settings" as Section, icon: Settings,         label: "Configuración", adminOnly: true },
];

const TITLES: Record<Section, string> = {
  home: "Dashboard", leads: "Leads", team: "Equipo",
  tools: "Herramientas", settings: "Configuración",
};

export default function Dashboard() {
  const [section,     setSection]     = useState<Section>("home");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userEmail,   setUserEmail]   = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? "");
    });
  }, []);

  const isAdmin  = userEmail === ADMIN_EMAIL;
  const userName = userEmail.split("@")[0] || "Usuario";
  const initials = userName.slice(0, 2).toUpperCase();

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden"
      style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/60 md:hidden"
          onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar ── */}
      <aside className={`fixed md:relative z-30 h-full flex flex-col w-56 bg-slate-950 border-r border-slate-800 transition-transform duration-200 ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>

        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 h-14 border-b border-slate-800 flex-shrink-0">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-black text-white">E</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white leading-tight">Emprex CRM</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-slate-600">
            <X size={14} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 pt-3 space-y-0.5 overflow-y-auto">
          {NAV.filter(n => !n.adminOnly || isAdmin).map(({ id, icon: Icon, label }) => {
            const active = section === id;
            return (
              <button key={id}
                onClick={() => { setSection(id); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
                  active
                    ? "bg-blue-600/10 text-blue-400 font-medium"
                    : "text-slate-500 hover:text-slate-200 hover:bg-slate-800/50"
                }`}>
                <Icon size={15} className={active ? "text-blue-400" : "text-slate-600"} />
                <span className="truncate">{label}</span>
                {active && <ChevronRight size={12} className="ml-auto text-slate-600" />}
              </button>
            );
          })}
        </nav>

        {/* User */}
        <div className="p-2 border-t border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-slate-800/50 transition-colors group">
            <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center flex-shrink-0">
              <span className="text-[10px] font-bold text-white">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-300 truncate">{userName}</p>
              <p className="text-[10px] text-slate-600 truncate">
                {isAdmin ? "Administrador" : "Setter"}
              </p>
            </div>
            <button onClick={() => supabase.auth.signOut()}
              title="Cerrar sesión"
              className="text-slate-700 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0">
              <LogOut size={13} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Header */}
        <header className="flex-shrink-0 h-14 bg-slate-950 border-b border-slate-800 flex items-center gap-3 px-4 md:px-5">
          <button onClick={() => setSidebarOpen(true)}
            className="md:hidden text-slate-500 hover:text-slate-300">
            <Menu size={18} />
          </button>
          <div className="flex-1">
            <h1 className="text-sm font-bold text-white">{TITLES[section]}</h1>
          </div>
          {/* Indicador en vivo */}
          <div className="flex items-center gap-1.5 text-[10px] text-slate-600">
            <Wifi size={11} className="text-emerald-600" />
            <span>En vivo</span>
          </div>
        </header>

        {/* Canvas */}
        <main className="flex-1 overflow-y-auto bg-slate-950">
          {section === "home"     && <DashboardHome  isAdmin={isAdmin} userEmail={userEmail} onNavigate={setSection} />}
          {section === "leads"    && <LeadsSection   isAdmin={isAdmin} userEmail={userEmail} />}
          {section === "team"     && <TeamSection    />}
          {section === "tools"    && <ToolsSection   isAdmin={isAdmin} />}
          {section === "settings" && <SettingsSection userEmail={userEmail} />}
        </main>
      </div>
    </div>
  );
}
          {section === "settings" && <SettingsSection />}
        </main>
      </div>
    </div>
  );
}
