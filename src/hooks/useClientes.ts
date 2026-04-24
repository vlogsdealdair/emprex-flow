// src/hooks/useClientes.ts
// Real-time sync via Supabase channel
import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  fetchClientes, createCliente, updateCliente,
  updateClienteStatus, deleteCliente,
} from "@/services/clienteService";
import type { ClienteInsert, ClienteUpdate } from "@/types/cliente";

const KEY = ["clientes"] as const;

export function useClientes() {
  const qc = useQueryClient();

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel("clientes-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "clientes" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            qc.setQueryData(KEY, (prev: any) =>
              prev ? [payload.new, ...prev.filter((c: any) => c.id !== payload.new.id)] : [payload.new]
            );
          } else if (payload.eventType === "UPDATE") {
            qc.setQueryData(KEY, (prev: any) =>
              prev?.map((c: any) => c.id === payload.new.id ? payload.new : c)
            );
          } else if (payload.eventType === "DELETE") {
            qc.setQueryData(KEY, (prev: any) =>
              prev?.filter((c: any) => c.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [qc]);

  return useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data, error } = await fetchClientes();
      if (error) throw new Error(error.message);
      return data!;
    },
    staleTime: 1000 * 60,
  });
}

export function useCreateCliente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: ClienteInsert) => {
      const { data, error } = await createCliente(payload);
      if (error) throw new Error(error.message);
      return data!;
    },
    onSuccess: (n) => {
      qc.setQueryData(KEY, (p: any) => p ? [n, ...p.filter((c: any) => c.id !== n.id)] : [n]);
    },
  });
}

export function useUpdateCliente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: ClienteUpdate }) => {
      const { data, error } = await updateCliente(id, payload);
      if (error) throw new Error(error.message);
      return data!;
    },
    onSuccess: (updated) => {
      qc.setQueryData(KEY, (p: any) =>
        p?.map((c: any) => c.id === updated.id ? updated : c)
      );
    },
  });
}

export function useToggleClienteStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, cerro_la_venta }: { id: string; cerro_la_venta: boolean }) => {
      const { data, error } = await updateClienteStatus(id, cerro_la_venta);
      if (error) throw new Error(error.message);
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
    onError: (_, __, ctx) => {
      if (ctx?.prev) qc.setQueryData(KEY, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteCliente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await deleteCliente(id);
      if (error) throw new Error(error.message);
    },
    onSuccess: (_, id) => {
      qc.setQueryData(KEY, (p: any) => p?.filter((c: any) => c.id !== id));
    },
  });
}