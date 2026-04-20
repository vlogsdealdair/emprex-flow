// ============================================================
// Emprex Flow — LeadModal (Crear + Editar unificado)
// ============================================================
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Save, Plus, Loader2 } from "lucide-react";
import { SERVICIOS_DISPONIBLES, ORIGENES_LEAD, SETTERS_DISPONIBLES } from "@/types/cliente";
import type { Cliente, ClienteInsert } from "@/types/cliente";

const schema = z.object({
  nombre_y_apellido:   z.string().min(3, "Mínimo 3 caracteres"),
  valor_potencial:     z.number().min(0, "Mayor a 0"),
  servicio_adquirido:  z.string().optional(),
  setter_asignado:     z.string().optional(),
  usuario_de_origen:   z.string().optional(),
  fecha:               z.string().min(1, "Requerido"),
  fecha_de_la_reunion: z.string().optional(),
  notas:               z.string().max(800).optional(),
  cerro_la_venta:      z.boolean().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  isOpen:       boolean;
  lead:         Cliente | null;   // null = crear nuevo
  isSubmitting: boolean;
  onClose:      () => void;
  onSubmit:     (data: ClienteInsert) => Promise<void>;
}

const inp = (err?: boolean) =>
  `w-full bg-[#0c1628] border ${err?"border-red-700/60":"border-slate-700/50"} text-slate-200 placeholder-slate-600 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-blue-600/70 transition-all font-[inherit]`;

const sel =
  `w-full bg-[#0c1628] border border-slate-700/50 text-slate-300 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-blue-600/70 transition-all font-[inherit]`;

const Lbl = ({ children }: { children: React.ReactNode }) => (
  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">{children}</label>
);

export default function LeadModal({ isOpen, lead, isSubmitting, onClose, onSubmit }: Props) {
  const isEdit = !!lead;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: lead ? {
      nombre_y_apellido:   lead.nombre_y_apellido,
      valor_potencial:     lead.valor_potencial ?? 0,
      servicio_adquirido:  lead.servicio_adquirido || "",
      setter_asignado:     lead.setter_asignado || "",
      usuario_de_origen:   lead.usuario_de_origen || "",
      fecha:               lead.fecha ?? new Date().toISOString().split("T")[0],
      fecha_de_la_reunion: lead.fecha_de_la_reunion || "",
      notas:               lead.notas || "",
      cerro_la_venta:      lead.cerro_la_venta ?? false,
    } : {
      nombre_y_apellido: "",
      valor_potencial: 0,
      servicio_adquirido: "",
      setter_asignado: "",
      usuario_de_origen: "",
      fecha: new Date().toISOString().split("T")[0],
      fecha_de_la_reunion: "",
      notas: "",
      cerro_la_venta: false,
    },
  });

  const submit = async (v: FormValues) => {
    await onSubmit({ 
      ...v, 
      nombre: v.nombre_y_apellido, 
      email: "", 
      telefono: "", 
      empresa: "",
      valor_potencial: v.valor_potencial, 
      cerro_la_venta: v.cerro_la_venta ?? false 
    });
    if (!isEdit) reset();
  };

  const handleClose = () => { if (!isEdit) reset(); onClose(); };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={handleClose}>
      <div className="absolute inset-0 bg-black/75 backdrop-blur-md" />

      <div className="relative w-full max-w-lg bg-[#07111e] border border-slate-700/50 rounded-3xl shadow-2xl overflow-hidden animate-lead-modal"
        onClick={e => e.stopPropagation()}>

        {/* Top accent */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-600/60 to-transparent" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800/60">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-700 to-blue-900 flex items-center justify-center border border-blue-700/40 shadow-lg shadow-blue-900/40">
              {isEdit ? <Save size={16} className="text-blue-200" /> : <Plus size={18} className="text-blue-200" strokeWidth={2.5} />}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">{isEdit ? "Editar Lead" : "Nuevo Lead"}</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {isEdit ? `Modificando: ${lead?.nombre_y_apellido}` : "Registra un nuevo prospecto"}
              </p>
            </div>
          </div>
          <button type="button" onClick={handleClose} aria-label="Cerrar modal"
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-all">
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit(submit)}>
          <div className="px-6 py-5 space-y-4 max-h-[58vh] overflow-y-auto
            [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent
            [&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full">

            {/* Nombre */}
            <div>
              <Lbl>Nombre y Apellido *</Lbl>
              <input type="text" className={inp(!!errors.nombre_y_apellido)}
                placeholder="Ej. Valentina Ríos Herrera"
                {...register("nombre_y_apellido")} />
              {errors.nombre_y_apellido && <p className="text-xs text-red-400 mt-1.5">⚠ {errors.nombre_y_apellido.message}</p>}
            </div>

            {/* Servicio + Valor */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Lbl>Servicio</Lbl>
                <select className={sel} {...register("servicio_adquirido")}>
                  <option value="">Seleccionar...</option>
                  {SERVICIOS_DISPONIBLES.map(s=><option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <Lbl>Valor USD *</Lbl>
                <input type="number" step="0.01" placeholder="0.00"
                  className={inp(!!errors.valor_potencial)}
                  {...register("valor_potencial", { valueAsNumber: true })} />
                {errors.valor_potencial && <p className="text-xs text-red-400 mt-1.5">⚠ {errors.valor_potencial.message}</p>}
              </div>
            </div>

            {/* Setter + Origen */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Lbl>Setter</Lbl>
                <select className={sel} {...register("setter_asignado")}>
                  <option value="">Seleccionar...</option>
                  {SETTERS_DISPONIBLES.map(s=><option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <Lbl>Fuente</Lbl>
                <select className={sel} {...register("usuario_de_origen")}>
                  <option value="">Seleccionar...</option>
                  {ORIGENES_LEAD.map(o=><option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>

            {/* Fechas */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Lbl>Fecha de Ingreso *</Lbl>
                <input type="date" className={inp(!!errors.fecha)} {...register("fecha")} />
              </div>
              <div>
                <Lbl>Fecha de Reunión</Lbl>
                <input type="date" className={inp()} {...register("fecha_de_la_reunion")} />
              </div>
            </div>

            {/* Estado (solo en edición) */}
            {isEdit && (
              <div className="flex items-center gap-3 p-3.5 bg-slate-800/50 rounded-xl border border-slate-700/40">
                <input type="checkbox" id="cerro_la_venta"
                  className="w-4 h-4 rounded accent-blue-500"
                  {...register("cerro_la_venta")} />
                <label htmlFor="cerro_la_venta" className="text-sm text-slate-300 cursor-pointer select-none">
                  Marcar como <span className="font-semibold text-emerald-400">venta cerrada</span>
                </label>
              </div>
            )}

            {/* Notas */}
            <div>
              <Lbl>Notas</Lbl>
              <textarea rows={3}
                placeholder="Contexto del prospecto, necesidades, objeciones..."
                className={`${inp()} resize-none`}
                {...register("notas")} />
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-800/60 flex items-center justify-between gap-3">
            <p className="text-xs text-slate-600">* campos obligatorios</p>
            <div className="flex items-center gap-2">
              <button type="button" onClick={handleClose}
                className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 rounded-xl hover:bg-slate-800 transition-all">
                Cancelar
              </button>
              <button type="submit" disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-blue-900/30 min-w-[120px] justify-center">
                {isSubmitting
                  ? <><Loader2 size={14} className="animate-spin" /> Guardando...</>
                  : isEdit
                    ? <><Save size={14} /> Guardar Cambios</>
                    : <><Plus size={14} strokeWidth={2.5} /> Crear Lead</>}
              </button>
            </div>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes leadModal {
          from { opacity:0; transform:scale(0.93) translateY(14px); }
          to   { opacity:1; transform:scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}