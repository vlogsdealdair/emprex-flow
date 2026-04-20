// ============================================================
// Emprex Flow CRM — NewLeadForm v2
// Modal glassmorphism + React Hook Form + Zod
// ============================================================

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Plus, Loader2, DollarSign, User, Briefcase, Calendar, MessageSquare, MapPin, UserCheck, Phone } from "lucide-react";
import { SERVICIOS_DISPONIBLES, ORIGENES_LEAD, SETTERS_DISPONIBLES, type ClienteInsert } from "@/types/cliente";

// ── Zod Schema ────────────────────────────────────────────
const schema = z.object({
  nombre:             z.string().min(1, "Requerido"),
  email:              z.string().email("Email inválido"),
  telefono:           z.string().min(1, "Requerido"),
  empresa:            z.string().min(1, "Requerido"),
  nombre_y_apellido:  z.string().min(3, "Mínimo 3 caracteres").max(100),
  valor_potencial:    z.number().positive("Mayor a 0").max(999999),
  servicio_adquirido: z.string().optional(),
  setter_asignado:    z.string().optional(),
  usuario_de_origen:  z.string().optional(),
  fecha:              z.string().min(1, "Requerido"),
  fecha_de_la_reunion:z.string().optional(),
  notas:              z.string().max(500).optional(),
});

type FormValues = z.infer<typeof schema>;

// ── Input wrapper ─────────────────────────────────────────
const Field: React.FC<{
  label: string;
  required?: boolean;
  error?: string;
  icon: React.ElementType;
  children: React.ReactNode;
}> = ({ label, required, error, icon: Icon, children }) => (
  <div>
    <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wider">
      <Icon size={11} className="text-zinc-600" />
      {label}
      {required && <span className="text-red-400 normal-case font-normal tracking-normal ml-0.5">*</span>}
    </label>
    {children}
    {error && <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1">⚠ {error}</p>}
  </div>
);

const inputClass = (hasError?: boolean) =>
  `w-full bg-zinc-800/80 border ${hasError ? "border-red-500/50" : "border-zinc-700/60"}
   text-zinc-200 placeholder-zinc-600 rounded-xl px-3.5 py-2.5 text-sm outline-none
   focus:border-indigo-500/70 focus:bg-zinc-800 transition-all duration-200 font-[inherit]`;

const selectClass =
  `w-full bg-zinc-800/80 border border-zinc-700/60 text-zinc-300 rounded-xl px-3.5 py-2.5
   text-sm outline-none focus:border-indigo-500/70 transition-all duration-200 font-[inherit]`;

// ── Component ─────────────────────────────────────────────
interface NewLeadFormProps {
  isOpen:      boolean;
  isSubmitting: boolean;
  onClose:     () => void;
  onSubmit:    (data: ClienteInsert) => Promise<void>;
}

export const NewLeadForm: React.FC<NewLeadFormProps> = ({
  isOpen, isSubmitting, onClose, onSubmit,
}) => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nombre: "",
      email: "",
      telefono: "",
      empresa: "",
      nombre_y_apellido: "",
      valor_potencial: 0,
      servicio_adquirido: "",
      setter_asignado: "",
      usuario_de_origen: "",
      fecha: new Date().toISOString().split("T")[0],
      fecha_de_la_reunion: "",
      notas: "",
    },
  });

  const handleFormSubmit = async (values: FormValues) => {
    await onSubmit({
      ...values,
      cerro_la_venta: false,
      valor_potencial: values.valor_potencial,
    });
    reset();
  };

  const handleClose = () => { reset(); onClose(); };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/50 rounded-3xl shadow-2xl shadow-black/60 overflow-hidden animate-modal-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Gradient top accent */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600/80 to-violet-600/80 flex items-center justify-center border border-indigo-500/30 shadow-lg shadow-indigo-500/20">
              <Plus size={18} className="text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100 tracking-tight">Nuevo Lead</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Registra un nuevo prospecto en el pipeline</p>
            </div>
          </div>
          <button aria-label="Cerrar modal de nuevo lead"
            type="button"
            onClick={handleClose}
            className="w-8 h-8 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-zinc-200 transition-all"
          >
            <X size={15} />
          </button>
        </div>

        {/* Divider */}
        <div className="h-px bg-zinc-800 mx-6" />

        {/* Form */}
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <div className="px-6 py-5 space-y-4 max-h-[55vh] overflow-y-auto
            [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent
            [&::-webkit-scrollbar-thumb]:bg-zinc-700 [&::-webkit-scrollbar-thumb]:rounded-full">

            {/* Nombre */}  
            <Field label="Nombre y Apellido" required icon={User} error={errors.nombre_y_apellido?.message}>
              <input type="text"
                className={inputClass(!!errors.nombre_y_apellido)}
                placeholder="Ej. Valentina Ríos Herrera"
                {...register("nombre_y_apellido")} />
            </Field>

            {/* Contacto */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Email" required icon={MessageSquare} error={errors.email?.message}>
                <input type="email"
                  className={inputClass(!!errors.email)}
                  placeholder="valentina@email.com"
                  {...register("email")} />
              </Field>
              <Field label="Teléfono" required icon={Phone} error={errors.telefono?.message}>
                <input type="tel"
                  className={inputClass(!!errors.telefono)}
                  placeholder="+56 9 1234 5678"
                  {...register("telefono")} />
              </Field>
            </div>

            {/* Empresa */}
            <Field label="Empresa" required icon={Briefcase} error={errors.empresa?.message}>
              <input type="text"
                className={inputClass(!!errors.empresa)}
                placeholder="Empresa SpA"
                {...register("empresa")} />
            </Field>

            {/* Servicio + Valor */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Servicio" icon={Briefcase}>
                <select className={selectClass} {...register("servicio_adquirido")}>
                  <option value="">Seleccionar...</option>
                  {SERVICIOS_DISPONIBLES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Valor USD" required icon={DollarSign} error={errors.valor_potencial?.message}>
                <input type="number" step="0.01" placeholder="0.00"
                  className={inputClass(!!errors.valor_potencial)}
                  {...register("valor_potencial", { valueAsNumber: true })} />
              </Field>
            </div>

            {/* Setter + Origen */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Setter" icon={UserCheck}>
                <select className={selectClass} {...register("setter_asignado")}>
                  <option value="">Seleccionar...</option>
                  {SETTERS_DISPONIBLES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Fuente" icon={MapPin}>
                <select className={selectClass} {...register("usuario_de_origen")}>
                  <option value="">Seleccionar...</option>
                  {ORIGENES_LEAD.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </Field>
            </div>

            {/* Fechas */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Ingreso" required icon={Calendar} error={errors.fecha?.message}>
                <input type="date" className={inputClass(!!errors.fecha)} {...register("fecha")} />
              </Field>
              <Field label="Reunión" icon={Calendar}>
                <input type="date" className={inputClass()} {...register("fecha_de_la_reunion")} />
              </Field>
            </div>

            {/* Notas */}
            <Field label="Notas" icon={MessageSquare} error={errors.notas?.message}>
              <textarea rows={3} placeholder="Contexto del prospecto, necesidades clave..."
                className={`${inputClass(!!errors.notas)} resize-none`}
                {...register("notas")} />
            </Field>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-zinc-800/60 flex items-center justify-between gap-3">
            <p className="text-xs text-zinc-600">
              Los campos <span className="text-red-400">*</span> son obligatorios
            </p>
            <div className="flex items-center gap-2">
              <button type="button" onClick={handleClose}
                className="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 rounded-xl hover:bg-zinc-800 transition-all">
                Cancelar
              </button>
              <button type="submit" disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/20 min-w-[120px] justify-center">
                {isSubmitting
                  ? <><Loader2 size={14} className="animate-spin" /> Guardando...</>
                  : <><Plus size={14} strokeWidth={2.5} /> Crear Lead</>}
              </button>
            </div>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.92) translateY(12px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }
      `}</style>
    </div>
  );
};