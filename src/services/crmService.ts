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


export type Activity = Tables<"activities">;
export type Task = Tables<"tasks">;
export type Payment = Tables<"payments">;

export type DealActivityView = Activity & {
  creator: Pick<Profile, "id" | "full_name" | "email"> | null;
};

export async function fetchDealActivities(dealId: string): Promise<DealActivityView[]> {
  const { data, error } = await supabase
    .from("activities")
    .select("*, creator:profiles!activities_created_by_fkey(id,full_name,email)")
    .eq("deal_id", dealId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as DealActivityView[];
}

export async function addDealNote(dealId: string, contactId: string, body: string, profileId: string): Promise<void> {
  const { error } = await supabase.from("activities").insert({
    deal_id: dealId,
    contact_id: contactId,
    type: "note",
    body: body.trim(),
    created_by: profileId,
  });
  if (error) throw error;
}

export async function fetchDealTasks(dealId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("deal_id", dealId)
    .order("completed_at", { ascending: true, nullsFirst: true })
    .order("due_at", { ascending: true, nullsFirst: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchDealPayments(dealId: string): Promise<Payment[]> {
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("deal_id", dealId)
    .order("paid_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}


export async function createDealTask(input: {
  dealId: string;
  contactId: string;
  title: string;
  description?: string | null;
  dueAt?: string | null;
  assignedTo: string;
  createdBy: string;
  priority?: "low" | "medium" | "high" | "urgent";
}): Promise<void> {
  const { error } = await supabase.from("tasks").insert({
    deal_id: input.dealId,
    contact_id: input.contactId,
    title: input.title.trim(),
    description: input.description || null,
    due_at: input.dueAt || null,
    assigned_to: input.assignedTo,
    created_by: input.createdBy,
    priority: input.priority ?? "medium",
  });
  if (error) throw error;
}

export async function toggleTaskComplete(task: Task): Promise<void> {
  const completed_at = task.completed_at ? null : new Date().toISOString();
  const { error } = await supabase.from("tasks").update({ completed_at }).eq("id", task.id);
  if (error) throw error;
}


export type Client = Tables<"clients">;
export type Notification = Tables<"notifications">;

export type ClientView = Client & {
  contact: Contact;
  first_won_deal: Deal | null;
};

export async function fetchClients(): Promise<ClientView[]> {
  const { data, error } = await supabase
    .from("clients")
    .select("*, contact:contacts(*), first_won_deal:deals!clients_first_won_deal_id_fkey(*)")
    .eq("is_active", true)
    .order("became_client_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as ClientView[];
}

export async function fetchNotifications(): Promise<Notification[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw error;
  return data ?? [];
}

export async function markNotificationRead(id: string): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function createService(input: { name: string; description?: string | null; defaultPriceUsd?: number | null; pricingMinUsd?: number | null; pricingMaxUsd?: number | null; internalNotes?: string | null }): Promise<void> {
  const { error } = await supabase.from("services").insert({
    name: input.name.trim(),
    description: input.description || null,
    default_price_usd: input.defaultPriceUsd ?? null,
    pricing_min_usd: input.pricingMinUsd ?? null,
    pricing_max_usd: input.pricingMaxUsd ?? null,
    internal_notes: input.internalNotes ?? null,
    is_active: true,
  });
  if (error) throw error;
}

export async function updateService(id: string, patch: { name?: string; description?: string | null; default_price_usd?: number | null; pricing_min_usd?: number | null; pricing_max_usd?: number | null; internal_notes?: string | null; is_active?: boolean }): Promise<void> {
  const { error } = await supabase.from("services").update(patch).eq("id", id);
  if (error) throw error;
}


export async function updateProfile(id: string, patch: { role?: "admin" | "setter" | "closer"; is_active?: boolean; full_name?: string }): Promise<void> {
  const { error } = await supabase.from("profiles").update(patch).eq("id", id);
  if (error) throw error;
}


export async function createPayment(input: {
  dealId: string;
  amountUsd: number;
  method: string;
  paidAt?: string | null;
  reference?: string | null;
  notes?: string | null;
  createdBy: string;
}): Promise<void> {
  const { error } = await supabase.from("payments").insert({
    deal_id: input.dealId,
    amount_usd: input.amountUsd,
    method: input.method,
    paid_at: input.paidAt || new Date().toISOString(),
    reference: input.reference || null,
    notes: input.notes || null,
    created_by: input.createdBy,
  });
  if (error) throw error;
}

export async function logDealActivity(input: {
  dealId: string;
  contactId: string;
  type: "call" | "whatsapp" | "email" | "meeting" | "note" | "stage_change" | "task" | "payment";
  body: string;
  createdBy: string;
  metadata?: Record<string, string | number | boolean | null>;
}): Promise<void> {
  const { error } = await supabase.from("activities").insert({
    deal_id: input.dealId,
    contact_id: input.contactId,
    type: input.type,
    body: input.body,
    metadata: input.metadata ?? {},
    created_by: input.createdBy,
  });
  if (error) throw error;
}

export function googleCalendarUrl(input: {
  title: string;
  start: string;
  durationMinutes?: number;
  details?: string;
}): string {
  const start = new Date(input.start);
  const end = new Date(start.getTime() + (input.durationMinutes ?? 30) * 60_000);
  const format = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: input.title,
    dates: `${format(start)}/${format(end)}`,
    details: input.details ?? "",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}


export type SalesTarget = Tables<"sales_targets">;

export async function fetchSalesTargets(): Promise<SalesTarget[]> {
  const { data, error } = await supabase
    .from("sales_targets")
    .select("*")
    .order("period_start", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function upsertSalesTarget(input: {
  profileId: string;
  periodStart: string;
  periodEnd: string;
  targetRevenueUsd?: number | null;
  targetMeetings?: number | null;
  targetWins?: number | null;
}): Promise<void> {
  const { error } = await supabase.from("sales_targets").upsert({
    profile_id: input.profileId,
    period_start: input.periodStart,
    period_end: input.periodEnd,
    target_revenue_usd: input.targetRevenueUsd ?? null,
    target_meetings: input.targetMeetings ?? null,
    target_wins: input.targetWins ?? null,
  }, { onConflict: "profile_id,period_start,period_end" });
  if (error) throw error;
}


export type ToolLink = Tables<"tool_links">;
export type CommissionRule = Tables<"commission_rules">;
export type Commission = Tables<"commissions">;
export type CommissionPayment = Tables<"commission_payments">;

export type CommissionView = Commission & {
  profile: Pick<Profile, "id" | "full_name" | "email" | "role">;
  deal: (Deal & { contact: Contact }) | null;
  payments: CommissionPayment[];
};

export async function fetchAllServices(): Promise<Service[]> {
  const { data, error } = await supabase.from("services").select("*").order("name");
  if (error) throw error;
  return data ?? [];
}

export async function deleteService(id: string): Promise<void> {
  const { error } = await supabase.from("services").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchToolLinks(): Promise<ToolLink[]> {
  const { data, error } = await supabase.from("tool_links").select("*").order("position");
  if (error) throw error;
  return data ?? [];
}

export async function updateToolLink(id: string, patch: { name?: string; description?: string | null; url?: string; is_active?: boolean; position?: number }): Promise<void> {
  const { error } = await supabase.from("tool_links").update(patch).eq("id", id);
  if (error) throw error;
}

export async function fetchCommissionRules(): Promise<CommissionRule[]> {
  const { data, error } = await supabase.from("commission_rules").select("*").order("role");
  if (error) throw error;
  return data ?? [];
}

export async function updateCommissionRule(id: string, patch: { calculation_type?: string; value?: number; is_active?: boolean; label?: string }): Promise<void> {
  const { error } = await supabase.from("commission_rules").update(patch).eq("id", id);
  if (error) throw error;
}

export async function fetchCommissions(): Promise<CommissionView[]> {
  const { data, error } = await supabase
    .from("commissions")
    .select("*, profile:profiles!commissions_profile_id_fkey(id,full_name,email,role), deal:deals!commissions_deal_id_fkey(*, contact:contacts(*)), payments:commission_payments(*)")
    .order("earned_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as CommissionView[];
}

export async function createCommissionPayment(input: { commissionId: string; amountUsd: number; note?: string | null; createdBy: string }): Promise<void> {
  const { error } = await supabase.from("commission_payments").insert({
    commission_id: input.commissionId,
    amount_usd: input.amountUsd,
    note: input.note || null,
    created_by: input.createdBy,
  });
  if (error) throw error;
}
