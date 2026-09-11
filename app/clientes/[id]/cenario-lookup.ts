import type { createClient } from "@/lib/supabase/server";

type Client = Awaited<ReturnType<typeof createClient>>;

export async function clienteIdDoCenario(supabase: Client, cenarioId: number) {
  const { data } = await supabase
    .from("cenarios")
    .select("cliente_id")
    .eq("id", cenarioId)
    .maybeSingle();

  const clienteId = Number(data?.cliente_id);
  return Number.isInteger(clienteId) ? clienteId : null;
}
