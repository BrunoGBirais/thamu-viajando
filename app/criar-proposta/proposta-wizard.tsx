"use client";

import Image from "next/image";
import {
  useActionState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Template } from "@/lib/n8n/templates";
import { criarProposta, type PropostaFormState } from "./actions";

export type CenarioOpcao = {
  id: number;
  destino: string;
  data_inicio: string | null;
  data_fim: string | null;
  hotel_nome: string | null;
};

export type ClienteOpcao = {
  id: number;
  nome: string;
  cenarios: CenarioOpcao[];
};

const fieldClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/30";

// Colunas DATE chegam como "YYYY-MM-DD"; evita o deslocamento de fuso do Date.
function formatDate(value: string | null) {
  if (!value) return null;
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function rotuloCenario(cenario: CenarioOpcao) {
  const titulo = cenario.hotel_nome
    ? `${cenario.destino} · ${cenario.hotel_nome}`
    : cenario.destino;
  const inicio = formatDate(cenario.data_inicio);
  const fim = formatDate(cenario.data_fim);

  if (!inicio && !fim) return titulo;
  return `${titulo} (${inicio ?? "?"} a ${fim ?? "?"})`;
}

export function PropostaWizard({
  clientes,
  templates,
  templatesError,
}: {
  clientes: ClienteOpcao[];
  templates: Template[];
  templatesError?: string;
}) {
  const [clienteId, setClienteId] = useState("");
  const [cenarioId, setCenarioId] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [state, formAction, pending] = useActionState<
    PropostaFormState,
    FormData
  >(criarProposta, undefined);

  const cliente = useMemo(
    () => clientes.find((item) => String(item.id) === clienteId),
    [clientes, clienteId]
  );
  const cenario = cliente?.cenarios.find((item) => String(item.id) === cenarioId);
  const template = templates.find((item) => item.id === templateId);

  const pronto = Boolean(cliente && cenario && template);

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="cliente_id" value={clienteId} />
      <input type="hidden" name="cenario_id" value={cenarioId} />
      <input type="hidden" name="template_id" value={templateId} />

      <Etapa numero={1} titulo="Cliente">
        <select
          value={clienteId}
          onChange={(event) => {
            setClienteId(event.target.value);
            setCenarioId("");
          }}
          className={fieldClass}
        >
          <option value="">Selecione o cliente</option>
          {clientes.map((item) => (
            <option key={item.id} value={item.id}>
              {item.nome}
              {item.cenarios.length === 0 ? " (sem propostas)" : ""}
            </option>
          ))}
        </select>
      </Etapa>

      <Etapa numero={2} titulo="Proposta">
        {!cliente ? (
          <p className="text-sm text-zinc-500">Selecione um cliente primeiro.</p>
        ) : cliente.cenarios.length === 0 ? (
          <p className="text-sm text-zinc-500">
            Este cliente ainda não tem propostas cadastradas.
          </p>
        ) : (
          <select
            value={cenarioId}
            onChange={(event) => setCenarioId(event.target.value)}
            className={fieldClass}
          >
            <option value="">Selecione a proposta</option>
            {cliente.cenarios.map((item) => (
              <option key={item.id} value={item.id}>
                {rotuloCenario(item)}
              </option>
            ))}
          </select>
        )}
      </Etapa>

      <Etapa numero={3} titulo="Template do Canva">
        {templatesError ? (
          <p className="text-sm text-brand-red">{templatesError}</p>
        ) : templates.length === 0 ? (
          <p className="text-sm text-zinc-500">
            Nenhum template encontrado na pasta do Canva.
          </p>
        ) : (
          <TemplateCarousel
            templates={templates}
            selectedId={templateId}
            onSelect={setTemplateId}
          />
        )}
      </Etapa>

      {state?.error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-brand-red">
          {state.error}
        </div>
      )}

      {state?.success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          {state.success}
          {state.propostaUrl && (
            <a
              href={state.propostaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-1 font-semibold underline"
            >
              Abrir no Canva
            </a>
          )}
        </div>
      )}

      <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-zinc-600">
          {pronto
            ? `${cliente!.nome} · ${rotuloCenario(cenario!)} · ${template!.title}`
            : "Escolha cliente, proposta e template para continuar."}
        </p>
        <button
          type="submit"
          disabled={!pronto || pending}
          className="rounded-lg bg-brand-blue px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Enviando..." : "Criar proposta"}
        </button>
      </div>
    </form>
  );
}

function TemplateCarousel({
  templates,
  selectedId,
  onSelect,
}: {
  templates: Template[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const updateBounds = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;

    setAtStart(track.scrollLeft <= 1);
    setAtEnd(track.scrollLeft + track.clientWidth >= track.scrollWidth - 1);
  }, []);

  useEffect(updateBounds, [updateBounds, templates]);

  function scroll(direction: -1 | 1) {
    const track = trackRef.current;
    if (!track) return;

    track.scrollBy({ left: direction * track.clientWidth, behavior: "smooth" });
  }

  return (
    <div className="relative">
      <div
        ref={trackRef}
        onScroll={updateBounds}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {templates.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.id)}
            aria-pressed={item.id === selectedId}
            className={`w-[calc(50%-0.5rem)] flex-none snap-start overflow-hidden rounded-xl border bg-white text-left shadow-sm transition sm:w-[calc(33.333%-0.667rem)] lg:w-[calc(25%-0.75rem)] ${
              item.id === selectedId
                ? "border-brand-blue ring-2 ring-brand-blue/30"
                : "border-zinc-200 hover:border-brand-blue"
            }`}
          >
            <div className="relative aspect-[4/5] w-full bg-zinc-100">
              {item.thumbnailUrl ? (
                <Image
                  src={item.thumbnailUrl}
                  alt={item.title}
                  fill
                  sizes="(max-width: 640px) 50vw, 25vw"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-zinc-400">
                  Sem prévia
                </div>
              )}
            </div>
            <p className="truncate p-3 text-sm font-medium text-brand-navy">
              {item.title}
            </p>
          </button>
        ))}
      </div>

      <CarouselArrow
        direction={-1}
        hidden={atStart}
        onClick={() => scroll(-1)}
      />
      <CarouselArrow direction={1} hidden={atEnd} onClick={() => scroll(1)} />
    </div>
  );
}

function CarouselArrow({
  direction,
  hidden,
  onClick,
}: {
  direction: -1 | 1;
  hidden: boolean;
  onClick: () => void;
}) {
  if (hidden) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === -1 ? "Anterior" : "Próximo"}
      className={`absolute top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-zinc-200 bg-white text-brand-navy shadow-md transition hover:border-brand-blue hover:text-brand-blue ${
        direction === -1 ? "left-1" : "right-1"
      }`}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <path d={direction === -1 ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"} />
      </svg>
    </button>
  );
}

function Etapa({
  numero,
  titulo,
  children,
}: {
  numero: number;
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-brand-navy">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-navy text-xs text-white">
          {numero}
        </span>
        {titulo}
      </h2>
      {children}
    </section>
  );
}
