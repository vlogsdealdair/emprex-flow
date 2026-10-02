import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/database.types";

export type Profile = Tables<"profiles">;
export type PipelineStage = Tables<"pipeline_stages">;
export type Service = Tables<"services">;
export type Contact = Tables<"contacts">;
export type Deal = Tables<"deals">;

export type DealView = Deal & {
  contact: Contact;
  service: Service | null;
  stage: PipelineStage;
  setter: Pick<Profile, "id" | "full_name" | "email" | "role"> | null;
  closer: Pick<Profile, "id" | "full_name" | "email" | "role"> | null;
};

export type DealFormPayload = {
  full_name: string;
  phone_e164?: string | null;
  email?: string | null;
  company?: string | null;
  service_id?: string | null;
  stage_id: string;
  setter_id?: string | null;
  closer_id?: string | null;
  source?: string | null;
  potential_value_usd: number;
  actual_value_usd?: number | null;
  next_action?: string | null;
  next_follow_up_at?: string | null;
  notes?: string | null;
};

const DEAL_SELECT = `
  *,
  contact:contacts(*),
  service:services(*),
  stage:pipeline_stages(*),
  setter:profiles!deals_setter_id_fkey(id,full_name,email,role),
  closer:profiles!deals_closer_id_fkey(id,full_name,email,role)
`;

export async function fetchCurrentProfile(): Promise<Profile> {
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) throw authError ?? new Error("No authenticated user");

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", auth.user.id)
    .single();

  if (error) throw error;
  return data;
}

export async function fetchDeals(): Promise<DealView[]> {
  const { data, error } = await supabase
    .from("deals")
    .select(DEAL_SELECT)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as DealView[];
}

export async function fetchPipelineStages(): Promise<PipelineStage[]> {
  const { data, error } = await supabase
    .from("pipeline_stages")
    .select("*")
    .eq("is_active", true)
    .order("position");
  if (error) throw error;
  return data ?? [];
}

export async function fetchServices(): Promise<Service[]> {
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("is_active", true)
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export async function fetchTeam(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("is_active", true)
    .order("full_name");
  if (error) throw error;
  return data ?? [];
}

export async function createDeal(payload: DealFormPayload, currentProfile: Profile): Promise<void> {
  const contactInsert: TablesInsert<"contacts"> = {
    full_name: payload.full_name.trim(),
    phone_e164: payload.phone_e164 || null,
    email: payload.email || null,
    company: payload.company || null,
    notes: payload.notes || null,
    created_by: currentProfile.id,
  };

  const { data: contact, error: contactError } = await supabase
    .from("contacts")
    .insert(contactInsert)
    .select("*")
    .single();
  if (contactError) throw contactError;

  const dealInsert: TablesInsert<"deals"> = {
    contact_id: contact.id,
    service_id: payload.service_id || null,
    stage_id: payload.stage_id,
    setter_id: currentProfile.role === "setter" ? currentProfile.id : (payload.setter_id || null),
    closer_id: currentProfile.role === "closer" ? currentProfile.id : (payload.closer_id || null),
    source: payload.source || null,
    potential_value_usd: payload.potential_value_usd,
    actual_value_usd: payload.actual_value_usd || null,
    next_action: payload.next_action || null,
    next_follow_up_at: payload.next_follow_up_at || null,
    notes: payload.notes || null,
    created_by: currentProfile.id,
  };

  const { error: dealError } = await supabase.from("deals").insert(dealInsert);
  if (dealError) {
    await supabase.from("contacts").delete().eq("id", contact.id);
    throw dealError;
  }
}

export async function updateDeal(view: DealView, payload: DealFormPayload): Promise<void> {
  const contactUpdate: TablesUpdate<"contacts"> = {
    full_name: payload.full_name.trim(),
    phone_e164: payload.phone_e164 || null,
    email: payload.email || null,
    company: payload.company || null,
    notes: payload.notes || null,
  };

  const { error: contactError } = await supabase
    .from("contacts")
    .update(contactUpdate)
    .eq("id", view.contact_id);
  if (contactError) throw contactError;

  const dealUpdate: TablesUpdate<"deals"> = {
    service_id: payload.service_id || null,
    stage_id: payload.stage_id,
    setter_id: payload.setter_id || null,
    closer_id: payload.closer_id || null,
    source: payload.source || null,
    potential_value_usd: payload.potential_value_usd,
    actual_value_usd: payload.actual_value_usd || null,
    next_action: payload.next_action || null,
    next_follow_up_at: payload.next_follow_up_at || null,
    notes: payload.notes || null,
  };

  const { error } = await supabase.from("deals").update(dealUpdate).eq("id", view.id);
  if (error) throw error;
}

export async function moveDealStage(id: string, stage_id: string): Promise<void> {
  const { error } = await supabase.from("deals").update({ stage_id }).eq("id", id);
  if (error) throw error;
}

export async function deleteDeal(view: DealView): Promise<void> {
  const { error } = await supabase.from("deals").delete().eq("id", view.id);
  if (error) throw error;
  await supabase.from("contacts").delete().eq("id", view.contact_id);
}

export function whatsappUrl(phone: string): string {
  return `https://wa.me/${phone.replace(/\D/g, "")}`;
}
