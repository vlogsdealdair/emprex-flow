import { useEffect, useState } from "react";
import { Camera, Plus, Save, UserPlus, Image as ImageIcon } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useAppSettings,
  useCreateService,
  useCurrentProfile,
  useServices,
  useTeam,
  useUpdateMyProfile,
  useUpdateProfile,
  useUpdateService,
  useUploadAvatar,
  useUploadLogo,
} from "@/hooks/useCrm";
import { createCrmUser } from "@/services/adminService";
import { formatCurrency } from "@/utils/formatters";

export default function SettingsSection({ userEmail }: { userEmail: string }) {
  const qc = useQueryClient();
  const { data: profile } = useCurrentProfile();
  const { data: appSettings } = useAppSettings();
  const { data: services = [] } = useServices();
  const { data: team = [] } = useTeam(profile?.role === "admin");
  const createService = useCreateService();
  const updateService = useUpdateService();
  const updateProfile = useUpdateProfile();
  const updateMyProfile = useUpdateMyProfile();
  const uploadAvatar = useUploadAvatar();
  const uploadLogo = useUploadLogo();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [profileMessage, setProfileMessage] = useState("");

  const [serviceName, setServiceName] = useState("");
  const [servicePrice, setServicePrice] = useState("");

  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState<"admin" | "setter" | "closer">("setter");
  const [newUserMessage, setNewUserMessage] = useState("");
  const [creatingUser, setCreatingUser] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name);
    setPhone(profile.phone ?? "");
    setJobTitle(profile.job_title ?? "");
  }, [profile]);

  const isAdmin = profile?.role === "admin";

  const saveProfile = async () => {
    if (!fullName.trim()) return;
    setProfileMessage("");
    await updateMyProfile.mutateAsync({
      full_name: fullName,
      phone: phone || null,
      job_title: jobTitle || null,
    });
    setProfileMessage("Perfil actualizado.");
  };

  const addService = async () => {
    const name = serviceName.trim();
    if (!name) return;
    await createService.mutateAsync({
      name,
      defaultPriceUsd: servicePrice ? Number(servicePrice) : null,
    });
    setServiceName("");
    setServicePrice("");
  };

  const createUser = async () => {
    setNewUserMessage("");
    if (!newUserName.trim() || !newUserEmail.trim() || newUserPassword.length < 8) {
      setNewUserMessage("Completa nombre, email y una contraseña de al menos 8 caracteres.");
      return;
    }
    setCreatingUser(true);
    try {
      await createCrmUser({
        fullName: newUserName,
        email: newUserEmail,
        password: newUserPassword,
        role: newUserRole,
      });
      setNewUserName("");
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserRole("setter");
      setNewUserMessage("Usuario creado correctamente.");
      await qc.invalidateQueries({ queryKey: ["crm", "team"] });
    } catch (error) {
      setNewUserMessage(error instanceof Error ? error.message : "No se pudo crear el usuario.");
    } finally {
      setCreatingUser(false);
    }
  };

  return (
    <div className="p-5 md:p-6 max-w-4xl mx-auto space-y-5">
      <div>
        <h2 className="text-sm font-bold text-white">Configuración</h2>
        <p className="text-xs text-slate-600 mt-0.5">Perfil personal y administración de EMPREX CRM.</p>
      </div>

      <section className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4">Mi perfil</h3>
        <div className="flex flex-col md:flex-row gap-5">
          <div className="flex flex-col items-center gap-2">
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-blue-600 grid place-items-center border border-slate-700">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Foto de perfil" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl font-black text-white">{(profile?.full_name || userEmail).slice(0,2).toUpperCase()}</span>
              )}
            </div>
            <label className="cursor-pointer px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-300 flex items-center gap-1.5">
              <Camera size={13} /> Cambiar foto
              <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
                onChange={e => { const file = e.target.files?.[0]; if (file) void uploadAvatar.mutateAsync(file); }} />
            </label>
          </div>

          <div className="grid md:grid-cols-2 gap-3 flex-1">
            <Field label="Nombre completo"><input value={fullName} onChange={e => setFullName(e.target.value)} className={inputClass} /></Field>
            <Field label="Cargo"><input value={jobTitle} onChange={e => setJobTitle(e.target.value)} placeholder="Ej. Setter, Closer, CEO" className={inputClass} /></Field>
            <Field label="Teléfono"><input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+593..." className={inputClass} /></Field>
            <Field label="Email"><input value={userEmail} disabled className={`${inputClass} opacity-60`} /></Field>
            <div className="md:col-span-2 flex items-center gap-3">
              <button onClick={() => void saveProfile()} disabled={updateMyProfile.isPending}
                className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg flex items-center gap-1.5">
                <Save size={13}/> Guardar perfil
              </button>
              {profileMessage && <span className="text-xs text-emerald-400">{profileMessage}</span>}
            </div>
          </div>
        </div>
      </section>

      {isAdmin && (
        <>
          <section className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4">Marca</h3>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-slate-950 border border-slate-800 grid place-items-center overflow-hidden">
                {appSettings?.logo_url ? <img src={appSettings.logo_url} alt="Logo EMPREX CRM" className="w-full h-full object-contain p-2" /> : <ImageIcon size={22} className="text-slate-600" />}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-200">EMPREX CRM</p>
                <p className="text-xs text-slate-600 mt-1">Sube el logo oficial. Se mostrará en login y menú lateral.</p>
                <label className="inline-flex mt-3 cursor-pointer px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-300">
                  Subir logo
                  <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden"
                    onChange={e => { const file = e.target.files?.[0]; if (file) void uploadLogo.mutateAsync(file); }} />
                </label>
              </div>
            </div>
          </section>

          <section className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="mb-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Crear usuario</h3>
              <p className="text-xs text-slate-600 mt-1">Crea acceso directo con email, contraseña y rol.</p>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <Field label="Nombre"><input value={newUserName} onChange={e => setNewUserName(e.target.value)} className={inputClass} /></Field>
              <Field label="Email"><input type="email" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} className={inputClass} /></Field>
              <Field label="Contraseña"><input type="password" value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} className={inputClass} placeholder="Mínimo 8 caracteres" /></Field>
              <Field label="Rol">
                <select value={newUserRole} onChange={e => setNewUserRole(e.target.value as "admin" | "setter" | "closer")} className={inputClass}>
                  <option value="setter">Setter</option>
                  <option value="closer">Closer</option>
                  <option value="admin">Admin</option>
                </select>
              </Field>
              <div className="md:col-span-2 flex items-center gap-3">
                <button onClick={() => void createUser()} disabled={creatingUser}
                  className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg flex items-center gap-1.5">
                  <UserPlus size={13}/> {creatingUser ? "Creando..." : "Crear usuario"}
                </button>
                {newUserMessage && <span className="text-xs text-slate-400">{newUserMessage}</span>}
              </div>
            </div>
          </section>

          <section className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="mb-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Equipo y roles</h3>
              <p className="text-xs text-slate-600 mt-1">Cambia rol o activa/desactiva usuarios del CRM.</p>
            </div>
            <div className="space-y-2">
              {team.map(member => (
                <div key={member.id} className="flex flex-wrap items-center gap-3 p-3 bg-slate-950 border border-slate-800 rounded-lg">
                  <div className="w-9 h-9 rounded-lg overflow-hidden bg-slate-800 grid place-items-center">
                    {member.avatar_url ? <img src={member.avatar_url} alt="" className="w-full h-full object-cover" /> : <span className="text-[10px] font-bold">{member.full_name.slice(0,2).toUpperCase()}</span>}
                  </div>
                  <div className="flex-1 min-w-48">
                    <p className="text-sm font-semibold text-slate-200">{member.full_name}</p>
                    <p className="text-[11px] text-slate-600">{member.email}</p>
                  </div>
                  <select value={member.role}
                    onChange={e => void updateProfile.mutateAsync({ id: member.id, patch: { role: e.target.value as "admin" | "setter" | "closer" } })}
                    disabled={member.id === profile?.id}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 disabled:opacity-50">
                    <option value="admin">Admin</option><option value="setter">Setter</option><option value="closer">Closer</option>
                  </select>
                  <button onClick={() => void updateProfile.mutateAsync({ id: member.id, patch: { is_active: !member.is_active } })}
                    disabled={member.id === profile?.id}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold border disabled:opacity-50 ${member.is_active ? "text-emerald-400 bg-emerald-950 border-emerald-900" : "text-slate-500 bg-slate-800 border-slate-700"}`}>
                    {member.is_active ? "Activo" : "Inactivo"}
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="mb-4"><h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Servicios</h3></div>
            <div className="grid grid-cols-[1fr_140px_auto] gap-2 mb-4">
              <input value={serviceName} onChange={e => setServiceName(e.target.value)} placeholder="Nuevo servicio" className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none" />
              <input type="number" min="0" step="0.01" value={servicePrice} onChange={e => setServicePrice(e.target.value)} placeholder="Precio USD" className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none" />
              <button onClick={() => void addService()} disabled={createService.isPending} className="px-3 rounded-lg bg-blue-600 text-white grid place-items-center"><Plus size={14} /></button>
            </div>
            <div className="space-y-2">
              {services.map(service => (
                <div key={service.id} className="flex items-center gap-3 p-3 bg-slate-950 border border-slate-800 rounded-lg">
                  <div className="flex-1"><p className="text-sm font-medium text-slate-200">{service.name}</p><p className="text-[11px] text-slate-600">{service.default_price_usd == null ? "Sin precio por defecto" : formatCurrency(Number(service.default_price_usd))}</p></div>
                  <button onClick={() => void updateService.mutateAsync({ id: service.id, patch: { is_active: !service.is_active } })}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border ${service.is_active ? "text-emerald-400 bg-emerald-950 border-emerald-900" : "text-slate-500 bg-slate-800 border-slate-700"}`}>
                    {service.is_active ? "Activo" : "Inactivo"}
                  </button>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

const inputClass = "w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-600";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">{label}</label>{children}</div>;
}
