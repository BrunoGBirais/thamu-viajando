"use client";

import { useActionState, useEffect, useState, type ReactNode } from "react";
import { Modal } from "../../components/modal";
import { useToast } from "../../components/toast";
import {
  createCenario,
  deleteCenario,
  updateCenario,
  type CenarioFormState,
} from "./actions";
import {
  deletePasseio,
  deleteTransporte,
  deleteVoo,
  savePasseio,
  saveTransporte,
  saveVoo,
} from "./itens-actions";
import {
  ItensCenario,
  type FieldDef,
  type FieldOption,
  type FormValues,
  type ItemRecord,
  type ItemSummary,
} from "./itens-cenario";

export type Cenario = {
  id: number;
  cliente_id: number;
  destino: string;
  data_inicio: string;
  data_fim: string;
  hotel_nome?: string | null;
  voos?: ItemRecord[] | null;
  transporte?: ItemRecord[] | null;
  passeios?: ItemRecord[] | null;
};

const fieldClass =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-foreground shadow-2xs outline-none transition placeholder:text-subtle hover:border-line-strong focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/15";

const labelClass = "mb-1 block text-xs font-medium text-muted";

const MOEDAS: FieldOption[] = [
  { value: "BRL", label: "BRL · Real" },
  { value: "USD", label: "USD · Dólar" },
  { value: "EUR", label: "EUR · Euro" },
  { value: "GBP", label: "GBP · Libra" },
  { value: "ARS", label: "ARS · Peso arg." },
];

const STATUS: FieldOption[] = [
  { value: "Pesquisando", label: "Pesquisando" },
  { value: "Disponível", label: "Disponível" },
  { value: "Reservado", label: "Reservado" },
  { value: "Confirmado", label: "Confirmado" },
  { value: "Cancelado", label: "Cancelado" },
];

const ESCALAS: FieldOption[] = [
  { value: "0", label: "Direto" },
  { value: "1", label: "1 escala" },
  { value: "2", label: "2 escalas" },
  { value: "3", label: "3+ escalas" },
];

const temEscala = (values: FormValues) =>
  values.escalas !== "" && values.escalas !== "0";

const VOO_FIELDS: FieldDef[] = [
  {
    name: "origem",
    label: "Origem",
    section: "Rota",
    required: true,
    maxLength: 100,
    placeholder: "GRU · São Paulo",
    span: "sm:col-span-2",
  },
  {
    name: "destino",
    label: "Destino",
    section: "Rota",
    required: true,
    maxLength: 100,
    placeholder: "MCO · Orlando",
    span: "sm:col-span-2",
  },
  {
    name: "companhia",
    label: "Companhia",
    section: "Rota",
    maxLength: 120,
    placeholder: "LATAM",
    span: "sm:col-span-2",
  },
  {
    name: "partida",
    label: "Partida",
    section: "Rota",
    type: "datetime-local",
    required: true,
  },
  {
    name: "chegada",
    label: "Chegada",
    section: "Rota",
    type: "datetime-local",
  },
  {
    name: "escalas",
    label: "Paradas",
    section: "Escalas",
    type: "chips",
    options: ESCALAS,
    newValue: "0",
    span: "sm:col-span-4",
  },
  {
    name: "aeroporto_escala",
    label: "Aeroporto de escala",
    section: "Escalas",
    maxLength: 160,
    placeholder: "PTY · Cidade do Panamá",
    span: "sm:col-span-2",
    showWhen: temEscala,
  },
  {
    name: "tempo_escala",
    label: "Tempo de escala",
    section: "Escalas",
    maxLength: 40,
    placeholder: "2h 15min",
    span: "sm:col-span-2",
    showWhen: temEscala,
  },
  {
    name: "moeda",
    label: "Moeda",
    section: "Valores",
    type: "select",
    options: MOEDAS,
    newValue: "BRL",
  },
  {
    name: "valor_unitario",
    label: "Valor por pessoa",
    section: "Valores",
    type: "number",
    step: "0.01",
    min: "0",
    placeholder: "0,00",
    span: "sm:col-span-2",
  },
  {
    name: "pax",
    label: "Pax",
    section: "Valores",
    type: "number",
    min: "1",
    newValue: "1",
  },
  {
    name: "status",
    label: "Status",
    section: "Situação",
    type: "chips",
    options: STATUS,
    newValue: "Pesquisando",
    span: "sm:col-span-4",
  },
  {
    name: "link",
    label: "Link da cotação",
    section: "Situação",
    type: "url",
    maxLength: 500,
    placeholder: "https://",
    span: "sm:col-span-4",
  },
];

const TRANSPORTE_FIELDS: FieldDef[] = [
  {
    name: "origem",
    label: "Origem",
    section: "Trajeto",
    required: true,
    maxLength: 120,
    span: "sm:col-span-2",
  },
  {
    name: "destino",
    label: "Destino",
    section: "Trajeto",
    required: true,
    maxLength: 120,
    span: "sm:col-span-2",
  },
  {
    name: "fornecedor",
    label: "Fornecedor",
    section: "Trajeto",
    required: true,
    maxLength: 160,
    span: "sm:col-span-4",
  },
  {
    name: "moeda",
    label: "Moeda",
    section: "Valores",
    type: "select",
    options: MOEDAS,
    required: true,
    newValue: "BRL",
  },
  {
    name: "preco_unitario",
    label: "Preço por pessoa",
    section: "Valores",
    type: "number",
    step: "0.01",
    min: "0",
    required: true,
    placeholder: "0,00",
    span: "sm:col-span-2",
  },
  {
    name: "quantidade_pessoas",
    label: "Pessoas",
    section: "Valores",
    type: "number",
    min: "1",
    required: true,
    newValue: "1",
  },
  {
    name: "status",
    label: "Status",
    section: "Situação",
    type: "chips",
    options: STATUS,
    required: true,
    newValue: "Pesquisando",
    span: "sm:col-span-4",
  },
];

const PASSEIO_FIELDS: FieldDef[] = [
  {
    name: "descricao",
    label: "Descrição",
    section: "Passeio",
    required: true,
    maxLength: 200,
    placeholder: "Ex.: Magic Kingdom · 1 dia",
    span: "sm:col-span-4",
  },
  {
    name: "cidade",
    label: "Cidade",
    section: "Passeio",
    required: true,
    maxLength: 100,
    span: "sm:col-span-2",
  },
  {
    name: "fornecedor",
    label: "Fornecedor",
    section: "Passeio",
    required: true,
    maxLength: 160,
    span: "sm:col-span-2",
  },
  {
    name: "moeda",
    label: "Moeda",
    section: "Valores",
    type: "select",
    options: MOEDAS,
    required: true,
    newValue: "BRL",
  },
  {
    name: "valor_unitario",
    label: "Valor por pessoa",
    section: "Valores",
    type: "number",
    step: "0.01",
    min: "0",
    required: true,
    placeholder: "0,00",
    span: "sm:col-span-2",
  },
  {
    name: "qtd_pessoas",
    label: "Pessoas",
    section: "Valores",
    type: "number",
    min: "1",
    required: true,
    newValue: "1",
  },
  {
    name: "transfer",
    label: "Transfer incluso",
    section: "Extras",
    type: "checkbox",
    span: "sm:col-span-2",
  },
  {
    name: "link",
    label: "Link",
    section: "Extras",
    type: "url",
    maxLength: 500,
    placeholder: "https://",
    span: "sm:col-span-4",
  },
];

function money(moeda: unknown, value: unknown) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return null;

  const currency =
    typeof moeda === "string" && moeda.trim().length === 3
      ? moeda.trim().toUpperCase()
      : "BRL";

  try {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

// Datas do PostgREST vêm como "YYYY-MM-DD"; new Date() deslocaria o dia pelo fuso.
function dia(value: unknown) {
  if (typeof value !== "string" || value.length < 10) return "";

  const [ano, mes, d] = value.slice(0, 10).split("-");
  return `${d}/${mes}/${ano.slice(2)}`;
}

function diaHora(value: unknown) {
  if (typeof value !== "string" || value.length < 16) return dia(value);

  return `${dia(value)} ${value.slice(11, 16)}`;
}

function periodo(inicio: string, fim: string) {
  return `${dia(inicio)} → ${dia(fim)}`;
}

function juntar(...partes: (string | null | undefined | false)[]) {
  const limpo = partes.filter(Boolean);
  return limpo.length > 0 ? limpo.join(" · ") : null;
}

function descreverVoo(item: ItemRecord): ItemSummary {
  return {
    title: `${item.origem} → ${item.destino}`,
    meta: juntar(
      diaHora(item.partida),
      item.companhia as string | null,
      item.escalas ? `${item.escalas} escala(s)` : "direto",
      item.status as string | null
    ),
    badge: money(item.moeda, item.total),
  };
}

function descreverTransporte(item: ItemRecord): ItemSummary {
  return {
    title: `${item.origem} → ${item.destino}`,
    meta: juntar(
      item.fornecedor as string | null,
      `${item.quantidade_pessoas} pax`,
      item.status as string | null
    ),
    badge: money(item.moeda, item.total),
  };
}

function descreverPasseio(item: ItemRecord): ItemSummary {
  return {
    title: String(item.descricao),
    meta: juntar(
      item.cidade as string | null,
      item.fornecedor as string | null,
      `${item.qtd_pessoas} pax`,
      item.transfer === true && "transfer incluso"
    ),
    badge: money(item.moeda, item.valor_total),
  };
}

function duracao(partida: string, chegada: string) {
  if (!partida || !chegada) return null;

  // Os dois campos vêm do mesmo input local, então a diferença não sofre fuso.
  const ms = new Date(chegada).getTime() - new Date(partida).getTime();
  if (!Number.isFinite(ms) || ms <= 0) return null;

  const horas = Math.floor(ms / 3_600_000);
  const minutos = Math.round((ms % 3_600_000) / 60_000);

  return minutos > 0 ? `${horas}h ${minutos}min` : `${horas}h`;
}

function totalLinha(moeda: string, unitario: string, quantidade: string) {
  const valor = Number(unitario);
  const pessoas = Number(quantidade);

  if (!Number.isFinite(valor) || !Number.isFinite(pessoas)) return null;
  if (valor <= 0 || pessoas <= 0) return null;

  return money(moeda, valor * pessoas);
}

function Resumo({
  itens,
}: {
  itens: { label: string; value: string | null }[];
}) {
  const validos = itens.filter((item) => item.value);
  if (validos.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-8 gap-y-3 rounded-xl bg-brand-navy/5 px-4 py-3">
      {validos.map((item) => (
        <div key={item.label}>
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-subtle">
            {item.label}
          </p>
          <p className="text-sm font-semibold text-brand-navy">{item.value}</p>
        </div>
      ))}
    </div>
  );
}

function resumoVoo(values: FormValues) {
  return (
    <Resumo
      itens={[
        { label: "Duração", value: duracao(values.partida, values.chegada) },
        {
          label: "Total",
          value: totalLinha(values.moeda, values.valor_unitario, values.pax),
        },
      ]}
    />
  );
}

function resumoTransporte(values: FormValues) {
  return (
    <Resumo
      itens={[
        {
          label: "Total",
          value: totalLinha(
            values.moeda,
            values.preco_unitario,
            values.quantidade_pessoas
          ),
        },
      ]}
    />
  );
}

function resumoPasseio(values: FormValues) {
  return (
    <Resumo
      itens={[
        {
          label: "Total",
          value: totalLinha(
            values.moeda,
            values.valor_unitario,
            values.qtd_pessoas
          ),
        },
      ]}
    />
  );
}

function Feedback({ state }: { state: CenarioFormState }) {
  if (!state?.error) return null;

  return (
    <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-brand-red">
      {state.error}
    </p>
  );
}

function CenarioFields({ cenario }: { cenario?: Cenario }) {
  return (
    <>
      <div className="sm:col-span-2">
        <label className={labelClass}>Destino</label>
        <input
          name="destino"
          required
          maxLength={120}
          defaultValue={cenario?.destino}
          placeholder="Ex.: Orlando"
          className={fieldClass}
        />
      </div>
      <div>
        <label className={labelClass}>Início</label>
        <input
          name="data_inicio"
          type="date"
          required
          defaultValue={cenario?.data_inicio}
          className={fieldClass}
        />
      </div>
      <div>
        <label className={labelClass}>Fim</label>
        <input
          name="data_fim"
          type="date"
          required
          defaultValue={cenario?.data_fim}
          className={fieldClass}
        />
      </div>
    </>
  );
}

const TABS = [
  { key: "voos", label: "Voos" },
  { key: "transporte", label: "Transporte" },
  { key: "passeios", label: "Passeios" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function tituloCenario(cenario: Cenario) {
  return cenario.hotel_nome
    ? `${cenario.destino} · ${cenario.hotel_nome}`
    : cenario.destino;
}

function CenarioCard({ cenario }: { cenario: Cenario }) {
  const [editing, setEditing] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [itens, setItens] = useState<TabKey | null>(null);

  const voos = cenario.voos ?? [];
  const transporte = cenario.transporte ?? [];
  const passeios = cenario.passeios ?? [];

  return (
    <>
      <article className="flex flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-sm transition duration-300 ease-out-expo hover:-translate-y-0.5 hover:shadow-lg">
        <div className="h-1 bg-gradient-to-r from-brand-navy via-brand-blue to-brand-yellow" />

        <div className="flex flex-1 flex-col gap-4 p-5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold text-brand-navy">
                {tituloCenario(cenario)}
              </h3>
              <p className="text-xs text-muted">
                {periodo(cenario.data_inicio, cenario.data_fim)}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <CardIcon label="Editar cenário" onClick={() => setEditing(true)}>
                <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
              </CardIcon>
              <CardIcon
                label="Excluir cenário"
                danger
                onClick={() => setRemoving(true)}
              >
                <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6" />
              </CardIcon>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {TABS.map((tab) => {
              const total = { voos, transporte, passeios }[tab.key].length;

              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setItens(tab.key)}
                  className="rounded-xl border border-line bg-surface-muted px-2 py-2.5 text-center transition duration-200 ease-out-expo hover:-translate-y-0.5 hover:border-brand-blue hover:bg-brand-blue/5"
                >
                  <span className="block text-lg font-semibold text-brand-navy">
                    {total}
                  </span>
                  <span className="block text-[11px] font-medium text-muted">
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setItens("voos")}
            className="mt-auto rounded-lg bg-brand-navy px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-brand-blue"
          >
            Gerenciar itens
          </button>
        </div>
      </article>

      <CenarioModal
        open={editing}
        onClose={() => setEditing(false)}
        cenario={cenario}
      />

      <ExcluirCenarioModal
        open={removing}
        onClose={() => setRemoving(false)}
        cenario={cenario}
      />

      <ItensModal
        cenario={cenario}
        tab={itens}
        onTabChange={setItens}
        onClose={() => setItens(null)}
      />
    </>
  );
}

function ItensModal({
  cenario,
  tab,
  onTabChange,
  onClose,
}: {
  cenario: Cenario;
  tab: TabKey | null;
  onTabChange: (tab: TabKey) => void;
  onClose: () => void;
}) {
  return (
    <Modal
      open={tab !== null}
      onClose={onClose}
      title={`Itens · ${tituloCenario(cenario)}`}
      description={periodo(cenario.data_inicio, cenario.data_fim)}
      size="lg"
    >
      <div className="mb-4 flex gap-1 rounded-2xl bg-surface-sunken p-1">
        {TABS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => onTabChange(item.key)}
            className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition ${
              tab === item.key
                ? "bg-surface text-brand-navy shadow-sm"
                : "text-muted hover:text-foreground"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "voos" && (
        <ItensCenario
          addLabel="Adicionar voo"
          emptyMessage="Nenhum voo neste cenário."
          fields={VOO_FIELDS}
          items={cenario.voos ?? []}
          cenarioId={cenario.id}
          saveAction={saveVoo}
          deleteAction={deleteVoo}
          describe={descreverVoo}
          summary={resumoVoo}
        />
      )}

      {tab === "transporte" && (
        <ItensCenario
          addLabel="Adicionar transporte"
          emptyMessage="Nenhum transporte neste cenário."
          fields={TRANSPORTE_FIELDS}
          items={cenario.transporte ?? []}
          cenarioId={cenario.id}
          saveAction={saveTransporte}
          deleteAction={deleteTransporte}
          describe={descreverTransporte}
          summary={resumoTransporte}
        />
      )}

      {tab === "passeios" && (
        <ItensCenario
          addLabel="Adicionar passeio"
          emptyMessage="Nenhum passeio neste cenário."
          fields={PASSEIO_FIELDS}
          items={cenario.passeios ?? []}
          cenarioId={cenario.id}
          saveAction={savePasseio}
          deleteAction={deletePasseio}
          describe={descreverPasseio}
          summary={resumoPasseio}
        />
      )}
    </Modal>
  );
}

function CenarioModal({
  open,
  onClose,
  cenario,
  clienteId,
}: {
  open: boolean;
  onClose: () => void;
  cenario?: Cenario;
  clienteId?: number;
}) {
  const [state, formAction, pending] = useActionState<
    CenarioFormState,
    FormData
  >(cenario ? updateCenario : createCenario, undefined);
  const toast = useToast();

  useEffect(() => {
    if (state?.success) {
      toast(state.success);
      onClose();
    }
  }, [state, toast, onClose]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={cenario ? "Editar cenário" : "Novo cenário"}
      description={cenario?.destino}
    >
      <form action={formAction} className="grid gap-4 sm:grid-cols-4">
        {cenario ? (
          <input type="hidden" name="id" value={cenario.id} />
        ) : (
          <input type="hidden" name="cliente_id" value={clienteId} />
        )}

        <CenarioFields cenario={cenario} />

        <div className="sm:col-span-4">
          <Feedback state={state} />
          <div className="mt-3 flex justify-end gap-2 border-t border-line pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-sm font-medium text-muted transition hover:bg-surface-sunken hover:text-foreground"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-brand-navy px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-blue disabled:opacity-60"
            >
              {pending ? "Salvando..." : cenario ? "Salvar" : "Criar cenário"}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

function ExcluirCenarioModal({
  open,
  onClose,
  cenario,
}: {
  open: boolean;
  onClose: () => void;
  cenario: Cenario;
}) {
  const [state, formAction, pending] = useActionState<
    CenarioFormState,
    FormData
  >(deleteCenario, undefined);
  const toast = useToast();

  useEffect(() => {
    if (state?.success) {
      toast(state.success);
      onClose();
    }
  }, [state, toast, onClose]);

  const itens =
    (cenario.voos?.length ?? 0) +
    (cenario.transporte?.length ?? 0) +
    (cenario.passeios?.length ?? 0);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Excluir cenário"
      size="sm"
    >
      <p className="text-sm text-muted">
        Excluir <strong>{tituloCenario(cenario)}</strong>? Esta ação não pode ser
        desfeita.
      </p>

      {itens > 0 && (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Este cenário tem {itens} item(ns) vinculado(s). Remova-os antes, senão
          a exclusão será recusada pelo banco.
        </p>
      )}

      <form action={formAction} className="mt-5">
        <input type="hidden" name="id" value={cenario.id} />
        <Feedback state={state} />
        <div className="mt-3 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm font-medium text-muted transition hover:bg-surface-sunken hover:text-foreground"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-brand-red px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
          >
            {pending ? "Excluindo..." : "Excluir"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function CardIcon({
  label,
  onClick,
  danger = false,
  children,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`rounded-lg p-1.5 text-subtle transition hover:bg-surface-sunken ${
        danger ? "hover:text-brand-red" : "hover:text-brand-navy"
      }`}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {children}
      </svg>
    </button>
  );
}

export function CenariosSection({
  clienteId,
  cenarios,
}: {
  clienteId: number;
  cenarios: Cenario[];
}) {
  const [criando, setCriando] = useState(false);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-brand-navy">Cenários</h2>
          <p className="text-sm text-muted">
            Destinos, períodos e os itens de cada proposta.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setCriando(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-red px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-brand-navy"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          Novo cenário
        </button>
      </div>

      {cenarios.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line-strong bg-surface px-4 py-10 text-center text-sm text-muted">
          Nenhum cenário ainda. Crie o primeiro para montar a proposta.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cenarios.map((cenario) => (
            <CenarioCard key={cenario.id} cenario={cenario} />
          ))}
        </div>
      )}

      <CenarioModal
        open={criando}
        onClose={() => setCriando(false)}
        clienteId={clienteId}
      />
    </section>
  );
}
