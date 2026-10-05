import { useMemo, useState } from "react";
import { BarChart3, ChevronDown, CircleDollarSign, ContactRound, LayoutDashboard, LogOut, Menu, Moon, Search, Settings, Sun, UserSquare2, Users, Wrench, X } from "lucide-react";
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
import FinanceSection from "@/sections/FinanceSection";

export type Section = "home" | "leads" | "clients" | "team" | "reports" | "finance" | "tools" | "settings";

export default function Dashboard() {
  const [section, setSection] = useState<Section>("home");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<"light"|"dark">(() => document.documentElement.dataset.theme === "dark" ? "dark" : "light");
  const { data: profile, isLoading, error } = useCurrentProfile();

  const nav = useMemo(() => {
    if (!profile) return [];
    if (profile.role === "admin") return [
      {id:"home" as Section,icon:LayoutDashboard,label:"Dashboard"},
      {id:"leads" as Section,icon:Users,label:"Leads"},
      {id:"clients" as Section,icon:ContactRound,label:"Clientes"},
      {id:"team" as Section,icon:UserSquare2,label:"Equipo"},
      {id:"reports" as Section,icon:BarChart3,label:"Reportes"},
      {id:"finance" as Section,icon:CircleDollarSign,label:"Finanzas"},
      {id:"tools" as Section,icon:Wrench,label:"Herramientas"},
      {id:"settings" as Section,icon:Settings,label:"Configuración"}
    ];
    if (profile.role === "setter") return [
      {id:"home" as Section,icon:LayoutDashboard,label:"Mi rendimiento"},
      {id:"leads" as Section,icon:Users,label:"Mis leads"},
      {id:"finance" as Section,icon:CircleDollarSign,label:"Mis comisiones"},
      {id:"tools" as Section,icon:Wrench,label:"Herramientas"},
      {id:"settings" as Section,icon:Settings,label:"Mi perfil"}
    ];
    return [
      {id:"home" as Section,icon:LayoutDashboard,label:"Mi rendimiento"},
      {id:"leads" as Section,icon:Users,label:"Oportunidades"},
      {id:"clients" as Section,icon:ContactRound,label:"Clientes"},
      {id:"finance" as Section,icon:CircleDollarSign,label:"Comisiones"},
      {id:"tools" as Section,icon:Wrench,label:"Herramientas"},
      {id:"settings" as Section,icon:Settings,label:"Mi perfil"}
    ];
  },[profile]);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    window.localStorage.setItem("emprex-theme", next);
  };

  if (isLoading) return <div className="min-h-screen crm-shell grid place-items-center"><div className="w-5 h-5 border-2 border-[#2f80ed] border-t-transparent rounded-full animate-spin"/></div>;
  if (error || !profile) return <div className="min-h-screen crm-shell grid place-items-center text-sm text-red-400">No se pudo cargar tu perfil de acceso.</div>;

  const roleLabel=profile.role==="admin"?"Administrador":profile.role==="closer"?"Closer":"Setter";
  const initials=profile.full_name.split(" ").map(p=>p[0]).join("").slice(0,2).toUpperCase();

  return <div className="crm-shell flex h-screen overflow-hidden">
    {sidebarOpen && <div className="fixed inset-0 z-20 bg-[#061426]/70 md:hidden" onClick={()=>setSidebarOpen(false)}/>}
    <aside className={"crm-sidebar fixed md:relative z-30 h-full flex flex-col w-[272px] border-r transition-transform duration-200 "+(sidebarOpen?"translate-x-0":"-translate-x-full md:translate-x-0")}>
      <div className="h-[96px] px-5 flex items-center border-b border-white/[.07]">
        <div className="w-full max-w-[228px] h-[64px] flex items-center overflow-visible"><img src="/emprex-logo.svg" alt="EMPREX" className="block w-full h-full object-contain object-left"/></div>
        <button onClick={()=>setSidebarOpen(false)} className="md:hidden ml-auto text-white/60"><X size={17}/></button>
      </div>

      <div className="px-4 pt-6 pb-3">
        <p className="px-3 text-[10px] uppercase tracking-[.18em] text-white/35 font-semibold">Workspace</p>
      </div>
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {nav.map(({id,icon:Icon,label})=>{
          const active=section===id;
          return <button key={label} onClick={()=>{setSection(id);setSidebarOpen(false)}} className={"crm-nav-item w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13px] "+(active?"crm-nav-active font-semibold":"")}>
            <Icon size={16} strokeWidth={1.8}/><span>{label}</span>
          </button>
        })}
      </nav>

      <div className="mx-4 mb-4 rounded-2xl border border-white/[.08] bg-white/[.035] p-4">
        <p className="text-[11px] text-white/45 uppercase tracking-[.16em]">EMPREX</p>
        <p className="mt-2 text-sm font-semibold text-white">Conecta. Convierte. Crece.</p>
        <p className="mt-1 text-[11px] leading-5 text-white/45">Tu operación comercial en un solo sistema.</p>
      </div>

      <div className="p-4 border-t border-white/[.07]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0c2340] border border-white/10 grid place-items-center overflow-hidden text-white">
            {profile.avatar_url?<img src={profile.avatar_url} alt="" className="w-full h-full object-cover"/>:<span className="text-[11px] font-bold">{initials}</span>}
          </div>
          <div className="flex-1 min-w-0"><p className="text-xs font-semibold text-white truncate">{profile.full_name}</p><p className="text-[10px] text-white/45 mt-0.5">{roleLabel}</p></div>
          <button onClick={()=>supabase.auth.signOut()} className="text-white/45 hover:text-white transition-colors" aria-label="Cerrar sesión"><LogOut size={15}/></button>
        </div>
      </div>
    </aside>

    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      <header className="crm-header h-[72px] border-b flex items-center gap-4 px-4 md:px-7">
        <button onClick={()=>setSidebarOpen(true)} className="md:hidden crm-muted"><Menu size={20}/></button>
        <div className="hidden sm:flex items-center gap-2 crm-input rounded-xl px-3 h-10 w-full max-w-md">
          <Search size={15} className="crm-muted"/>
          <input className="bg-transparent outline-none border-0 text-sm crm-text flex-1 min-w-0" placeholder="Buscar leads, clientes, oportunidades…"/>
          <span className="text-[10px] crm-muted border crm-border rounded-md px-1.5 py-0.5">⌘ K</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={toggleTheme} className="w-10 h-10 rounded-xl border crm-border grid place-items-center crm-muted hover:crm-text" title="Cambiar tema">
            {theme==="dark"?<Moon size={16}/>:<Sun size={16}/>}
          </button>
          <NotificationsBell/>
          <div className="hidden sm:flex items-center gap-2.5 pl-2">
            <div className="w-9 h-9 rounded-xl bg-[var(--crm-accent-soft)] border crm-border grid place-items-center overflow-hidden crm-accent">
              {profile.avatar_url?<img src={profile.avatar_url} alt="" className="w-full h-full object-cover"/>:<span className="text-[10px] font-bold">{initials}</span>}
            </div>
            <div className="min-w-0"><p className="text-xs font-semibold crm-text truncate max-w-[150px]">{profile.full_name}</p><p className="text-[10px] crm-muted">{roleLabel}</p></div>
            <ChevronDown size={14} className="crm-muted"/>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        {section==="home"&&<DashboardHome onNavigate={setSection}/>}
        {section==="leads"&&<LeadsSection/>}
        {section==="clients"&&<ClientsSection/>}
        {section==="team"&&profile.role==="admin"&&<TeamSection/>}
        {section==="reports"&&profile.role==="admin"&&<ReportsSection/>}
        {section==="finance"&&<FinanceSection/>}
        {section==="tools"&&<ToolsSection/>}
        {section==="settings"&&<SettingsSection userEmail={profile.email}/>}
      </main>
    </div>
  </div>;
}
