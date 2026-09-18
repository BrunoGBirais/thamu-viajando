export type Formato = "texto" | "data" | "moeda" | "numero";

export type Familia = "open-sans" | "childos";

// Open Sans vem do next/font; Childos Arabic é carregada por @font-face.
export const FAMILIAS: Record<Familia, string> = {
  "open-sans": "var(--font-open-sans), sans-serif",
  childos: "'Childos Arabic', var(--font-open-sans), sans-serif",
};

export type Origem = "dado" | "ia" | "manual";

type Base = {
  // Identificador estável do campo: é a chave usada nos valores salvos e no payload da IA.
  chave?: string;
  rotulo?: string;
  descricao?: string;
  origem?: Origem;
  maxCaracteres?: number;
  pagina?: number;
  x: number;
  y: number;
  w?: number;
  rotacao?: number;
  fontSize?: number;
  familia?: Familia;
  cor?: string;
  peso?: number;
  align?: "left" | "center" | "right";
};

export type CampoTexto = Base & {
  tipo?: "texto";
  campo: string;
  formato?: Formato;
  prefixo?: string;
  sufixo?: string;
};

// As fontes "proposta.*" vêm da view proposta_dados, já com os textos prontos.
export type FonteLista =
  | "voos"
  | "transporte"
  | "passeios"
  | "proposta.voos"
  | "proposta.transfers"
  | "proposta.passeios";

export type CampoLista = Base & {
  tipo: "lista";
  fonte: FonteLista;
  linha: string;
  espacamento?: number;
  maxItens?: number;
};

export type Campo = CampoTexto | CampoLista;

export type PropostaTemplate = {
  id: number;
  nome: string;
  descricao: string | null;
  canva_design_id: string | null;
  paginas: string[];
  largura_mm: number | string;
  altura_mm: number | string;
  campos: Campo[];
};

export type DadosProposta = {
  cliente: Record<string, unknown>;
  cenario: Record<string, unknown>;
  totais: Record<string, number>;
  // Uma linha da view proposta_dados: textos já formatados como a arte os mostra.
  proposta: Record<string, unknown>;
};

// Texto digitado na criação da proposta, indexado pela chave do campo.
export type ValoresManuais = Record<string, string>;

export function slugDeChave(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
}

export function chavePadrao(campo: Campo) {
  const origem =
    campo.tipo === "lista"
      ? `lista_${(campo as CampoLista).fonte}`
      : (campo as CampoTexto).campo;

  return slugDeChave(origem) || "campo";
}

export function chaveDoCampo(campo: Campo) {
  return campo.chave || chavePadrao(campo);
}

// Listas e campos de lookup não são digitáveis: só texto com origem "manual".
export function camposManuais(campos: Campo[]): CampoTexto[] {
  return campos.filter(
    (campo): campo is CampoTexto =>
      campo.tipo !== "lista" && campo.origem === "manual"
  );
}

// Na criação da proposta todo texto pode ser corrigido ou apagado antes de
// imprimir; só as listas continuam automáticas.
export function camposEditaveis(campos: Campo[]): CampoTexto[] {
  return campos.filter(
    (campo): campo is CampoTexto => campo.tipo !== "lista"
  );
}

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

function numero(value: unknown) {
  const parsed = typeof value === "string" ? Number(value) : value;
  return typeof parsed === "number" && Number.isFinite(parsed) ? parsed : 0;
}

function somar(itens: unknown, coluna: string) {
  if (!Array.isArray(itens)) return 0;
  return itens.reduce(
    (total, item) => total + numero((item as Record<string, unknown>)[coluna]),
    0
  );
}

export function montarDados(
  cliente: Record<string, unknown>,
  cenario: Record<string, unknown>,
  proposta: Record<string, unknown> = {}
): DadosProposta {
  const hotel = numero(cenario.hotel_valor_total);
  const voos = somar(cenario.voos, "total");
  const transporte = somar(cenario.transporte, "total");
  const passeios = somar(cenario.passeios, "valor_total");

  return {
    cliente,
    cenario,
    proposta,
    totais: {
      hotel,
      voos,
      transporte,
      passeios,
      geral: hotel + voos + transporte + passeios,
    },
  };
}

// Colunas DATE chegam como "YYYY-MM-DD"; evita o deslocamento de fuso do Date.
function formatarData(value: unknown) {
  const texto = String(value).slice(0, 10);
  const [ano, mes, dia] = texto.split("-");
  return ano && mes && dia ? `${dia}/${mes}/${ano}` : texto;
}

export function formatar(value: unknown, formato: Formato = "texto") {
  if (value === null || value === undefined || value === "") return "";

  switch (formato) {
    case "data":
      return formatarData(value);
    case "moeda":
      return currency.format(numero(value));
    case "numero":
      return String(numero(value));
    default:
      return String(value);
  }
}

function buscar(origem: unknown, caminho: string): unknown {
  return caminho
    .split(".")
    .reduce<unknown>(
      (atual, chave) =>
        atual && typeof atual === "object"
          ? (atual as Record<string, unknown>)[chave]
          : undefined,
      origem
    );
}

// Valor automático do campo, sem o que foi digitado na criação da proposta.
export function valorCalculado(dados: DadosProposta, campo: CampoTexto) {
  if (campo.origem === "manual") return "";

  const valor = formatar(buscar(dados, campo.campo), campo.formato);
  return valor === "" ? "" : `${campo.prefixo ?? ""}${valor}${campo.sufixo ?? ""}`;
}

export function valorDoCampo(
  dados: DadosProposta,
  campo: CampoTexto,
  valores?: ValoresManuais
) {
  const chave = chaveDoCampo(campo);

  // Chave presente = texto escrito à mão, inclusive vazio para esconder o campo.
  if (valores && chave in valores) {
    const texto = valores[chave];
    return texto === ""
      ? ""
      : `${campo.prefixo ?? ""}${texto}${campo.sufixo ?? ""}`;
  }

  return valorCalculado(dados, campo);
}

// Substitui "{coluna}" ou "{coluna:moeda}" pelos valores do item.
export function renderLinha(
  item: Record<string, unknown>,
  modelo: string
): string {
  return modelo.replace(
    /\{([\w.]+)(?::(\w+))?\}/g,
    (_match, caminho: string, formato?: string) =>
      formatar(buscar(item, caminho), (formato as Formato) ?? "texto")
  );
}

export function itensDaLista(dados: DadosProposta, campo: CampoLista) {
  // "proposta.voos" é um caminho; "voos" continua vindo do cenário.
  const itens = campo.fonte.includes(".")
    ? buscar(dados, campo.fonte)
    : dados.cenario[campo.fonte];

  if (!Array.isArray(itens)) return [];

  const lista = itens as Record<string, unknown>[];
  return campo.maxItens ? lista.slice(0, campo.maxItens) : lista;
}
