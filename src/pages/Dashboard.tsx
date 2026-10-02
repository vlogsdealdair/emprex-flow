import { useEffect, useMemo, useState } from "react";
import { BarChart3, ChevronRight, CircleDollarSign, ContactRound, LayoutDashboard, LogOut, Menu, Moon, Settings, Sun, UserSquare2, Users, Wifi, Wrench, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAppSettings, useCurrentProfile } from "@/hooks/useCrm";
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
  const [theme, setTheme] = useState<"light"|"dark">("light");
  const { data: profile, isLoading, error } = useCurrentProfile();
  const { data: appSettings } = useAppSettings();

  useEffect(() => {
    const apply = () => { const hour=new Date().getHours(); const next=hour>=7&&hour<19?"light":"dark"; setTheme(next); document.documentElement.dataset.theme=next; };
    apply(); const id=window.setInterval(apply,60000); return()=>window.clearInterval(id);
  },[]);

  const nav = useMemo(() => {
    if (!profile) return [];
    if (profile.role === "admin") return [
      {id:"home" as Section,icon:LayoutDashboard,label:"Dashboard"}, {id:"leads" as Section,icon:Users,label:"Leads"}, {id:"clients" as Section,icon:ContactRound,label:"Clientes"}, {id:"team" as Section,icon:UserSquare2,label:"Equipo"}, {id:"reports" as Section,icon:BarChart3,label:"Reportes"}, {id:"finance" as Section,icon:CircleDollarSign,label:"Finanzas"}, {id:"tools" as Section,icon:Wrench,label:"Herramientas"}, {id:"settings" as Section,icon:Settings,label:"Configuración"}
    ];
    if (profile.role === "setter") return [
      {id:"home" as Section,icon:LayoutDashboard,label:"Mi rendimiento"}, {id:"leads" as Section,icon:Users,label:"Mis leads"}, {id:"finance" as Section,icon:CircleDollarSign,label:"Mis comisiones"}, {id:"tools" as Section,icon:Wrench,label:"Herramientas"}, {id:"settings" as Section,icon:Settings,label:"Mi perfil"}
    ];
    return [
      {id:"home" as Section,icon:LayoutDashboard,label:"Mi rendimiento"}, {id:"leads" as Section,icon:Users,label:"Oportunidades"}, {id:"clients" as Section,icon:ContactRound,label:"Clientes"}, {id:"finance" as Section,icon:CircleDollarSign,label:"Comisiones"}, {id:"tools" as Section,icon:Wrench,label:"Herramientas"}, {id:"settings" as Section,icon:Settings,label:"Mi perfil"}
    ];
  },[profile]);

  if (isLoading) return <div className="min-h-screen crm-shell grid place-items-center"><div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"/></div>;
  if (error || !profile) return <div className="min-h-screen crm-shell grid place-items-center text-sm text-red-400">No se pudo cargar tu perfil de acceso.</div>;

  const currentTitle = nav.find(n=>n.id===section)?.label || "EMPREX CRM";
  const initials=profile.full_name.split(" ").map(p=>p[0]).join("").slice(0,2).toUpperCase();
  const roleLabel=profile.role==="admin"?"Administrador":profile.role==="closer"?"Closer":"Setter";

  return <div className="crm-shell flex h-screen overflow-hidden" style={{fontFamily:"Inter, Plus Jakarta Sans, system-ui, sans-serif"}}>
    {sidebarOpen && <div className="fixed inset-0 z-20 bg-black/45 md:hidden" onClick={()=>setSidebarOpen(false)}/>} 
    <aside className={"crm-sidebar fixed md:relative z-30 h-full flex flex-col w-64 border-r transition-transform duration-200 "+(sidebarOpen?"translate-x-0":"-translate-x-full md:translate-x-0")}>
      <div className="flex items-center gap-3 px-4 h-16 border-b crm-border"><div className="w-9 h-9 rounded-xl bg-[var(--crm-accent)] grid place-items-center overflow-hidden shadow-lg">{appSettings?.logo_url?<img src={appSettings.logo_url} alt="EMPREX CRM" className="w-full h-full object-contain bg-white"/>:<span className="font-black text-white">E</span>}</div><div className="flex-1"><p className="text-sm font-black crm-text tracking-tight">EMPREX CRM</p><p className="text-[10px] crm-muted">{roleLabel}</p></div><button onClick={()=>setSidebarOpen(false)} className="md:hidden crm-muted"><X size={15}/></button></div>
      <nav className="flex-1 px-3 pt-5 space-y-1.5 overflow-y-auto">{nav.map(({id,icon:Icon,label})=>{const active=section===id;return <button key={id} onClick={()=>{setSection(id);setSidebarOpen(false)}} className={"crm-nav-item w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm "+(active?"crm-nav-active font-semibold":"")}><Icon size={16}/><span>{label}</span>{active&&<ChevronRight size={13} className="ml-auto"/>}</button>})}</nav>
      <div className="p-3 border-t crm-border"><div className="flex items-center gap-3 px-2 py-2"><div className="w-9 h-9 rounded-xl bg-[var(--crm-accent)] grid place-items-center overflow-hidden text-white">{profile.avatar_url?<img src={profile.avatar_url} alt="" className="w-full h-full object-cover"/>:<span className="text-[10px] font-bold">{initials}</span>}</div><div className="flex-1 min-w-0"><p className="text-xs font-semibold crm-text truncate">{profile.full_name}</p><p className="text-[10px] crm-muted">{roleLabel}</p></div><button onClick={()=>supabase.auth.signOut()} className="crm-muted hover:text-red-400"><LogOut size={14}/></button></div></div>
    </aside>
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      <header className="crm-header h-16 border-b flex items-center gap-3 px-4 md:px-6"><button onClick={()=>setSidebarOpen(true)} className="md:hidden crm-muted"><Menu size={19}/></button><div className="flex-1"><p className="text-[10px] uppercase tracking-[.18em] crm-muted">EMPREX CRM</p><h1 className="text-sm font-bold crm-text">{currentTitle}</h1></div><div className="hidden sm:flex items-center gap-1.5 text-[10px] crm-muted px-2.5 py-1.5 rounded-full border crm-border">{theme==="light"?<Sun size={12}/>:<Moon size={12}/>}<span>{theme==="light"?"Modo día":"Modo noche"}</span></div><NotificationsBell/><div className="flex items-center gap-1.5 text-[10px] crm-muted"><Wifi size={11} className="text-emerald-500"/><span>En vivo</span></div></header>
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