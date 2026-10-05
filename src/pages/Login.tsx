import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

const LOGIN_ALIASES: Record<string, string> = {
  leandroaldair: "vlogsdealdair@gmail.com",
  setterprueba: "contacto.emprex@gmail.com",
};

export default function Login() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const normalized = identifier.trim().toLowerCase();
    const email = LOGIN_ALIASES[normalized] ?? normalized;
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });

    if (loginError) setError("Credenciales incorrectas. Verifica tu usuario, correo o contraseña.");
    setLoading(false);
  };

  return (
    <div className="min-h-screen crm-shell flex items-center justify-center px-4"
      style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-[230px] h-[82px] rounded-2xl bg-[#061426] border border-white/10 flex items-center justify-center mb-5 px-4 py-3 shadow-xl">
            <img src="/emprex-logo.svg" alt="EMPREX" className="block w-full h-full object-contain" />
          </div>
          <h1 className="text-xl font-bold crm-text">EMPREX CRM</h1>
          <p className="text-xs crm-muted mt-1.5">Acceso restringido al equipo</p>
        </div>

        <div className="crm-card rounded-2xl p-6 shadow-xl">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold crm-muted uppercase tracking-wider mb-1.5">Usuario o correo</label>
              <input required value={identifier} onChange={e => setIdentifier(e.target.value)}
                className="w-full border crm-border bg-transparent crm-text placeholder-slate-400 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-[var(--crm-accent)]"
                placeholder="usuario o correo" autoComplete="username" />
            </div>
            <div>
              <label className="block text-[11px] font-bold crm-muted uppercase tracking-wider mb-1.5">Contraseña</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                className="w-full border crm-border bg-transparent crm-text placeholder-slate-400 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-[var(--crm-accent)]"
                placeholder="••••••••••" autoComplete="current-password" />
            </div>

            {error && <div className="bg-red-950 border border-red-900 text-red-400 text-xs rounded-lg px-3.5 py-2.5">{error}</div>}

            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-[var(--crm-accent)] hover:opacity-90 disabled:opacity-60 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg">
              {loading ? <><Loader2 size={14} className="animate-spin" /> Entrando...</> : "Iniciar sesión"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
