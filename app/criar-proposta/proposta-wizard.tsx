"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { gerarProposta } from "@/app/proposta/actions";
import { Button } from "@/app/components/ui/button";
import { Field, Input, Select, Textarea } from "@/app/components/ui/form";
import {
  camposManuais,
  chaveDoCampo,
  type Campo,
  type CampoTexto,
  type ValoresManuais,
} from "@/lib/proposta/template";

export type TemplateOpcao = {
  id: number;
  nome: string;
  paginas: string[];
  campos: Campo[];
};

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
  valoresSalvos,
}: {
  clientes: ClienteOpcao[];
  templates: TemplateOpcao[];
  valoresSalvos: Record<string, ValoresManuais>;
}) {
  const [clienteId, setClienteId] = useState("");
  const [cenarioId, setCenarioId] = useState("");
  const [templateId, setTemplateId] = useState("");

  const cliente = useMemo(
    () => clientes.find((item) => String(item.id) === clienteId),
    [clientes, clienteId]
  );
  const cenario = cliente?.cenarios.find((item) => String(item.id) === cenarioId);
  const template = templates.find((item) => String(item.id) === templateId);

  const manuais = useMemo(
    () => camposManuais(template?.campos ?? []),
    [template]
  );

  const pronto = Boolean(cliente && cenario && template);
  const chaveSalvos = `${cenarioId}:${templateId}`;
  const [valores, setValores] = useState<ValoresManuais>({});

  // Reabrir a mesma proposta/template traz de volta o que já foi digitado.
  useEffect(() => {
    setValores(valoresSalvos[chaveSalvos] ?? {});
  }, [chaveSalvos, valoresSalvos]);

  return (
    <div className="space-y-4">
      <Etapa numero={1} titulo="Cliente" concluida={Boolean(cliente)}>
        <Select
          value={clienteId}
          onChange={(event) => {
            setClienteId(event.target.value);
            setCenarioId("");
          }}
        >
          <option value="">Selecione o cliente</option>
          {clientes.map((item) => (
            <option key={item.id} value={item.id}>
              {item.nome}
              {item.cenarios.length === 0 ? " (sem propostas)" : ""}
            </option>
          ))}
        </Select>
      </Etapa>

      <Etapa numero={2} titulo="Proposta" concluida={Boolean(cenario)}>
        {!cliente ? (
          <p className="text-sm text-subtle">Selecione um cliente primeiro.</p>
        ) : cliente.cenarios.length === 0 ? (
          <p className="text-sm text-subtle">
            Este cliente ainda não tem propostas cadastradas.
          </p>
        ) : (
          <Select
            value={cenarioId}
            onChange={(event) => setCenarioId(event.target.value)}
          >
            <option value="">Selecione a proposta</option>
            {cliente.cenarios.map((item) => (
              <option key={item.id} value={item.id}>
                {rotuloCenario(item)}
              </option>
            ))}
          </Select>
        )}
      </Etapa>

      <Etapa numero={3} titulo="Template" concluida={Boolean(template)}>
        {templates.length === 0 ? (
          <p className="text-sm text-subtle">
            Nenhum template cadastrado. Exporte o design do Canva, suba as
            páginas no Storage e cadastre em{" "}
            <code className="rounded bg-surface-sunken px-1.5 py-0.5 font-mono text-xs text-brand-navy">
              proposta_templates
            </code>
            .
          </p>
        ) : (
          <TemplateCarousel
            templates={templates}
            selectedId={templateId}
            onSelect={setTemplateId}
          />
        )}
      </Etapa>

      <form action={gerarProposta} className="space-y-4">
        <input type="hidden" name="cenario_id" value={cenarioId} />
        <input type="hidden" name="template_id" value={templateId} />

        {template && manuais.length > 0 ? (
          <Etapa numero={4} titulo="Preenchimento à mão">
            <div className="space-y-4">
              {manuais.map((campo) => (
                <CampoManual
                  key={chaveDoCampo(campo)}
                  campo={campo}
                  valor={valores[chaveDoCampo(campo)] ?? ""}
                  onChange={(texto) =>
                    setValores((atual) => ({
                      ...atual,
                      [chaveDoCampo(campo)]: texto,
                    }))
                  }
                />
              ))}
            </div>
          </Etapa>
        ) : null}

        <div className="sticky bottom-4 flex flex-col gap-3 rounded-2xl border border-line bg-surface/85 p-4 shadow-lg backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted">
            {pronto ? (
              <span className="font-medium text-brand-navy">
                {cliente!.nome} · {rotuloCenario(cenario!)} · {template!.nome}
              </span>
            ) : (
              "Escolha cliente, proposta e template para continuar."
            )}
          </p>
          <Button type="submit" variant="accent" size="lg" disabled={!pronto}>
            Criar proposta
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Button>
        </div>
      </form>
    </div>
  );
}

function CampoManual({
  campo,
  valor,
  onChange,
}: {
  campo: CampoTexto;
  valor: string;
  onChange: (texto: string) => void;
}) {
  const chave = chaveDoCampo(campo);
  const limite = campo.maxCaracteres ?? 500;
  const multilinha = limite > 120;
  const id = `campo_${chave}`;

  return (
    <Field
      label={campo.rotulo || chave}
      htmlFor={id}
      hint={
        <span className="flex items-center justify-between gap-3">
          <span>{campo.descricao}</span>
          <span
            className={
              valor.length >= limite ? "text-brand-red" : "tabular-nums"
            }
          >
            {valor.length}/{limite}
          </span>
        </span>
      }
    >
      {multilinha ? (
        <Textarea
          id={id}
          name={id}
          value={valor}
          maxLength={limite}
          rows={4}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <Input
          id={id}
          name={id}
          value={valor}
          maxLength={limite}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </Field>
  );
}

function TemplateCarousel({
  templates,
  selectedId,
  onSelect,
}: {
  templates: TemplateOpcao[];
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
        {templates.map((item) => {
          const ativo = String(item.id) === selectedId;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(String(item.id))}
              aria-pressed={ativo}
              className={`group w-[calc(50%-0.5rem)] flex-none snap-start overflow-hidden rounded-2xl border bg-surface text-left shadow-sm transition duration-300 ease-out-expo sm:w-[calc(33.333%-0.667rem)] lg:w-[calc(25%-0.75rem)] ${
                ativo
                  ? "-translate-y-1 border-brand-blue shadow-lg ring-2 ring-brand-blue/25"
                  : "border-line hover:-translate-y-1 hover:border-brand-blue/50 hover:shadow-md"
              }`}
            >
              <div className="relative aspect-[4/5] w-full overflow-hidden bg-surface-sunken">
                {item.paginas[0] ? (
                  <Image
                    src={item.paginas[0]}
                    alt={item.nome}
                    fill
                    sizes="(max-width: 640px) 50vw, 25vw"
                    className="object-cover transition-transform duration-500 ease-out-expo group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-subtle">
                    Sem prévia
                  </div>
                )}
                {ativo ? (
                  <span className="animate-pop absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-brand-blue text-white shadow-md">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </span>
                ) : null}
              </div>
              <p className="truncate px-3.5 py-3 text-sm font-semibold text-brand-navy">
                {item.nome}
              </p>
            </button>
          );
        })}
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
      className={`absolute top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-surface/90 text-brand-navy shadow-lg backdrop-blur-md transition hover:scale-110 hover:border-brand-blue hover:text-brand-blue ${
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
  concluida,
  children,
}: {
  numero: number;
  titulo: string;
  concluida?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      className="animate-rise rounded-2xl border border-line bg-surface p-5 shadow-sm transition duration-300 ease-out-expo hover:shadow-md"
      style={{ animationDelay: `${(numero - 1) * 60}ms` }}
    >
      <h2 className="mb-4 flex items-center gap-2.5 text-sm font-semibold text-brand-navy">
        <span
          className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition ${
            concluida
              ? "bg-brand-blue text-white"
              : "bg-surface-sunken text-brand-navy"
          }`}
        >
          {concluida ? (
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
          ) : (
            numero
          )}
        </span>
        {titulo}
      </h2>
      {children}
    </section>
  );
}
