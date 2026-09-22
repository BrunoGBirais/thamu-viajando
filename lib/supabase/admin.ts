import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { supabaseUrl } from "./env";

// Cliente com a service_role key: ignora RLS e permite criar/remover usuários.
// NUNCA importe este arquivo em um Client Component — a chave é um segredo.
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY não está definida no .env.local");
  }

  return createSupabaseClient(
    supabaseUrl(),
    serviceRoleKey,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
