"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { clienteIdDoCenario } from "./cenario-lookup";

export type ItemFormState = { error?: string; success?: string } | undefined;

type ItemTable = "voos" | "transporte" | "passeios";

type Payload = Record<string, string | number | boolean | null>;

async function requireSession() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    redirect("/login");
  }

  return supabase;
}

function text(formData: FormData, key: string, maxLength: number) {
  const value = String(formData.get(key) ?? "").trim();
  return value === "" ? null : value.slice(0, maxLength);
}

function decimal(formData: FormData, key: string) {
  const value = text(formData, key, 20);
  if (value === null) return null;

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function integer(formData: FormData, key: string) {
  const value = decimal(formData, key);
  return value !== null && Number.isInteger(value) ? value : null;
}

function buildVoo(formData: FormData): Payload | string {
  const origem = text(formData, "origem", 100);
  const destino = text(formData, "destino", 100);
  const partida = text(formData, "partida", 16);
  const chegada = text(formData, "chegada", 16);
  const escalas = integer(formData, "escalas");
  const valorUnitario = decimal(formData, "valor_unitario");
  const pax = integer(formData, "pax");

  if (!origem || !destino || !partida) {
    return "Preencha origem, destino e partida.";
  }
  if (chegada && chegada < partida) {
    return "A chegada não pode ser anterior à partida.";
  }
  if (pax !== null && pax < 1) {
    return "A quantidade de passageiros deve ser no mínimo 1.";
  }

  const moeda = text(formData, "moeda", 3);

  return {
    companhia: text(formData, "companhia", 120),
    origem,
    destino,
    partida,
    chegada,
    escalas,
    aeroporto_escala: text(formData, "aeroporto_escala", 160),
    tempo_escala: text(formData, "tempo_escala", 40),
    tarifa: text(formData, "tarifa", 60),
    bagagem: text(formData, "bagagem", 60),
    moeda: moeda ? moeda.toUpperCase() : null,
    valor_unitario: valorUnitario,
    pax,
    status: text(formData, "status", 40),
    link: text(formData, "link", 500),
  };
}

function buildTransporte(formData: FormData): Payload | string {
  const origem = text(formData, "origem", 120);
  const destino = text(formData, "destino", 120);
  const fornecedor = text(formData, "fornecedor", 160);
  const moeda = text(formData, "moeda", 3);
  const status = text(formData, "status", 40);
  const precoUnitario = decimal(formData, "preco_unitario");
  const quantidadePessoas = integer(formData, "quantidade_pessoas");

  if (!origem || !destino || !fornecedor || !moeda || !status) {
    return "Preencha origem, destino, fornecedor, moeda e status.";
  }
  if (precoUnitario === null) {
    return "Informe um preço unitário válido.";
  }
  if (quantidadePessoas === null || quantidadePessoas < 1) {
    return "A quantidade de pessoas deve ser no mínimo 1.";
  }

  return {
    origem,
    destino,
    fornecedor,
    moeda: moeda.toUpperCase(),
    status,
    preco_unitario: precoUnitario,
    quantidade_pessoas: quantidadePessoas,
  };
}

function buildPasseio(formData: FormData): Payload | string {
  const descricao = text(formData, "descricao", 200);
  const cidade = text(formData, "cidade", 100);
  const fornecedor = text(formData, "fornecedor", 160);
  const moeda = text(formData, "moeda", 3);
  const valorUnitario = decimal(formData, "valor_unitario");
  const qtdPessoas = integer(formData, "qtd_pessoas");

  if (!descricao || !cidade || !fornecedor || !moeda) {
    return "Preencha descrição, cidade, fornecedor e moeda.";
  }
  if (valorUnitario === null) {
    return "Informe um valor unitário válido.";
  }
  if (qtdPessoas === null || qtdPessoas < 1) {
    return "A quantidade de pessoas deve ser no mínimo 1.";
  }

  return {
    descricao,
    cidade,
    fornecedor,
    moeda: moeda.toUpperCase(),
    valor_unitario: valorUnitario,
    qtd_pessoas: qtdPessoas,
    transfer: formData.get("transfer") !== null,
    link: text(formData, "link", 500),
  };
}

const BUILDERS: Record<ItemTable, (formData: FormData) => Payload | string> = {
  voos: buildVoo,
  transporte: buildTransporte,
  passeios: buildPasseio,
};

async function saveItem(
  table: ItemTable,
  formData: FormData
): Promise<ItemFormState> {
  const supabase = await requireSession();

  const cenarioId = Number(formData.get("cenario_id"));
  const rawId = formData.get("id");
  const id = rawId === null || rawId === "" ? null : Number(rawId);

  if (!Number.isInteger(cenarioId)) {
    return { error: "Cenário inválido." };
  }
  if (id !== null && !Number.isInteger(id)) {
    return { error: "Item inválido." };
  }

  const payload = BUILDERS[table](formData);

  if (typeof payload === "string") {
    return { error: payload };
  }

  const clienteId = await clienteIdDoCenario(supabase, cenarioId);

  if (clienteId === null) {
    return { error: "Cenário não encontrado." };
  }

  const { error } =
    id === null
      ? await supabase.from(table).insert({ ...payload, cenario_id: cenarioId })
      : await supabase
          .from(table)
          .update(payload)
          .eq("id", id)
          .eq("cenario_id", cenarioId);

  if (error) {
    console.error(`saveItem ${table}:`, error.message);
    return { error: "Não foi possível salvar o item." };
  }

  revalidatePath(`/clientes/${clienteId}`);
  return { success: id === null ? "Item adicionado." : "Item salvo." };
}

async function removeItem(
  table: ItemTable,
  formData: FormData
): Promise<ItemFormState> {
  const supabase = await requireSession();

  const cenarioId = Number(formData.get("cenario_id"));
  const id = Number(formData.get("id"));

  if (!Number.isInteger(cenarioId) || !Number.isInteger(id)) {
    return { error: "Item inválido." };
  }

  const clienteId = await clienteIdDoCenario(supabase, cenarioId);

  if (clienteId === null) {
    return { error: "Cenário não encontrado." };
  }

  const { error } = await supabase
    .from(table)
    .delete()
    .eq("id", id)
    .eq("cenario_id", cenarioId);

  if (error) {
    console.error(`removeItem ${table}:`, error.message);
    return { error: "Não foi possível excluir o item." };
  }

  revalidatePath(`/clientes/${clienteId}`);
  return { success: "Item excluído." };
}

export async function saveVoo(_prev: ItemFormState, formData: FormData) {
  return saveItem("voos", formData);
}

export async function deleteVoo(_prev: ItemFormState, formData: FormData) {
  return removeItem("voos", formData);
}

export async function saveTransporte(_prev: ItemFormState, formData: FormData) {
  return saveItem("transporte", formData);
}

export async function deleteTransporte(
  _prev: ItemFormState,
  formData: FormData
) {
  return removeItem("transporte", formData);
}

export async function savePasseio(_prev: ItemFormState, formData: FormData) {
  return saveItem("passeios", formData);
}

export async function deletePasseio(_prev: ItemFormState, formData: FormData) {
  return removeItem("passeios", formData);
}
