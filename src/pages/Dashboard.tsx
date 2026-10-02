import { useState } from "react";
import {
  LayoutDashboard, Users, UserSquare2, Wrench,
  Settings, LogOut, Menu, X, ChevronRight, Wifi, ContactRound, BarChart3,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentProfile } from "@/hooks/useCrm";
import DashboardHome from "@/sections/DashboardHome";
import LeadsSection from "@/sections/LeadsSection";
import TeamSection from "@/sections/TeamSection";
import ToolsSection from "@/sections/ToolsSection";
import SettingsSection from "@/sections/SettingsSection";
import ClientsSection from "@/sections/ClientsSection";
import NotificationsBell from "@/components/NotificationsBell";
import ReportsSection from "@/sections/ReportsSection";

export type Section = "home" | "leads" | "clients" | "team" | "reports" | "tools" | "settings";

const NAV = [
  { id: "home" as Section, icon: LayoutDashboard, label: "Dashboard" },
  { id: "leads" as Section, icon: Users, label: "Leads" },
  { id: "clients" as Section, icon: ContactRound, label: "Clientes" },
  { id: "team" as Section, icon: UserSquare2, label: "Equipo", adminOnly: true },
  { id: "reports" as Section, icon: BarChart3, label: "Reportes", adminOnly: true },
  { id: "tools" as Section, icon: Wrench, label: "Herramientas" },
  { id: "settings" as Section, icon: Settings, label: "Configuración", adminOnly: true },
];

const TITLES: Record<Section, string> = {
  home: "Dashboard", leads: "Leads", clients: "Clientes", team: "Equipo", reports: "Reportes",
  tools: "Herramientas", settings: "Configuración",
};

export default function Dashboard() {
  const [section, setSection] = useState<Section>("home");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: profile, isLoading, error } = useCurrentProfile();

  if (isLoading) return <div className="min-h-screen bg-slate-950 grid place-items-center"><div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (error || !profile) return <div className="min-h-screen bg-slate-950 grid place-items-center text-sm text-red-400">No se pudo cargar tu perfil de acceso.</div>;

  const isAdmin = profile.role === "admin";
  const initials = profile.full_name.split(" ").map(p => p[0]).join("").slice(0, 2).toUpperCase();
  const roleLabel = profile.role === "admin" ? "Administrador" : profile.role === "closer" ? "Closer" : "Setter";

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden" style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      {sidebarOpen && <div className="fixed inset-0 z-20 bg-black/60 md:hidden" onClick={() => setSidebarOpen(false)} />}

      <aside className={`fixed md:relative z-30 h-full flex flex-col w-56 bg-slate-950 border-r border-slate-800 transition-transform duration-200 ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
        <div className="flex items-center gap-2.5 px-4 h-14 border-b border-slate-800">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center"><span className="text-xs font-black text-white">E</span></div>
          <p className="text-sm font-bold text-white flex-1">Emprex CRM</p>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-slate-600"><X size={14} /></button>
        </div>

        <nav className="flex-1 px-2 pt-3 space-y-0.5 overflow-y-auto">
          {NAV.filter(n => !n.adminOnly || isAdmin).map(({ id, icon: Icon, label }) => {
            const active = section === id;
            return (
              <button key={id} onClick={() => { setSection(id); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${active ? "bg-blue-600/10 text-blue-400 font-medium" : "text-slate-500 hover:text-slate-200 hover:bg-slate-800/50"}`}>
                <Icon size={15} /><span>{label}</span>{active && <ChevronRight size={12} className="ml-auto" />}
              </button>
            );
          })}
        </nav>

        <div className="p-2 border-t border-slate-800">
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg group">
            <div className="w-7 h-7 rounded-md bg-blue-600 grid place-items-center"><span className="text-[10px] font-bold">{initials}</span></div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-300 truncate">{profile.full_name}</p>
              <p className="text-[10px] text-slate-600">{roleLabel}</p>
            </div>
            <button onClick={() => supabase.auth.signOut()} title="Cerrar sesión" className="text-slate-700 hover:text-red-400"><LogOut size={13} /></button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 border-b border-slate-800 flex items-center gap-3 px-4 md:px-5">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden text-slate-500"><Menu size={18} /></button>
          <h1 className="text-sm font-bold text-white flex-1">{TITLES[section]}</h1>
          <NotificationsBell />
          <div className="flex items-center gap-1.5 text-[10px] text-slate-600"><Wifi size={11} className="text-emerald-600" /><span>En vivo</span></div>
        </header>

        <main className="flex-1 overflow-y-auto">
          {section === "home" && <DashboardHome onNavigate={setSection} />}
          {section === "leads" && <LeadsSection />}
          {section === "clients" && <ClientsSection />}
          {section === "team" && <TeamSection />}
          {section === "reports" && <ReportsSection />}
          {section === "tools" && <ToolsSection />}
          {section === "settings" && <SettingsSection userEmail={profile.email} />}
        </main>
      </div>
    </div>
  );
}
