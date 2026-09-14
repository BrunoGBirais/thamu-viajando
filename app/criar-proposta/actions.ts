"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type PropostaFormState =
  | { error?: string; success?: string; propostaUrl?: string }
  | undefined;

export async function criarProposta(
  _prevState: PropostaFormState,
  formData: FormData
): Promise<PropostaFormState> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    redirect("/login");
  }

  const webhookUrl = process.env.N8N_CRIAR_PROPOSTA_WEBHOOK_URL;

  if (!webhookUrl) {
    return {
      error:
        "Defina N8N_CRIAR_PROPOSTA_WEBHOOK_URL no .env.local com a URL do webhook do n8n.",
    };
  }

  const clienteId = Number(formData.get("cliente_id"));
  const cenarioId = Number(formData.get("cenario_id"));
  const templateId = String(formData.get("template_id") ?? "").trim();

  if (!Number.isInteger(clienteId) || !Number.isInteger(cenarioId)) {
    return { error: "Selecione o cliente e a proposta." };
  }
  if (!templateId) {
    return { error: "Selecione o template." };
  }

  // Relê os dados no servidor: o payload enviado ao n8n não vem do formulário.
  const { data: cenario, error } = await supabase
    .from("cenarios")
    .select(
      "*, clientes!inner(id, nome, email, telefone), voos(*), transporte(*), passeios(*)"
    )
    .eq("id", cenarioId)
    .eq("cliente_id", clienteId)
    .maybeSingle();

  if (error) {
    return { error: `Não foi possível carregar a proposta: ${error.message}` };
  }
  if (!cenario) {
    return { error: "Proposta não encontrada para o cliente selecionado." };
  }

  const { clientes: cliente, ...dadosCenario } = cenario;

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({
        template: { id: templateId },
        cliente,
        cenario: dadosCenario,
        solicitadoPor: data.claims.email,
      }),
    });

    if (!response.ok) {
      return { error: `O webhook respondeu com status ${response.status}.` };
    }

    const payload = await response.json().catch(() => null);
    const raiz = Array.isArray(payload) ? payload[0] : payload;
    const propostaUrl =
      typeof raiz?.url === "string"
        ? raiz.url
        : typeof raiz?.design?.urls?.edit_url === "string"
        ? raiz.design.urls.edit_url
        : undefined;

    return { success: "Proposta enviada para geração no n8n.", propostaUrl };
  } catch (cause) {
    console.error("criarProposta:", cause);
    return { error: "Não foi possível contatar o webhook do n8n." };
  }
}
