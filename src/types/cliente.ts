export interface Cliente {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  empresa: string;
  valor_potencial: number;
  cerro_la_venta: boolean;
  setter_email?: string;
  nombre_y_apellido: string;
  servicio_adquirido?: string;
  fecha_de_la_reunion?: string;
  usuario_de_origen?: string;
  setter_asignado?: string;
  fecha: string;
  created_at: string;
  updated_at: string;
  notas?: string;
}

export interface ClienteInsert {
  nombre: string;
  email: string;
  telefono: string;
  empresa?: string;
  valor_potencial: number;
  cerro_la_venta?: boolean;
  setter_email?: string;
  nombre_y_apellido: string;
  servicio_adquirido?: string;
  fecha_de_la_reunion?: string;
  usuario_de_origen?: string;
  setter_asignado?: string;
  fecha: string;
  notas?: string;
}

export type ClienteUpdate = Partial<ClienteInsert>;

// ── Constantes para formularios ───────────────────────────
export const SERVICIOS_DISPONIBLES = [
  "Campañas EMPREX",
  "Diseño de Landing Page",
  "Vlog Growth Specialist",
  "Consultoría Digital",
  "SEO y SEM",
  "Social Media Management",
] as const;

export const ORIGENES_LEAD = [
  "Instagram",
  "LinkedIn",
  "YouTube",
  "TikTok",
  "Referido",
  "Cold Outreach",
  "Sitio Web",
  "Email Marketing",
] as const;

export const SETTERS_DISPONIBLES = [
  "Ana García",
  "Carlos López",
  "María Rodríguez",
  "Juan Martínez",
  "Laura Sánchez",
  "Pedro González",
] as const;

export type ServicioType = typeof SERVICIOS_DISPONIBLES[number];
export type OrigenType = typeof ORIGENES_LEAD[number];
export type SetterType = typeof SETTERS_DISPONIBLES[number];