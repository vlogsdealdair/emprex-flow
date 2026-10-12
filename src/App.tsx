import { useEffect, useState } from "react";
import { supabase } from "./integrations/supabase/client";
import type { Session, AuthChangeEvent } from "@supabase/supabase-js";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import { useQueryClient } from "@tanstack/react-query";

const getAutomaticTheme = () => "dark";

const applyStoredOrAutomaticTheme = () => {
  if (window.localStorage.getItem("emprex-appearance") !== "premium-global-v1") {
    window.localStorage.setItem("emprex-theme", "dark");
    window.localStorage.setItem("emprex-appearance", "premium-global-v1");
  }
  const stored = window.localStorage.getItem("emprex-theme");
  const theme = stored === "light" || stored === "dark" ? stored : getAutomaticTheme();
  document.documentElement.dataset.theme = theme;
};

export default function App() {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    applyStoredOrAutomaticTheme();
    const themeTimer = window.setInterval(() => {
      if (!window.localStorage.getItem("emprex-theme")) applyStoredOrAutomaticTheme();
    }, 60000);

    let currentUserId: string | null = null;
    const { data: listener } = supabase.auth.onAuthStateChange((_e: AuthChangeEvent, s: Session | null) => {
      const nextUserId = s?.user.id ?? null;
      // SIGNED_IN also fires when returning to a tab with the same session.
      // Keep cached queries and mounted forms unless the account changes.
      if (nextUserId !== currentUserId) queryClient.clear();
      currentUserId = nextUserId;
      setSession(s);
      setLoading(false);
    });

    return () => {
      listener.subscription.unsubscribe();
      window.clearInterval(themeTimer);
    };
  }, [queryClient]);

  if (loading) return (
    <div className="min-h-screen crm-shell flex items-center justify-center">
      <div className="flex flex-col items-center gap-5">
        <div className="emprex-brand w-40 h-14 rounded-2xl bg-[#15181e] border border-white/10 px-5 py-3 shadow-2xl">
          <img src="/emprex-logo-white.png" alt="EMPREX" className="w-full h-full object-contain" />
        </div>
        <div className="w-5 h-5 border-2 border-[#60a5fa] border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );

  return session ? <Dashboard key={session.user.id} /> : <Login />;
}

