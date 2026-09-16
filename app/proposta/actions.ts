"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  camposManuais,
  chaveDoCampo,
  type Campo,
  type ValoresManuais,
} from "@/lib/proposta/template";

// O template manda no que pode ser gravado: chaves fora dele são descartadas.
function valoresDoForm(campos: Campo[], formData: FormData): ValoresManuais {
  const valores: ValoresManuais = {};

  for (const campo of camposManuais(campos)) {
    const chave = chaveDoCampo(campo);
    const bruto = formData.get(`campo_${chave}`);
    const texto = typeof bruto === "string" ? bruto.trim() : "";

    if (texto) {
      valores[chave] = texto.slice(0, campo.maxCaracteres ?? 500);
    }
  }

  return valores;
}

export async function gerarProposta(formData: FormData) {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();

  if (!claims?.claims) {
    redirect("/login");
  }

  const cenarioId = Number(formData.get("cenario_id"));
  const templateId = Number(formData.get("template_id"));

  if (!Number.isInteger(cenarioId) || !Number.isInteger(templateId)) {
    redirect("/criar-proposta");
  }

  const { data: template } = await supabase
    .from("proposta_templates")
    .select("campos")
    .eq("id", templateId)
    .maybeSingle();

  if (!template) {
    redirect("/criar-proposta");
  }

  const valores = valoresDoForm((template.campos ?? []) as Campo[], formData);

  const { error } = await supabase
    .from("proposta_valores")
    .upsert(
      {
        cenario_id: cenarioId,
        template_id: templateId,
        valores,
        atualizado_em: new Date().toISOString(),
      },
      { onConflict: "cenario_id,template_id" }
    );

  if (error) {
    console.error("Falha ao salvar valores da proposta:", error);
  }

  revalidatePath("/criar-proposta");
  revalidatePath(`/proposta/${cenarioId}`);
  redirect(`/proposta/${cenarioId}?template=${templateId}`);
}
