import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchAppSettings, updateMyProfile, uploadAvatar, uploadLogo } from "@/services/adminService";
import {
  createDeal,
  deleteDeal,
  fetchCurrentProfile,
  fetchClients,
  fetchNotifications,
  markNotificationRead,
  createService,
  updateService,
  updateProfile,
  createPayment,
  logDealActivity,
  fetchSalesTargets,
  upsertSalesTarget,
  fetchAllServices,
  deleteService,
  fetchToolLinks,
  updateToolLink,
  fetchCommissionRules,
  updateCommissionRule,
  fetchCommissions,
  createCommissionPayment,
  fetchDealActivities,
  fetchDealTasks,
  fetchDealPayments,
  addDealNote,
  createDealTask,
  toggleTaskComplete,
  type Task,
  fetchDeals,
  fetchPipelineStages,
  fetchServices,
  fetchTeam,
  moveDealStage,
  updateDeal,
  type DealFormPayload,
  type DealView,
  type Profile,
} from "@/services/crmService";

export const CRM_KEYS = {
  profile: ["crm", "profile"] as const,
  deals: ["crm", "deals"] as const,
  stages: ["crm", "stages"] as const,
  services: ["crm", "services"] as const,
  team: ["crm", "team"] as const,
  clients: ["crm", "clients"] as const,
  notifications: ["crm", "notifications"] as const,
  targets: ["crm", "targets"] as const,
  appSettings: ["crm", "app-settings"] as const,
  allServices: ["crm", "all-services"] as const,
  tools: ["crm", "tools"] as const,
  commissionRules: ["crm", "commission-rules"] as const,
  commissions: ["crm", "commissions"] as const,
  activities: (dealId: string) => ["crm", "activities", dealId] as const,
  tasks: (dealId: string) => ["crm", "tasks", dealId] as const,
  payments: (dealId: string) => ["crm", "payments", dealId] as const,
};

export function useCurrentProfile() {
  return useQuery({ queryKey: CRM_KEYS.profile, queryFn: fetchCurrentProfile, staleTime: 300_000 });
}

export function useDeals() {
  return useQuery({ queryKey: CRM_KEYS.deals, queryFn: fetchDeals, staleTime: 30_000 });
}

export function usePipelineStages() {
  return useQuery({ queryKey: CRM_KEYS.stages, queryFn: fetchPipelineStages, staleTime: 300_000 });
}

export function useServices() {
  return useQuery({ queryKey: CRM_KEYS.services, queryFn: fetchServices, staleTime: 300_000 });
}

export function useTeam(enabled = true) {
  return useQuery({ queryKey: CRM_KEYS.team, queryFn: fetchTeam, staleTime: 300_000, enabled });
}

export function useCreateDeal() {
  const qc = useQueryClient();
  return useMutation<void, Error, { payload: DealFormPayload; profile: Profile }>({
    mutationFn: ({ payload, profile }) => createDeal(payload, profile),
    onSuccess: () => qc.invalidateQueries({ queryKey: CRM_KEYS.deals }),
  });
}

export function useUpdateDeal() {
  const qc = useQueryClient();
  return useMutation<void, Error, { deal: DealView; payload: DealFormPayload }>({
    mutationFn: ({ deal, payload }) => updateDeal(deal, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: CRM_KEYS.deals }),
  });
}

export function useMoveDealStage() {
  const qc = useQueryClient();
  return useMutation<void, Error, { id: string; stage_id: string }>({
    mutationFn: ({ id, stage_id }) => moveDealStage(id, stage_id),
    onSuccess: () => qc.invalidateQueries({ queryKey: CRM_KEYS.deals }),
  });
}

export function useDeleteDeal() {
  const qc = useQueryClient();
  return useMutation<void, Error, DealView>({
    mutationFn: deleteDeal,
    onSuccess: () => qc.invalidateQueries({ queryKey: CRM_KEYS.deals }),
  });
}


export function useDealActivities(dealId: string | null) {
  return useQuery({
    queryKey: CRM_KEYS.activities(dealId ?? "none"),
    queryFn: () => fetchDealActivities(dealId!),
    enabled: Boolean(dealId),
  });
}

export function useDealTasks(dealId: string | null) {
  return useQuery({
    queryKey: CRM_KEYS.tasks(dealId ?? "none"),
    queryFn: () => fetchDealTasks(dealId!),
    enabled: Boolean(dealId),
  });
}

export function useDealPayments(dealId: string | null) {
  return useQuery({
    queryKey: CRM_KEYS.payments(dealId ?? "none"),
    queryFn: () => fetchDealPayments(dealId!),
    enabled: Boolean(dealId),
  });
}

export function useAddDealNote() {
  const qc = useQueryClient();
  return useMutation<void, Error, { dealId: string; contactId: string; body: string; profileId: string }>({
    mutationFn: ({ dealId, contactId, body, profileId }) => addDealNote(dealId, contactId, body, profileId),
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: CRM_KEYS.activities(vars.dealId) }),
  });
}


export function useCreateDealTask() {
  const qc = useQueryClient();
  return useMutation<void, Error, {
    dealId: string;
    contactId: string;
    title: string;
    description?: string | null;
    dueAt?: string | null;
    assignedTo: string;
    createdBy: string;
    priority?: "low" | "medium" | "high" | "urgent";
  }>({
    mutationFn: createDealTask,
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: CRM_KEYS.tasks(vars.dealId) }),
  });
}

export function useToggleTaskComplete() {
  const qc = useQueryClient();
  return useMutation<void, Error, { task: Task; dealId: string }>({
    mutationFn: ({ task }) => toggleTaskComplete(task),
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: CRM_KEYS.tasks(vars.dealId) }),
  });
}


export function useClients() {
  return useQuery({ queryKey: CRM_KEYS.clients, queryFn: fetchClients, staleTime: 30_000 });
}

export function useNotifications() {
  return useQuery({ queryKey: CRM_KEYS.notifications, queryFn: fetchNotifications, refetchInterval: 30_000 });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: markNotificationRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: CRM_KEYS.notifications }),
  });
}

export function useCreateService() {
  const qc = useQueryClient();
  return useMutation<void, Error, { name: string; description?: string | null; defaultPriceUsd?: number | null; pricingMinUsd?: number | null; pricingMaxUsd?: number | null; internalNotes?: string | null }>({
    mutationFn: createService,
    onSuccess: () => { qc.invalidateQueries({ queryKey: CRM_KEYS.services }); qc.invalidateQueries({ queryKey: CRM_KEYS.allServices }); },
  });
}

export function useUpdateService() {
  const qc = useQueryClient();
  return useMutation<void, Error, { id: string; patch: { name?: string; description?: string | null; default_price_usd?: number | null; pricing_min_usd?: number | null; pricing_max_usd?: number | null; internal_notes?: string | null; is_active?: boolean } }>({
    mutationFn: ({ id, patch }) => updateService(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: CRM_KEYS.services }),
  });
}


export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation<void, Error, { id: string; patch: { role?: "admin" | "setter" | "closer"; is_active?: boolean; full_name?: string } }>({
    mutationFn: ({ id, patch }) => updateProfile(id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CRM_KEYS.team });
      qc.invalidateQueries({ queryKey: CRM_KEYS.profile });
    },
  });
}


export function useCreatePayment() {
  const qc = useQueryClient();
  return useMutation<void, Error, {
    dealId: string;
    amountUsd: number;
    method: string;
    paidAt?: string | null;
    reference?: string | null;
    notes?: string | null;
    createdBy: string;
  }>({
    mutationFn: createPayment,
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: CRM_KEYS.payments(vars.dealId) });
      qc.invalidateQueries({ queryKey: CRM_KEYS.deals });
    },
  });
}

export function useLogDealActivity() {
  const qc = useQueryClient();
  return useMutation<void, Error, {
    dealId: string;
    contactId: string;
    type: "call" | "whatsapp" | "email" | "meeting" | "note" | "stage_change" | "task" | "payment";
    body: string;
    createdBy: string;
    metadata?: Record<string, string | number | boolean | null>;
  }>({
    mutationFn: logDealActivity,
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: CRM_KEYS.activities(vars.dealId) }),
  });
}


export function useSalesTargets() {
  return useQuery({ queryKey: CRM_KEYS.targets, queryFn: fetchSalesTargets, staleTime: 60_000 });
}

export function useUpsertSalesTarget() {
  const qc = useQueryClient();
  return useMutation<void, Error, {
    profileId: string;
    periodStart: string;
    periodEnd: string;
    targetRevenueUsd?: number | null;
    targetMeetings?: number | null;
    targetWins?: number | null;
  }>({
    mutationFn: upsertSalesTarget,
    onSuccess: () => qc.invalidateQueries({ queryKey: CRM_KEYS.targets }),
  });
}


export function useAppSettings() {
  return useQuery({ queryKey: CRM_KEYS.appSettings, queryFn: fetchAppSettings, staleTime: 300_000 });
}

export function useUpdateMyProfile() {
  const qc = useQueryClient();
  return useMutation<void, Error, { full_name: string; phone?: string | null; job_title?: string | null }>({
    mutationFn: updateMyProfile,
    onSuccess: () => qc.invalidateQueries({ queryKey: CRM_KEYS.profile }),
  });
}

export function useUploadAvatar() {
  const qc = useQueryClient();
  return useMutation<string, Error, File>({
    mutationFn: uploadAvatar,
    onSuccess: () => qc.invalidateQueries({ queryKey: CRM_KEYS.profile }),
  });
}

export function useUploadLogo() {
  const qc = useQueryClient();
  return useMutation<string, Error, File>({
    mutationFn: uploadLogo,
    onSuccess: () => qc.invalidateQueries({ queryKey: CRM_KEYS.appSettings }),
  });
}


export function useAllServices() {
  return useQuery({ queryKey: CRM_KEYS.allServices, queryFn: fetchAllServices, staleTime: 60_000 });
}

export function useDeleteService() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: deleteService,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CRM_KEYS.allServices });
      qc.invalidateQueries({ queryKey: CRM_KEYS.services });
    },
  });
}

export function useToolLinks() {
  return useQuery({ queryKey: CRM_KEYS.tools, queryFn: fetchToolLinks, staleTime: 60_000 });
}

export function useUpdateToolLink() {
  const qc = useQueryClient();
  return useMutation<void, Error, { id: string; patch: { name?: string; description?: string | null; url?: string; is_active?: boolean; position?: number } }>({
    mutationFn: ({ id, patch }) => updateToolLink(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: CRM_KEYS.tools }),
  });
}

export function useCommissionRules() {
  return useQuery({ queryKey: CRM_KEYS.commissionRules, queryFn: fetchCommissionRules, staleTime: 60_000 });
}

export function useUpdateCommissionRule() {
  const qc = useQueryClient();
  return useMutation<void, Error, { id: string; patch: { calculation_type?: string; value?: number; is_active?: boolean; label?: string } }>({
    mutationFn: ({ id, patch }) => updateCommissionRule(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: CRM_KEYS.commissionRules }),
  });
}

export function useCommissions() {
  return useQuery({ queryKey: CRM_KEYS.commissions, queryFn: fetchCommissions, staleTime: 30_000 });
}

export function useCreateCommissionPayment() {
  const qc = useQueryClient();
  return useMutation<void, Error, { commissionId: string; amountUsd: number; note?: string | null; createdBy: string }>({
    mutationFn: createCommissionPayment,
    onSuccess: () => qc.invalidateQueries({ queryKey: CRM_KEYS.commissions }),
  });
}
