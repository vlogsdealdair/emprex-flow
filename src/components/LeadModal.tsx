// src/components/LeadModal.tsx
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Save, Plus, Loader2 } from "lucide-react";
import { SERVICIOS_DISPONIBLES, ORIGENES_LEAD, SETTERS_DISPONIBLES } from "@/types/cliente";
import type { Cliente, ClienteInsert } from "@/types/cliente";

const schema = z.object({
  nombre_y_apellido:   z.string().min(3, "Mínimo 3 caracteres"),
  valor_potencial:     z.number().positive("Mayor a 0"),
  servicio_adquirido:  z.string(),
  setter_asignado:     z.string(),
  usuario_de_origen:   z.string(),
  fecha:               z.string().min(1, "Requerido"),
  fecha_de_la_reunion: z.string(),
  notas:               z.string(),
  cerro_la_venta:      z.boolean(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  isOpen: boolean; lead: Cliente | null;
  isSubmitting: boolean;
  onClose: () => void; onSubmit: (data: ClienteInsert) => Promise<void>;
}

const inp = (err?: boolean) =>
  `w-full bg-slate-950 border ${err ? "border-red-800" : "border-slate-700"} text-slate-200 placeholder-slate-600 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-slate-500 transition-colors font-[inherit]`;

const sel = `w-full bg-slate-950 border border-slate-700 text-slate-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-slate-500 transition-colors font-[inherit]`;

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
      nombre_y_apellido:   "",
      valor_potencial:     0,
      servicio_adquirido:  "",
      setter_asignado:     "",
      usuario_de_origen:   "",
      fecha:               new Date().toISOString().split("T")[0],
      fecha_de_la_reunion: "",
      notas:               "",
      cerro_la_venta:      false,
    },
  });

  const submit = async (v: FormValues) => {
    await onSubmit({
      nombre: v.nombre_y_apellido,
      email: "",
      telefono: "",
      empresa: "",
      valor_potencial: v.valor_potencial,
      cerro_la_venta: v.cerro_la_venta,
      nombre_y_apellido: v.nombre_y_apellido,
      servicio_adquirido: v.servicio_adquirido,
      fecha_de_la_reunion: v.fecha_de_la_reunion,
      usuario_de_origen: v.usuario_de_origen,
      setter_asignado: v.setter_asignado,
      fecha: v.fecha,
      notas: v.notas,
    });
    if (!isEdit) reset();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={() => { if (!isEdit) reset(); onClose(); }}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden modal-in"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              {isEdit ? <Save size={14} className="text-white" /> : <Plus size={16} className="text-white" strokeWidth={2.5} />}
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">{isEdit ? "Editar Lead" : "Nuevo Lead"}</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {isEdit ? lead?.nombre_y_apellido : "Registra un nuevo prospecto"}
              </p>
            </div>
          </div>
          <button type="button" onClick={() => { if (!isEdit) reset(); onClose(); }} title="Cerrar modal"
            className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-200 transition-colors">
            <X size={14} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(submit)}>
          <div className="px-5 py-4 space-y-3.5 max-h-[60vh] overflow-y-auto
            [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full">

            <div>
              <Lbl>Nombre y Apellido *</Lbl>
              <input type="text" className={inp(!!errors.nombre_y_apellido)}
                placeholder="Ej. Valentina Ríos Herrera"
                {...register("nombre_y_apellido")} />
              {errors.nombre_y_apellido && <p className="text-xs text-red-400 mt-1">⚠ {errors.nombre_y_apellido.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Lbl>Servicio</Lbl>
                <select className={sel} {...register("servicio_adquirido")}>
                  <option value="">Seleccionar...</option>
                  {SERVICIOS_DISPONIBLES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <Lbl>Valor USD *</Lbl>
                <input type="number" step="0.01" placeholder="0.00" className={inp(!!errors.valor_potencial)}
                  {...register("valor_potencial", { valueAsNumber: true })} />
                {errors.valor_potencial && <p className="text-xs text-red-400 mt-1">⚠ {errors.valor_potencial.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Lbl>Setter</Lbl>
                <select className={sel} {...register("setter_asignado")}>
                  <option value="">Seleccionar...</option>
                  {SETTERS_DISPONIBLES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <Lbl>Fuente</Lbl>
                <select className={sel} {...register("usuario_de_origen")}>
                  <option value="">Seleccionar...</option>
                  {ORIGENES_LEAD.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Lbl>Fecha Ingreso *</Lbl>
                <input type="date" className={inp(!!errors.fecha)} {...register("fecha")} />
              </div>
              <div>
                <Lbl>Fecha Reunión</Lbl>
                <input type="date" className={inp()} {...register("fecha_de_la_reunion")} />
              </div>
            </div>

            {isEdit && (
              <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                <input type="checkbox" id="cerro" className="w-4 h-4 rounded accent-emerald-500"
                  {...register("cerro_la_venta")} />
                <label htmlFor="cerro" className="text-sm text-slate-300 cursor-pointer select-none">
                  Marcar como <span className="font-semibold text-emerald-400">venta cerrada</span>
                </label>
              </div>
            )}

            <div>
              <Lbl>Notas</Lbl>
              <textarea rows={3} placeholder="Contexto del prospecto, necesidades, objeciones..."
                className={`${inp()} resize-none`}
                {...register("notas")} />
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-slate-800 flex items-center justify-end gap-2">
            <button type="button" onClick={() => { if (!isEdit) reset(); onClose(); }}
              className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-lg transition-colors min-w-[120px] justify-center">
              {isSubmitting
                ? <><Loader2 size={14} className="animate-spin" /> Guardando...</>
                : isEdit ? <><Save size={14} /> Guardar</> : <><Plus size={14} strokeWidth={2.5} /> Crear Lead</>}
            </button>
          </div>
        </form>
      </div>
      <style>{`.modal-in{animation:modalIn 0.15s ease-out}@keyframes modalIn{from{opacity:0;transform:scale(0.95) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)}}`}</style>
    </div>
  );
}