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
  type ItemRecord,
  type ItemSummary,
} from "./itens-cenario";

export type Cenario = {
  id: number;
  cliente_id: number;
  destino: string;
  data_inicio: string;
  data_fim: string;
  voos?: ItemRecord[] | null;
  transporte?: ItemRecord[] | null;
  passeios?: ItemRecord[] | null;
};

const fieldClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/30";

const labelClass = "mb-1 block text-xs font-medium text-zinc-600";

const VOO_FIELDS: FieldDef[] = [
  { name: "companhia", label: "Companhia", maxLength: 120 },
  { name: "origem", label: "Origem", required: true, maxLength: 100 },
  { name: "destino", label: "Destino", required: true, maxLength: 100 },
  {
    name: "partida",
    label: "Partida",
    type: "datetime-local",
    required: true,
  },
  { name: "chegada", label: "Chegada", type: "datetime-local" },
  { name: "escalas", label: "Escalas", type: "number", min: "0" },
  {
    name: "aeroporto_escala",
    label: "Aeroporto de escala",
    maxLength: 160,
    span: "sm:col-span-2",
  },
  { name: "tempo_escala", label: "Tempo de escala", maxLength: 40 },
  { name: "moeda", label: "Moeda", maxLength: 3, newValue: "BRL" },
  {
    name: "valor_unitario",
    label: "Valor unitário",
    type: "number",
    step: "0.01",
    min: "0",
  },
  { name: "pax", label: "Pax", type: "number", min: "1", newValue: "1" },
  { name: "status", label: "Status", maxLength: 40 },
  {
    name: "link",
    label: "Link",
    type: "url",
    maxLength: 500,
    span: "sm:col-span-4",
  },
];

const TRANSPORTE_FIELDS: FieldDef[] = [
  { name: "origem", label: "Origem", required: true, maxLength: 120 },
  { name: "destino", label: "Destino", required: true, maxLength: 120 },
  { name: "fornecedor", label: "Fornecedor", required: true, maxLength: 160 },
  { name: "status", label: "Status", required: true, maxLength: 40 },
  {
    name: "moeda",
    label: "Moeda",
    required: true,
    maxLength: 3,
    newValue: "BRL",
  },
  {
    name: "preco_unitario",
    label: "Preço unitário",
    type: "number",
    step: "0.01",
    min: "0",
    required: true,
  },
  {
    name: "quantidade_pessoas",
    label: "Pessoas",
    type: "number",
    min: "1",
    required: true,
    newValue: "1",
  },
];

const PASSEIO_FIELDS: FieldDef[] = [
  {
    name: "descricao",
    label: "Descrição",
    required: true,
    maxLength: 200,
    span: "sm:col-span-2",
  },
  { name: "cidade", label: "Cidade", required: true, maxLength: 100 },
  { name: "fornecedor", label: "Fornecedor", required: true, maxLength: 160 },
  {
    name: "moeda",
    label: "Moeda",
    required: true,
    maxLength: 3,
    newValue: "BRL",
  },
  {
    name: "valor_unitario",
    label: "Valor unitário",
    type: "number",
    step: "0.01",
    min: "0",
    required: true,
  },
  {
    name: "qtd_pessoas",
    label: "Pessoas",
    type: "number",
    min: "1",
    required: true,
    newValue: "1",
  },
  { name: "transfer", label: "Transfer incluso", type: "checkbox" },
  {
    name: "link",
    label: "Link",
    type: "url",
    maxLength: 500,
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

function CenarioCard({ cenario }: { cenario: Cenario }) {
  const [editing, setEditing] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [itens, setItens] = useState<TabKey | null>(null);

  const voos = cenario.voos ?? [];
  const transporte = cenario.transporte ?? [];
  const passeios = cenario.passeios ?? [];

  return (
    <>
      <article className="flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:shadow-md">
        <div className="h-1 bg-gradient-to-r from-brand-navy via-brand-blue to-brand-yellow" />

        <div className="flex flex-1 flex-col gap-4 p-5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold text-brand-navy">
                {cenario.destino}
              </h3>
              <p className="text-xs text-zinc-500">
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
                  className="rounded-xl border border-zinc-200 bg-zinc-50 px-2 py-2.5 text-center transition hover:border-brand-blue hover:bg-brand-blue/5"
                >
                  <span className="block text-lg font-semibold text-brand-navy">
                    {total}
                  </span>
                  <span className="block text-[11px] font-medium text-zinc-500">
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
      title={`Itens · ${cenario.destino}`}
      description={periodo(cenario.data_inicio, cenario.data_fim)}
      size="lg"
    >
      <div className="mb-4 flex gap-1 rounded-xl bg-zinc-100 p-1">
        {TABS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => onTabChange(item.key)}
            className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition ${
              tab === item.key
                ? "bg-white text-brand-navy shadow-sm"
                : "text-zinc-500 hover:text-zinc-800"
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
          <div className="mt-3 flex justify-end gap-2 border-t border-zinc-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100"
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
      <p className="text-sm text-zinc-700">
        Excluir <strong>{cenario.destino}</strong>? Esta ação não pode ser
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
            className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100"
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
      className={`rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-100 ${
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
          <p className="text-sm text-zinc-600">
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
        <p className="rounded-2xl border border-dashed border-zinc-300 bg-white px-4 py-10 text-center text-sm text-zinc-500">
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
