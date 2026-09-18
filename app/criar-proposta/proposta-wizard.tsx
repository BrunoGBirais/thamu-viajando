"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { gerarProposta } from "@/app/proposta/actions";
import { dadosDoCenario } from "./actions";
import { Button } from "@/app/components/ui/button";
import { Field, Input, Select, Textarea } from "@/app/components/ui/form";
import {
  camposEditaveis,
  chaveDoCampo,
  valorCalculado,
  type Campo,
  type CampoTexto,
  type DadosProposta,
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

export type Inicial = {
  clienteId: string;
  cenarioId: string;
  templateId: string;
  dados: DadosProposta | null;
};

export function PropostaWizard({
  clientes,
  templates,
  valoresSalvos,
  inicial,
}: {
  clientes: ClienteOpcao[];
  templates: TemplateOpcao[];
  valoresSalvos: Record<string, ValoresManuais>;
  inicial?: Inicial;
}) {
  const [clienteId, setClienteId] = useState(inicial?.clienteId ?? "");
  const [cenarioId, setCenarioId] = useState(inicial?.cenarioId ?? "");
  const [templateId, setTemplateId] = useState(inicial?.templateId ?? "");

  const cliente = useMemo(
    () => clientes.find((item) => String(item.id) === clienteId),
    [clientes, clienteId]
  );
  const cenario = cliente?.cenarios.find((item) => String(item.id) === cenarioId);
  const template = templates.find((item) => String(item.id) === templateId);

  const editaveis = useMemo(
    () => camposEditaveis(template?.campos ?? []),
    [template]
  );

  const pronto = Boolean(cliente && cenario && template);
  const chaveSalvos = `${cenarioId}:${templateId}`;
  const [valores, setValores] = useState<ValoresManuais>({});
  const [dados, setDados] = useState<DadosProposta | null>(
    inicial?.dados ?? null
  );
  const [carregando, setCarregando] = useState(false);

  // Reabrir a mesma proposta/template traz de volta o que já foi digitado:
  // ajusta o estado durante a renderização quando a combinação muda.
  const [chaveCarregada, setChaveCarregada] = useState(chaveSalvos);

  if (chaveCarregada !== chaveSalvos) {
    setChaveCarregada(chaveSalvos);
    setValores(valoresSalvos[chaveSalvos] ?? {});
  }

  // Os valores automáticos vêm do mesmo lugar que a proposta impressa.
  const escolherCenario = useCallback(async (id: string) => {
    setCenarioId(id);
    setDados(null);

    if (!id) return;

    setCarregando(true);
    try {
      setDados(await dadosDoCenario(Number(id)));
    } finally {
      setCarregando(false);
    }
  }, []);

  const escrever = (chave: string, texto: string) =>
    setValores((atual) => ({ ...atual, [chave]: texto }));

  // Remover a chave devolve o campo ao valor automático do cenário.
  const restaurar = (chave: string) =>
    setValores((atual) => {
      const proximo = { ...atual };
      delete proximo[chave];
      return proximo;
    });

  return (
    <div className="space-y-4">
      <Etapa numero={1} titulo="Cliente" concluida={Boolean(cliente)}>
        <Select
          value={clienteId}
          onChange={(event) => {
            setClienteId(event.target.value);
            escolherCenario("");
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
            onChange={(event) => escolherCenario(event.target.value)}
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
            <code className="rounded bg-surface-sunken px-1.5 py-0.5 font-mono text-[0.8125rem] text-brand-navy">
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

        <input type="hidden" name="valores" value={JSON.stringify(valores)} />

        {template && editaveis.length > 0 ? (
          <Etapa numero={4} titulo="Textos da proposta">
            <p className="mb-4 text-sm text-muted">
              Cada campo vem preenchido com o dado do cenário. Corrija o que
              quiser, apague o que não deve sair no papel ou volte ao automático.
              {carregando ? " Carregando os dados do cenário…" : ""}
            </p>
            <div className="space-y-4">
              {editaveis.map((campo) => {
                const chave = chaveDoCampo(campo);
                const automatico = dados ? valorCalculado(dados, campo) : "";
                const editado = chave in valores;

                return (
                  <CampoDaProposta
                    key={chave}
                    campo={campo}
                    valor={editado ? valores[chave] : automatico}
                    automatico={automatico}
                    editado={editado}
                    onChange={(texto) => escrever(chave, texto)}
                    onLimpar={() => escrever(chave, "")}
                    onRestaurar={() => restaurar(chave)}
                  />
                );
              })}
            </div>
          </Etapa>
        ) : null}

        <div className="sticky bottom-4 flex flex-col gap-3 rounded-2xl bg-brand-navy p-4 pl-5 text-white shadow-xl sm:flex-row sm:items-center sm:justify-between">
          <p className="text-white/75">
            {pronto ? (
              <span className="font-semibold text-white">
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

// Nome do campo em linguagem de agência; cai no caminho só se não houver rótulo.
function rotuloDoCampo(campo: CampoTexto) {
  if (campo.rotulo) return campo.rotulo;

  const caminho = campo.campo ?? "";
  const coluna = caminho.startsWith("proposta.")
    ? caminho.slice("proposta.".length)
    : caminho;
  const texto = coluna.replace(/_/g, " ").replace(/\./g, " · ");

  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function CampoDaProposta({
  campo,
  valor,
  automatico,
  editado,
  onChange,
  onLimpar,
  onRestaurar,
}: {
  campo: CampoTexto;
  valor: string;
  automatico: string;
  editado: boolean;
  onChange: (texto: string) => void;
  onLimpar: () => void;
  onRestaurar: () => void;
}) {
  const chave = chaveDoCampo(campo);
  const limite = campo.maxCaracteres ?? 500;
  const multilinha = limite > 120;
  const id = `campo_${chave}`;

  return (
    <Field
      label={
        <span className="flex items-center gap-2">
          {rotuloDoCampo(campo)}
          {editado ? (
            <span className="rounded-full bg-brand-yellow px-2 py-0.5 text-[0.6875rem] font-bold uppercase tracking-wide text-brand-navy">
              {valor === "" ? "apagado" : "editado"}
            </span>
          ) : null}
        </span>
      }
      htmlFor={id}
      hint={
        <span className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2">
            {campo.descricao}
            <button
              type="button"
              onClick={onLimpar}
              className="font-semibold text-brand-navy underline-offset-2 hover:underline"
            >
              Apagar
            </button>
            {editado ? (
              <button
                type="button"
                onClick={onRestaurar}
                className="font-semibold text-brand-navy underline-offset-2 hover:underline"
              >
                Voltar ao automático
                {automatico ? ` (${automatico})` : ""}
              </button>
            ) : null}
          </span>
          <span
            className={
              valor.length >= limite
                ? "font-semibold tabular-nums text-[#b3241c]"
                : "tabular-nums"
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
              className={`group w-[calc(50%-0.5rem)] flex-none snap-start overflow-hidden rounded-xl border-2 bg-surface text-left transition-colors duration-150 sm:w-[calc(33.333%-0.667rem)] lg:w-[calc(25%-0.75rem)] ${
                ativo
                  ? "border-brand-navy"
                  : "border-line hover:border-line-strong"
              }`}
            >
              <div className="relative aspect-[4/5] w-full overflow-hidden bg-surface-sunken">
                {item.paginas[0] ? (
                  <Image
                    src={item.paginas[0]}
                    alt={item.nome}
                    fill
                    sizes="(max-width: 640px) 50vw, 25vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-subtle">
                    Sem prévia
                  </div>
                )}
                {ativo ? (
                  <span className="animate-pop absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-brand-yellow text-brand-navy shadow-md">
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
              <p
                className={`truncate px-3.5 py-3 font-semibold ${
                  ativo ? "bg-brand-navy text-white" : "text-brand-navy"
                }`}
              >
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
      className={`absolute top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-line-strong bg-surface text-brand-navy shadow-md transition-colors hover:bg-surface-muted ${
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
    <section className="rounded-2xl border border-line bg-surface p-5 shadow-xs sm:p-6">
      <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-brand-navy">
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-full font-display text-base font-bold tabular-nums transition-colors ${
            concluida
              ? "bg-brand-yellow text-brand-navy"
              : "border-2 border-brand-navy text-brand-navy"
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
