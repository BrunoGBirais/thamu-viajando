"use client";

import { useCallback } from "react";
import {
  FAMILIAS,
  itensDaLista,
  renderLinha,
  valorDoCampo,
  type Campo,
  type CampoLista,
  type CampoTexto,
  type DadosProposta,
  type PropostaTemplate,
} from "@/lib/proposta/template";

export type EditorDocumento = {
  selecionado: number | null;
  selecionar: (indice: number) => void;
  mover: (indice: number, x: number, y: number) => void;
  redimensionar: (indice: number, w: number) => void;
};

// Tudo é posicionado em % da página e as fontes usam cqw (% da largura do
// container), então o documento escala igual na tela e na impressão.
export function PropostaDocumento({
  template,
  dados,
  editor,
}: {
  template: PropostaTemplate;
  dados: DadosProposta;
  editor?: EditorDocumento;
}) {
  const largura = Number(template.largura_mm);
  const altura = Number(template.altura_mm);

  return (
    <>
      <style>{`@page { size: ${largura}mm ${altura}mm; margin: 0; }`}</style>

      <div className="mx-auto w-full max-w-[900px] space-y-6 print:max-w-none print:space-y-0">
        {template.paginas.map((fundo, indice) => (
          <div
            key={indice}
            style={{ containerType: "inline-size" }}
            className="relative w-full overflow-hidden bg-white shadow-lg print:break-after-page print:shadow-none"
          >
            {/* A imagem define a altura da página, então a proporção é sempre a do arquivo. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={fundo} alt="" className="block h-auto w-full" />

            {template.campos.map((campo, posicao) =>
              (campo.pagina ?? 1) === indice + 1 ? (
                <CampoRender
                  key={posicao}
                  indice={posicao}
                  campo={campo}
                  dados={dados}
                  editor={editor}
                />
              ) : null
            )}
          </div>
        ))}
      </div>
    </>
  );
}

function estiloBase(campo: Campo) {
  return {
    left: `${campo.x}%`,
    top: `${campo.y}%`,
    width: campo.w ? `${campo.w}%` : undefined,
    fontSize: `${campo.fontSize ?? 2.5}cqw`,
    fontFamily: FAMILIAS[campo.familia ?? "open-sans"],
    color: campo.cor ?? "#1b2a4a",
    fontWeight: campo.peso ?? 400,
    textAlign: campo.align ?? "left",
  } as const;
}

function arredondar(valor: number) {
  return Math.min(120, Math.max(-20, Math.round(valor * 10) / 10));
}

function arredondarLargura(valor: number) {
  return Math.min(120, Math.max(1, Math.round(valor * 10) / 10));
}

function useArrasto(indice: number, editor?: EditorDocumento) {
  return useCallback(
    (evento: React.PointerEvent<HTMLDivElement>) => {
      if (!editor) return;

      evento.preventDefault();
      editor.selecionar(indice);

      const alvo = evento.currentTarget;
      const pagina = alvo.parentElement;
      if (!pagina) return;

      const areaPagina = pagina.getBoundingClientRect();
      const areaCampo = alvo.getBoundingClientRect();
      const deslocX = evento.clientX - areaCampo.left;
      const deslocY = evento.clientY - areaCampo.top;

      const mover = (e: PointerEvent) => {
        const x =
          ((e.clientX - deslocX - areaPagina.left) / areaPagina.width) * 100;
        const y =
          ((e.clientY - deslocY - areaPagina.top) / areaPagina.height) * 100;
        editor.mover(indice, arredondar(x), arredondar(y));
      };

      const soltar = () => {
        window.removeEventListener("pointermove", mover);
        window.removeEventListener("pointerup", soltar);
      };

      window.addEventListener("pointermove", mover);
      window.addEventListener("pointerup", soltar);
    },
    [editor, indice]
  );
}

function useRedimensionamento(indice: number, editor?: EditorDocumento) {
  return useCallback(
    (evento: React.PointerEvent<HTMLSpanElement>) => {
      if (!editor) return;

      evento.preventDefault();
      evento.stopPropagation();
      editor.selecionar(indice);

      const campo = evento.currentTarget.parentElement;
      const pagina = campo?.parentElement;
      if (!campo || !pagina) return;

      const areaPagina = pagina.getBoundingClientRect();
      const esquerda = campo.getBoundingClientRect().left;

      const redimensionar = (e: PointerEvent) => {
        const w = ((e.clientX - esquerda) / areaPagina.width) * 100;
        editor.redimensionar(indice, arredondarLargura(w));
      };

      const soltar = () => {
        window.removeEventListener("pointermove", redimensionar);
        window.removeEventListener("pointerup", soltar);
      };

      window.addEventListener("pointermove", redimensionar);
      window.addEventListener("pointerup", soltar);
    },
    [editor, indice]
  );
}

function CampoRender({
  indice,
  campo,
  dados,
  editor,
}: {
  indice: number;
  campo: Campo;
  dados: DadosProposta;
  editor?: EditorDocumento;
}) {
  const arrastar = useArrasto(indice, editor);
  const esticar = useRedimensionamento(indice, editor);

  const lista = campo.tipo === "lista";
  const corpo = lista
    ? conteudoLista(campo as CampoLista, dados)
    : conteudoTexto(campo as CampoTexto, dados);

  if (!corpo && !editor) return null;

  const rotulo =
    campo.rotulo ||
    (lista
      ? `lista · ${(campo as CampoLista).fonte}`
      : (campo as CampoTexto).campo);

  return (
    <div
      onPointerDown={arrastar}
      style={{
        ...estiloBase(campo),
        lineHeight: lista ? (campo as CampoLista).espacamento ?? 1.6 : 1.2,
      }}
      className={`absolute ${
        editor
          ? `cursor-move outline-dashed outline-1 ${
              editor.selecionado === indice
                ? "bg-brand-navy/10 outline-2 outline-brand-navy"
                : "outline-zinc-400"
            }`
          : ""
      }`}
    >
      {corpo ?? <span className="opacity-40">{rotulo}</span>}

      {editor ? (
        <span
          onPointerDown={esticar}
          title="Arraste para ajustar a largura"
          className="absolute top-0 -right-1 h-full w-2 cursor-ew-resize bg-brand-navy/0 hover:bg-brand-navy/40"
        />
      ) : null}
    </div>
  );
}

function conteudoTexto(campo: CampoTexto, dados: DadosProposta) {
  const texto = valorDoCampo(dados, campo);
  if (!texto) return null;

  return <span className="whitespace-pre-wrap">{texto}</span>;
}

function conteudoLista(campo: CampoLista, dados: DadosProposta) {
  const itens = itensDaLista(dados, campo);
  if (itens.length === 0) return null;

  return (
    <ul>
      {itens.map((item, indice) => (
        <li key={indice} className="truncate">
          {renderLinha(item, campo.linha)}
        </li>
      ))}
    </ul>
  );
}
