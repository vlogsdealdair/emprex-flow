import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import * as XLSX from "npm:xlsx@0.18.5";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...cors, "Content-Type": "application/json" } });
}

function textValue(row: Record<string, unknown>, aliases: string[]) {
  const keys = Object.keys(row);
  const key = keys.find(k => aliases.includes(k.trim().toLowerCase()));
  const value = key ? row[key] : undefined;
  return value == null ? "" : String(value).trim();
}

function numberValue(row: Record<string, unknown>, aliases: string[]) {
  const raw = textValue(row, aliases).replace(/[$,\s]/g, "");
  const value = Number(raw);
  return Number.isFinite(value) ? value : 0;
}

function normalizePhone(raw: string) {
  const value = raw.trim().replace(/[\s()-]/g, "");
  if (!value) return null;
  if (/^\+[1-9]\d{7,14}$/.test(value)) return value;
  const digits = value.replace(/\D/g, "");
  if (/^09\d{8}$/.test(digits)) return "+593" + digits.slice(1);
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Unauthorized" }, 401);

  const url = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  const userClient = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } });
  const adminClient = createClient(url, serviceKey);

  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) return json({ error: "Unauthorized" }, 401);

  const { data: profile } = await adminClient
    .from("profiles")
    .select("role,is_active")
    .eq("id", userData.user.id)
    .single();

  if (!profile || profile.role !== "admin" || !profile.is_active) {
    return json({ error: "Admin access required" }, 403);
  }

  const body = await req.json();
  const action = body?.action;

  if (action === "create-user") {
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const fullName = String(body.fullName || "").trim();
    const role = ["admin","setter","closer","technical_partner"].includes(body.role) ? body.role : "setter";

    if (!email || password.length < 8 || !fullName) {
      return json({ error: "Email, nombre y contraseña de al menos 8 caracteres son obligatorios." }, 400);
    }

    const { data, error } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error || !data.user) return json({ error: error?.message || "No se pudo crear el usuario." }, 400);

    const { error: profileError } = await adminClient.from("profiles").insert({
      id: data.user.id,
      email,
      full_name: fullName,
      role,
      is_active: true,
    });

    if (profileError) {
      await adminClient.auth.admin.deleteUser(data.user.id);
      return json({ error: profileError.message }, 400);
    }

    return json({ ok: true, user: { id: data.user.id, email, fullName, role } });
  }

  if (action === "import-leads") {
    const fileBase64 = String(body.fileBase64 || "");
    if (!fileBase64) return json({ error: "Archivo vacío." }, 400);

    const bytes = Uint8Array.from(atob(fileBase64), c => c.charCodeAt(0));
    const workbook = XLSX.read(bytes, { type: "array" });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, { defval: "" });

    const { data: newStage } = await adminClient.from("pipeline_stages").select("id").eq("key","new").single();
    if (!newStage) return json({ error: "No existe la etapa Nuevo." }, 500);

    const { data: services } = await adminClient.from("services").select("id,name").eq("is_active",true);
    const serviceMap = new Map((services || []).map(s => [s.name.trim().toLowerCase(), s.id]));

    const setterId = body?.setterId || null;
    let imported = 0;
    const errors: { row: number; message: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const fullName = textValue(row, ["nombre","nombre completo","nombre y apellido","cliente","prospecto","name","full name"]);
      if (!fullName) {
        errors.push({ row: i + 2, message: "Sin nombre" });
        continue;
      }

      const email = textValue(row, ["email","correo","correo electrónico","correo electronico"]);
      const phoneRaw = textValue(row, ["telefono","teléfono","whatsapp","celular","phone","mobile"]);
      const company = textValue(row, ["empresa","compañía","compania","company"]);
      const source = textValue(row, ["origen","fuente","source"]);
      const notes = textValue(row, ["notas","nota","observaciones","comentarios","notes"]);
      const serviceName = textValue(row, ["servicio","servicio adquirido","service"]);
      const potential = numberValue(row, ["valor","valor potencial","monto","presupuesto","potential value","value"]);

      const { data: contact, error: contactError } = await adminClient.from("contacts").insert({
        full_name: fullName,
        phone_e164: normalizePhone(phoneRaw),
        email: email || null,
        company: company || null,
        notes: notes || null,
        created_by: userData.user.id,
      }).select("id").single();

      if (contactError || !contact) {
        errors.push({ row: i + 2, message: contactError?.message || "Error creando contacto" });
        continue;
      }

      const { error: dealError } = await adminClient.from("deals").insert({
        contact_id: contact.id,
        stage_id: newStage.id,
        setter_id: setterId,
        service_id: serviceName ? (serviceMap.get(serviceName.toLowerCase()) || null) : null,
        source: source || "Importación Excel",
        potential_value_usd: Math.max(0, potential),
        notes: notes || null,
        created_by: userData.user.id,
      });

      if (dealError) {
        await adminClient.from("contacts").delete().eq("id", contact.id);
        errors.push({ row: i + 2, message: dealError.message });
        continue;
      }

      imported++;
    }

    return json({ ok: true, imported, skipped: errors.length, errors: errors.slice(0, 50) });
  }

  return json({ error: "Unknown action" }, 400);
});
