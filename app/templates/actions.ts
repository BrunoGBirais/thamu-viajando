"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseUrl } from "@/lib/supabase/env";
import {
  chavePadrao,
  slugDeChave,
  type Campo,
  type Familia,
  type Formato,
  type Origem,
} from "@/lib/proposta/template";

export type TemplateFormState = { error?: string; success?: string } | undefined;

const ALINHAMENTOS = ["left", "center", "right"];
const FORMATOS = ["texto", "data", "moeda", "numero"];
const FONTES = ["voos", "transporte", "passeios"];
const TIPOGRAFIAS = ["open-sans", "childos"];
const ORIGENS = ["dado", "ia", "manual"];

// O upload é feito pelo navegador; aqui só aceitamos URLs do nosso bucket.
const CAMINHO_PAGINAS = "/storage/v1/object/public/propostas/templates/";

function paginaValida(valor: string) {
  try {
    const url = new URL(valor);
    const origem = new URL(supabaseUrl());

    return url.origin === origem.origin && url.pathname.startsWith(CAMINHO_PAGINAS);
  } catch {
    return false;
  }
}

async function requireSession() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    redirect("/login");
  }

  return supabase;
}

function numero(valor: unknown, padrao: number, min: number, max: number) {
  const parsed = typeof valor === "number" ? valor : Number(valor);
  if (!Number.isFinite(parsed)) return padrao;

  return Math.min(max, Math.max(min, Math.round(parsed * 100) / 100));
}

function texto(valor: unknown, max: number) {
  return typeof valor === "string" ? valor.trim().slice(0, max) : "";
}

function sanitizarCampo(bruto: unknown): Campo | null {
  if (!bruto || typeof bruto !== "object") return null;

  const entrada = bruto as Record<string, unknown>;
  const base = {
    chave: slugDeChave(texto(entrada.chave, 40)) || undefined,
    rotulo: texto(entrada.rotulo, 80) || undefined,
    descricao: texto(entrada.descricao, 500) || undefined,
    origem: ORIGENS.includes(String(entrada.origem))
      ? (String(entrada.origem) as Origem)
      : undefined,
    maxCaracteres: entrada.maxCaracteres
      ? Math.round(numero(entrada.maxCaracteres, 120, 1, 5000))
      : undefined,
    pagina: Math.round(numero(entrada.pagina, 1, 1, 50)),
    x: numero(entrada.x, 0, -20, 120),
    y: numero(entrada.y, 0, -20, 120),
    w: entrada.w === undefined || entrada.w === null
      ? undefined
      : numero(entrada.w, 50, 1, 120),
    rotacao: entrada.rotacao ? numero(entrada.rotacao, 0, -180, 180) : undefined,
    fontSize: numero(entrada.fontSize, 2.5, 0.5, 30),
    familia: TIPOGRAFIAS.includes(String(entrada.familia))
      ? (String(entrada.familia) as Familia)
      : undefined,
    cor: /^#[0-9a-fA-F]{6}$/.test(String(entrada.cor ?? ""))
      ? String(entrada.cor)
      : undefined,
    peso: Math.round(numero(entrada.peso, 400, 100, 900)),
    align: ALINHAMENTOS.includes(String(entrada.align))
      ? (String(entrada.align) as "left" | "center" | "right")
      : undefined,
  };

  if (entrada.tipo === "lista") {
    const fonte = String(entrada.fonte);
    const linha = texto(entrada.linha, 300);
    if (!FONTES.includes(fonte) || !linha) return null;

    return {
      ...base,
      tipo: "lista",
      fonte: fonte as "voos" | "transporte" | "passeios",
      linha,
      espacamento: numero(entrada.espacamento, 1.6, 0.8, 4),
      maxItens: entrada.maxItens
        ? Math.round(numero(entrada.maxItens, 10, 1, 100))
        : undefined,
    };
  }

  const campo = texto(entrada.campo, 120);
  if (!/^[\w]+(\.[\w]+)+$/.test(campo)) return null;

  return {
    ...base,
    tipo: "texto",
    campo,
    formato: FORMATOS.includes(String(entrada.formato))
      ? (String(entrada.formato) as Formato)
      : undefined,
    prefixo: texto(entrada.prefixo, 40) || undefined,
    sufixo: texto(entrada.sufixo, 40) || undefined,
  };
}

// A chave identifica o campo nos valores salvos e no payload da IA: precisa ser única.
function comChavesUnicas(campos: Campo[]) {
  const usadas = new Set<string>();

  return campos.map((campo) => {
    const desejada = campo.chave || chavePadrao(campo);
    let chave = desejada;
    let sufixo = 2;

    while (usadas.has(chave)) {
      chave = `${desejada}_${sufixo}`.slice(0, 40);
      sufixo += 1;
    }

    usadas.add(chave);
    return { ...campo, chave };
  });
}

export async function salvarCampos(templateId: number, campos: unknown) {
  const supabase = await requireSession();

  if (!Number.isInteger(templateId) || !Array.isArray(campos)) {
    return { error: "Dados inválidos." };
  }

  const limpos = comChavesUnicas(
    campos.map(sanitizarCampo).filter(Boolean) as Campo[]
  );

  const { error } = await supabase
    .from("proposta_templates")
    .update({ campos: limpos })
    .eq("id", templateId);

  if (error) {
    return { error: "Não foi possível salvar o layout." };
  }

  revalidatePath("/proposta", "layout");
  revalidatePath(`/templates/${templateId}`);
  return { success: "Layout salvo." };
}

function paginasDoForm(formData: FormData) {
  return formData
    .getAll("paginas_url")
    .map((item) => String(item))
    .filter(paginaValida);
}

export async function criarTemplate(
  _prevState: TemplateFormState,
  formData: FormData
): Promise<TemplateFormState> {
  const supabase = await requireSession();

  const nome = texto(formData.get("nome"), 160);
  if (!nome) {
    return { error: "Informe o nome do modelo." };
  }

  const paginas = paginasDoForm(formData);
  if (paginas.length === 0) {
    return { error: "Envie pelo menos uma imagem de página." };
  }

  const { error } = await supabase.from("proposta_templates").insert({
    nome,
    descricao: texto(formData.get("descricao"), 2000) || null,
    paginas,
    largura_mm: numero(formData.get("largura_mm"), 210, 10, 2000),
    altura_mm: numero(formData.get("altura_mm"), 297, 10, 2000),
  });

  if (error) {
    return { error: "Não foi possível criar o modelo." };
  }

  revalidatePath("/templates");
  revalidatePath("/criar-proposta");
  return { success: "Modelo criado." };
}

export async function atualizarTemplate(
  _prevState: TemplateFormState,
  formData: FormData
): Promise<TemplateFormState> {
  const supabase = await requireSession();

  const id = Number(formData.get("id"));
  const nome = texto(formData.get("nome"), 160);

  if (!Number.isInteger(id) || !nome) {
    return { error: "Informe o nome do modelo." };
  }

  const alteracoes: Record<string, unknown> = {
    nome,
    descricao: texto(formData.get("descricao"), 2000) || null,
    ativo: formData.get("ativo") === "on",
  };

  const arquivos = paginasDoForm(formData);
  if (arquivos.length > 0) {
    alteracoes.paginas = arquivos;
    alteracoes.largura_mm = numero(formData.get("largura_mm"), 210, 10, 2000);
    alteracoes.altura_mm = numero(formData.get("altura_mm"), 297, 10, 2000);
  }

  const { error } = await supabase
    .from("proposta_templates")
    .update(alteracoes)
    .eq("id", id);

  if (error) {
    return { error: "Não foi possível salvar o modelo." };
  }

  revalidatePath("/templates");
  revalidatePath("/criar-proposta");
  return { success: "Modelo salvo." };
}

export async function excluirTemplate(
  _prevState: TemplateFormState,
  formData: FormData
): Promise<TemplateFormState> {
  const supabase = await requireSession();

  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) {
    return { error: "Modelo inválido." };
  }

  const { error } = await supabase
    .from("proposta_templates")
    .delete()
    .eq("id", id);

  if (error) {
    return { error: "Não foi possível excluir o modelo." };
  }

  revalidatePath("/templates");
  revalidatePath("/criar-proposta");
  return { success: "Modelo excluído." };
}

