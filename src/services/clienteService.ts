import { supabase } from "@/integrations/supabase/client";
import type { Cliente, ClienteInsert } from "@/types/cliente";

export const clienteService = {
  async getAll(): Promise<Cliente[]> {
    const { data, error } = await supabase
      .from("clientes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async create(cliente: ClienteInsert): Promise<Cliente> {
    const { data, error } = await supabase
      .from("clientes")
      .insert(cliente)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update({ id, cerro_la_venta }: { id: string; cerro_la_venta: boolean }): Promise<Cliente> {
    const { data, error } = await supabase
      .from("clientes")
      .update({ cerro_la_venta, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateFull(id: string, payload: Partial<ClienteInsert>): Promise<Cliente> {
    const { data, error } = await supabase
      .from("clientes")
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from("clientes")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },
};

export async function fetchClientes() {
  const { data, error } = await supabase
    .from("clientes")
    .select("*")
    .order("created_at", { ascending: false });

  return { data: data || [], error };
}

export async function createCliente(cliente: ClienteInsert) {
  const { data, error } = await supabase
    .from("clientes")
    .insert(cliente)
    .select()
    .single();

  return { data, error };
}

export async function updateCliente(id: string, payload: Partial<ClienteInsert>) {
  const { data, error } = await supabase
    .from("clientes")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  return { data, error };
}

export async function updateClienteStatus(id: string, cerro_la_venta: boolean) {
  const { data, error } = await supabase
    .from("clientes")
    .update({ cerro_la_venta, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  return { data, error };
}

export async function deleteCliente(id: string) {
  const { error } = await supabase
    .from("clientes")
    .delete()
    .eq("id", id);

  return { error };
}