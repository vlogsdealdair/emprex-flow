import { useEffect, useState } from "react";
import { supabase } from "./integrations/supabase/client";
import type { Session, AuthChangeEvent } from "@supabase/supabase-js";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const applyTheme = () => { const hour = new Date().getHours(); document.documentElement.dataset.theme = hour >= 7 && hour < 19 ? "light" : "dark"; };
    applyTheme();
    const themeTimer = window.setInterval(applyTheme, 60000);
    supabase.auth.getSession().then(({ data }: { data: { session: Session | null } }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_e: AuthChangeEvent, s: Session | null) => {
      setSession(s);
    });
    return () => { listener.subscription.unsubscribe(); window.clearInterval(themeTimer); };
  }, []);

  if (loading) return (
    <div className="min-h-screen crm-shell flex items-center justify-center">
      <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return session ? <Dashboard /> : <Login />;
}
