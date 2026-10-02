import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createDeal,
  deleteDeal,
  fetchCurrentProfile,
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
