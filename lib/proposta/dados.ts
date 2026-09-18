import type { createClient } from "@/lib/supabase/server";
import { montarDados, type DadosProposta } from "./template";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

// Junta o cenário cru (grupos cliente/cenario/totais) com a linha da view
// proposta_dados (grupo proposta), usada tanto na proposta quanto no editor.
export async function carregarDadosProposta(
  supabase: SupabaseServerClient,
  cenarioId: number
): Promise<DadosProposta | null> {
  const [{ data: cenario }, { data: proposta }] = await Promise.all([
    supabase
      .from("cenarios")
      .select("*, clientes(*), voos(*), transporte(*), passeios(*)")
      .eq("id", cenarioId)
      .maybeSingle(),
    supabase
      .from("proposta_dados")
      .select("*")
      .eq("cenario_id", cenarioId)
      .maybeSingle(),
  ]);

  if (!cenario) return null;

  const { clientes: cliente, ...dadosCenario } = cenario;

  return montarDados(
    (cliente ?? {}) as Record<string, unknown>,
    dadosCenario as Record<string, unknown>,
    (proposta ?? {}) as Record<string, unknown>
  );
}
