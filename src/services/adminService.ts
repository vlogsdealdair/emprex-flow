import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/database.types";

export type AppSettings = Tables<"app_settings">;

export async function fetchAppSettings(): Promise<AppSettings> {
  const { data, error } = await supabase.from("app_settings").select("*").eq("id", true).single();
  if (error) throw error;
  return data;
}

export async function updateMyProfile(input: { full_name: string; phone?: string | null; job_title?: string | null }): Promise<void> {
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) throw authError ?? new Error("No authenticated user");

  const { error } = await supabase.from("profiles").update({
    full_name: input.full_name.trim(),
    phone: input.phone || null,
    job_title: input.job_title || null,
  }).eq("id", auth.user.id);
  if (error) throw error;
}

function ext(file: File) {
  const found = file.name.split(".").pop()?.toLowerCase();
  return found && /^[a-z0-9]+$/.test(found) ? found : "bin";
}

export async function uploadAvatar(file: File): Promise<string> {
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) throw authError ?? new Error("No authenticated user");

  const path = `avatars/${auth.user.id}/avatar-${Date.now()}.${ext(file)}`;
  const { error: uploadError } = await supabase.storage.from("crm-assets").upload(path, file, {
    cacheControl: "3600",
    upsert: true,
  });
  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from("crm-assets").getPublicUrl(path);
  const { error } = await supabase.from("profiles").update({ avatar_url: data.publicUrl }).eq("id", auth.user.id);
  if (error) throw error;
  return data.publicUrl;
}

export async function uploadLogo(file: File): Promise<string> {
  const path = `branding/logo-${Date.now()}.${ext(file)}`;
  const { error: uploadError } = await supabase.storage.from("crm-assets").upload(path, file, {
    cacheControl: "3600",
    upsert: true,
  });
  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from("crm-assets").getPublicUrl(path);
  const { error } = await supabase.from("app_settings").update({
    logo_url: data.publicUrl,
    company_name: "EMPREX CRM",
    updated_at: new Date().toISOString(),
  }).eq("id", true);
  if (error) throw error;
  return data.publicUrl;
}

export async function createCrmUser(input: {
  fullName: string;
  email: string;
  password: string;
  role: "admin" | "setter" | "closer";
}) {
  const { data, error } = await supabase.functions.invoke("admin-tools", {
    body: { action: "create-user", ...input },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const result = String(reader.result || "");
      resolve(result.includes(",") ? result.split(",")[1] : result);
    };
    reader.readAsDataURL(file);
  });
}

export async function importLeadsFile(file: File, setterId?: string | null) {
  const fileBase64 = await fileToBase64(file);
  const { data, error } = await supabase.functions.invoke("admin-tools", {
    body: { action: "import-leads", fileBase64, setterId: setterId || null },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data as { ok: boolean; imported: number; skipped: number; errors: { row: number; message: string }[] };
}
