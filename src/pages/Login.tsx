// ============================================================
// LOGIN v3 — Navy Theme
// ============================================================
// Archivo: src/pages/Login.tsx

import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Zap, Lock, Mail, ShieldCheck } from "lucide-react";

export default function Login() {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError("Credenciales incorrectas. Contacta al administrador.");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#020817] flex items-center justify-center px-4 relative overflow-hidden font-sans">

      <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-blue-900/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-800/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(30,58,138,0.15)_1px,transparent_0)] bg-[size:36px_36px] pointer-events-none" />

      <div className="relative w-full max-w-sm">
        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-700 to-blue-900 flex items-center justify-center shadow-2xl shadow-blue-900/50 mb-5 border border-blue-700/40">
            <Zap size={28} className="text-blue-200" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Emprex Flow</h1>
          <p className="text-sm text-slate-500 mt-2 flex items-center gap-1.5">
            <ShieldCheck size={13} className="text-blue-600" />
            Sistema CRM · Acceso restringido
          </p>
        </div>

        <div className="bg-[#07111e] border border-slate-800/60 rounded-3xl p-7 shadow-2xl shadow-black/50 relative overflow-hidden">
          <div className="absolute top-0 left-16 right-16 h-px bg-gradient-to-r from-transparent via-blue-700/40 to-transparent rounded-full" />

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                <Mail size={10} /> Email
              </label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                className="w-full bg-[#0c1628] border border-slate-700/60 text-slate-200 placeholder-slate-600 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-600/70 focus:bg-[#0e1c35] transition-all"
                placeholder="tu@email.com" />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                <Lock size={10} /> Contraseña
              </label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                className="w-full bg-[#0c1628] border border-slate-700/60 text-slate-200 placeholder-slate-600 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-600/70 focus:bg-[#0e1c35] transition-all"
                placeholder="••••••••••" />
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-900/20 border border-red-800/40 text-red-400 text-xs rounded-xl px-3.5 py-2.5">
                ⚠ {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2 mt-2">
              {loading
                ? <><Loader2 size={15} className="animate-spin" /> Verificando...</>
                : "Iniciar sesión"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-700 mt-5">
          ¿Sin acceso? Contacta al administrador del sistema.
        </p>
      </div>
    </div>
  );
}