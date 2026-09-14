export type OrcamentoFaixa = {
  value: string;
  label: string;
  min: number;
  max: number | null;
};

export const ORCAMENTO_FAIXAS: OrcamentoFaixa[] = [
  { value: "ate-10000", label: "Até R$ 10.000", min: 0, max: 10000 },
  { value: "10000-20000", label: "R$ 10.000 a R$ 20.000", min: 10000, max: 20000 },
  { value: "20000-50000", label: "R$ 20.000 a R$ 50.000", min: 20000, max: 50000 },
  { value: "acima-50000", label: "Acima de R$ 50.000", min: 50000, max: null },
];

export const PAGE_SIZE = 20;

export function readParam(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

export function readPage(value: string | string[] | undefined) {
  const parsed = Number.parseInt(readParam(value), 10);
  return Number.isFinite(parsed) && parsed > 1 ? parsed : 1;
}

// No PostgREST vírgula e parênteses são sintaxe; aspas isolam o valor do filtro.
export function escapeFilterValue(value: string) {
  return value.replace(/["\\]/g, (char) => `\\${char}`);
}
