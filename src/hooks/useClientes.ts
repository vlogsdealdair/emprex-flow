import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchClientes, createCliente, updateCliente,
  updateClienteStatus, deleteCliente,
} from "@/services/clienteService";
import type { ClienteInsert, ClienteUpdate } from "@/types/cliente";

const KEY = ["clientes"] as const;

export function useClientes() {
  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data, error } = await fetchClientes();
      if (error) throw new Error(error.message || "Failed to fetch clientes");
      return data!;
    },
    staleTime: 1000 * 30,
  });
}

export function useCreateCliente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ClienteInsert) => {
      const { data, error } = await createCliente(payload);
      if (error) throw new Error(error.message || "Failed to create cliente");
      return data!;
    },
    onSuccess: (n) => qc.setQueryData(KEY, (p: any) => p ? [n, ...p] : [n]),
  });
}

export function useToggleClienteStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, cerro_la_venta }: { id: string; cerro_la_venta: boolean }) => {
      const { data, error } = await updateClienteStatus(id, cerro_la_venta);
      if (error) throw new Error(error.message || "Failed to update cliente status");
      return data!;
    },
    onMutate: async ({ id, cerro_la_venta }) => {
      await qc.cancelQueries({ queryKey: KEY });
      const prev = qc.getQueryData(KEY);
      qc.setQueryData(KEY, (p: any) =>
        p?.map((c: any) => c.id === id ? { ...c, cerro_la_venta } : c)
      );
      return { prev };
    },
    onError: (_, __, ctx: any) => {
      if (ctx?.prev) qc.setQueryData(KEY, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateCliente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: ClienteUpdate }) => {
      const { data, error } = await updateCliente(id, payload);
      if (error) throw new Error(error.message || "Failed to update cliente");
      return data!;
    },
    onSuccess: (updated) => {
      qc.setQueryData(KEY, (p: any) =>
        p?.map((c: any) => c.id === updated.id ? updated : c)
      );
    },
  });
}

export function useDeleteCliente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await deleteCliente(id);
      if (error) throw new Error(error.message || "Failed to delete cliente");
    },
    onSuccess: (_, id) => {
      qc.setQueryData(KEY, (p: any) => p?.filter((c: any) => c.id !== id));
    },
  });
}