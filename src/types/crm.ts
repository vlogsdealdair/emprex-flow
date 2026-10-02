export type AppRole = "admin" | "setter" | "closer";

export type DealStageKey =
  | "new"
  | "contacted"
  | "qualified"
  | "meeting_scheduled"
  | "meeting_completed"
  | "proposal_sent"
  | "negotiation"
  | "won"
  | "lost";

export type ActivityType =
  | "call"
  | "whatsapp"
  | "email"
  | "meeting"
  | "note"
  | "stage_change"
  | "task"
  | "payment";

export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: AppRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: string;
  full_name: string;
  phone_e164: string | null;
  email: string | null;
  company: string | null;
  created_at: string;
  updated_at: string;
}

export interface Deal {
  id: string;
  contact_id: string;
  service_id: string | null;
  stage_id: string;
  setter_id: string | null;
  closer_id: string | null;
  source: string | null;
  potential_value_usd: number;
  actual_value_usd: number | null;
  next_action: string | null;
  next_follow_up_at: string | null;
  won_at: string | null;
  lost_at: string | null;
  loss_reason_id: string | null;
  created_at: string;
  updated_at: string;
}
