"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { clienteIdDoCenario } from "./cenario-lookup";

export type ClienteFormState = { error?: string; success?: string } | undefined;

function text(formData: FormData, key: string, maxLength: number) {
  const value = String(formData.get(key) ?? "").trim();
  return value === "" ? null : value.slice(0, maxLength);
}

function integer(formData: FormData, key: string) {
  const value = text(formData, key, 10);
  if (value === null) return null;

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
}

function decimal(formData: FormData, key: string) {
  const value = text(formData, key, 20);
  if (value === null) return null;

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

export async function updateCliente(
  _prevState: ClienteFormState,
  formData: FormData
): Promise<ClienteFormState> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    redirect("/login");
  }

  const id = Number(formData.get("id"));

  if (!Number.isInteger(id)) {
    return { error: "Cliente inválido." };
  }

  const nome = text(formData, "nome", 120);

  if (!nome) {
    return { error: "O nome é obrigatório." };
  }

  const { error } = await supabase
    .from("clientes")
    .update({
      nome,
      email: text(formData, "email", 160) ?? "",
      telefone: text(formData, "telefone", 30),
      data_contato: text(formData, "data_contato", 10),
      periodo_para_viajar: text(formData, "periodo_para_viajar", 80),
      qtd_adultos: integer(formData, "qtd_adultos"),
      qtd_criancas: integer(formData, "qtd_criancas"),
      qtd_bebes: integer(formData, "qtd_bebes"),
      perfil: text(formData, "perfil", 80),
      orcamento: decimal(formData, "orcamento"),
      etapa: text(formData, "etapa", 80),
      data_ultimo_contato: text(formData, "data_ultimo_contato", 10),
    })
    .eq("id", id);

  if (error) {
    console.error("updateCliente:", error.message);
    return { error: "Não foi possível salvar as alterações." };
  }

  revalidatePath("/clientes");
  revalidatePath(`/clientes/${id}`);
  return { success: "Alterações salvas." };
}

export type CenarioFormState = { error?: string; success?: string } | undefined;

type CenarioInput = {
  destino: string;
  dataInicio: string;
  dataFim: string;
};

async function requireSession() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    redirect("/login");
  }

  return supabase;
}

function readCenario(formData: FormData): CenarioInput | string {
  const destino = text(formData, "destino", 120);
  const dataInicio = text(formData, "data_inicio", 10);
  const dataFim = text(formData, "data_fim", 10);

  if (!destino || !dataInicio || !dataFim) {
    return "Preencha destino, início e fim.";
  }
  if (dataFim < dataInicio) {
    return "A data final não pode ser anterior à inicial.";
  }

  return { destino, dataInicio, dataFim };
}

export async function createCenario(
  _prevState: CenarioFormState,
  formData: FormData
): Promise<CenarioFormState> {
  const supabase = await requireSession();
  const clienteId = Number(formData.get("cliente_id"));
  const input = readCenario(formData);

  if (!Number.isInteger(clienteId)) {
    return { error: "Cliente inválido." };
  }
  if (typeof input === "string") {
    return { error: input };
  }

  const { error } = await supabase.from("cenarios").insert({
    cliente_id: clienteId,
    destino: input.destino,
    data_inicio: input.dataInicio,
    data_fim: input.dataFim,
  });

  if (error) {
    console.error("createCenario:", error.message);
    return { error: "Não foi possível criar o cenário." };
  }

  revalidatePath(`/clientes/${clienteId}`);
  return { success: "Cenário criado." };
}

export async function updateCenario(
  _prevState: CenarioFormState,
  formData: FormData
): Promise<CenarioFormState> {
  const supabase = await requireSession();
  const id = Number(formData.get("id"));
  const input = readCenario(formData);

  if (!Number.isInteger(id)) {
    return { error: "Cenário inválido." };
  }
  if (typeof input === "string") {
    return { error: input };
  }

  const clienteId = await clienteIdDoCenario(supabase, id);

  if (clienteId === null) {
    return { error: "Cenário não encontrado." };
  }

  const { error } = await supabase
    .from("cenarios")
    .update({
      destino: input.destino,
      data_inicio: input.dataInicio,
      data_fim: input.dataFim,
    })
    .eq("id", id);

  if (error) {
    console.error("updateCenario:", error.message);
    return { error: "Não foi possível salvar o cenário." };
  }

  revalidatePath(`/clientes/${clienteId}`);
  return { success: "Cenário salvo." };
}

export async function deleteCenario(
  _prevState: CenarioFormState,
  formData: FormData
): Promise<CenarioFormState> {
  const supabase = await requireSession();
  const id = Number(formData.get("id"));

  if (!Number.isInteger(id)) {
    return { error: "Cenário inválido." };
  }

  const clienteId = await clienteIdDoCenario(supabase, id);

  if (clienteId === null) {
    return { error: "Cenário não encontrado." };
  }

  const { error } = await supabase.from("cenarios").delete().eq("id", id);

  if (error) {
    console.error("deleteCenario:", error.message);
    return { error: "Não foi possível excluir o cenário." };
  }

  revalidatePath(`/clientes/${clienteId}`);
  return { success: "Cenário excluído." };
}
