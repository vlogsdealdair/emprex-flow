import { useEffect, useState } from "react";
import { supabase } from "./integrations/supabase/client";
import type { Session, AuthChangeEvent } from "@supabase/supabase-js";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";

const getAutomaticTheme = () => {
  const hour = new Date().getHours();
  return hour >= 7 && hour < 19 ? "light" : "dark";
};

const applyStoredOrAutomaticTheme = () => {
  const stored = window.localStorage.getItem("emprex-theme");
  const theme = stored === "light" || stored === "dark" ? stored : getAutomaticTheme();
  document.documentElement.dataset.theme = theme;
};

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    applyStoredOrAutomaticTheme();
    const themeTimer = window.setInterval(() => {
      if (!window.localStorage.getItem("emprex-theme")) applyStoredOrAutomaticTheme();
    }, 60000);

    supabase.auth.getSession().then(({ data }: { data: { session: Session | null } }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_e: AuthChangeEvent, s: Session | null) => {
      setSession(s);
    });

    return () => {
      listener.subscription.unsubscribe();
      window.clearInterval(themeTimer);
    };
  }, []);

  if (loading) return (
    <div className="min-h-screen crm-shell flex items-center justify-center">
      <div className="flex flex-col items-center gap-5">
        <div className="w-40 h-14 rounded-2xl bg-[#061426] border border-white/10 px-5 py-3 shadow-2xl">
          <img src="/emprex-logo.svg" alt="EMPREX" className="w-full h-full object-contain" />
        </div>
        <div className="w-5 h-5 border-2 border-[#2f80ed] border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );

  return session ? <Dashboard /> : <Login />;
}
