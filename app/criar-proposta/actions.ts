"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { carregarDadosProposta } from "@/lib/proposta/dados";
import type { DadosProposta } from "@/lib/proposta/template";

// O wizard usa os mesmos dados da proposta impressa para pré-preencher os
// campos, então o que aparece no formulário é o que sai no papel.
export async function dadosDoCenario(
  cenarioId: number
): Promise<DadosProposta | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    redirect("/login");
  }

  if (!Number.isInteger(cenarioId)) return null;

  return carregarDadosProposta(supabase, cenarioId);
}
