// src/pages/Login.tsx
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export default function Login() {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError("Credenciales incorrectas. Contacta al administrador.");
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4"
      style={{ fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>

      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center mb-4">
            <span className="text-base font-black text-white">E</span>
          </div>
          <h1 className="text-xl font-bold text-white">Emprex CRM</h1>
          <p className="text-xs text-slate-500 mt-1.5">Acceso restringido al equipo</p>
        </div>

        {/* Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-slate-200 placeholder-slate-600 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-slate-500 transition-colors"
                placeholder="tu@email.com" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Contraseña</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-slate-200 placeholder-slate-600 rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-slate-500 transition-colors"
                placeholder="••••••••••" />
            </div>

            {error && (
              <div className="bg-red-950 border border-red-900 text-red-400 text-xs rounded-lg px-3.5 py-2.5">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2">
              {loading ? <><Loader2 size={14} className="animate-spin" /> Entrando...</> : "Iniciar sesión"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-700 mt-5">
          ¿Sin acceso? Contacta al administrador.
        </p>
      </div>
    </div>
  );
}