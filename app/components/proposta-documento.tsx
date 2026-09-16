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
  type ValoresManuais,
} from "@/lib/proposta/template";

export type EditorDocumento = {
  selecionado: number | null;
  selecionar: (indice: number) => void;
  mover: (indice: number, x: number, y: number) => void;
  redimensionar: (indice: number, w: number) => void;
  girar: (indice: number, rotacao: number) => void;
};

// Tudo é posicionado em % da página e as fontes usam cqw (% da largura do
// container), então o documento escala igual na tela e na impressão.
export function PropostaDocumento({
  template,
  dados,
  valores,
  editor,
}: {
  template: PropostaTemplate;
  dados: DadosProposta;
  valores?: ValoresManuais;
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
                  valores={valores}
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
  const rotacao = campo.rotacao ?? 0;

  return {
    left: `${campo.x}%`,
    top: `${campo.y}%`,
    width: campo.w ? `${campo.w}%` : undefined,
    fontSize: `${campo.fontSize ?? 2.5}cqw`,
    fontFamily: FAMILIAS[campo.familia ?? "open-sans"],
    color: campo.cor ?? "#1b2a4a",
    fontWeight: campo.peso ?? 400,
    textAlign: campo.align ?? "left",
    // A âncora fica no canto declarado em x/y, então girar não move o campo.
    transform: rotacao ? `rotate(${rotacao}deg)` : undefined,
    transformOrigin: "top left",
  } as const;
}

function arredondar(valor: number) {
  return Math.min(120, Math.max(-20, Math.round(valor * 10) / 10));
}

function arredondarLargura(valor: number) {
  return Math.min(120, Math.max(1, Math.round(valor * 10) / 10));
}

function arredondarAngulo(valor: number) {
  const normalizado = ((valor + 180) % 360 + 360) % 360 - 180;
  return Math.round(normalizado * 10) / 10;
}

// Posição e largura virêm do deslocamento do ponteiro, não do rect: girar
// o campo muda a bounding box e faria o arraste saltar.
function useArrasto(indice: number, campo: Campo, editor?: EditorDocumento) {
  const { x, y } = campo;

  return useCallback(
    (evento: React.PointerEvent<HTMLDivElement>) => {
      if (!editor) return;

      evento.preventDefault();
      editor.selecionar(indice);

      const pagina = evento.currentTarget.parentElement;
      if (!pagina) return;

      const areaPagina = pagina.getBoundingClientRect();
      const partidaX = evento.clientX;
      const partidaY = evento.clientY;

      const mover = (e: PointerEvent) => {
        const novoX = x + ((e.clientX - partidaX) / areaPagina.width) * 100;
        const novoY = y + ((e.clientY - partidaY) / areaPagina.height) * 100;
        editor.mover(indice, arredondar(novoX), arredondar(novoY));
      };

      const soltar = () => {
        window.removeEventListener("pointermove", mover);
        window.removeEventListener("pointerup", soltar);
      };

      window.addEventListener("pointermove", mover);
      window.addEventListener("pointerup", soltar);
    },
    [editor, indice, x, y]
  );
}

function useRedimensionamento(
  indice: number,
  campo: Campo,
  editor?: EditorDocumento
) {
  const { w, rotacao } = campo;

  return useCallback(
    (evento: React.PointerEvent<HTMLSpanElement>) => {
      if (!editor) return;

      evento.preventDefault();
      evento.stopPropagation();
      editor.selecionar(indice);

      const alvo = evento.currentTarget.parentElement;
      const pagina = alvo?.parentElement;
      if (!alvo || !pagina) return;

      const areaPagina = pagina.getBoundingClientRect();
      const inicial = w ?? (alvo.offsetWidth / areaPagina.width) * 100;
      const angulo = ((rotacao ?? 0) * Math.PI) / 180;
      const partidaX = evento.clientX;
      const partidaY = evento.clientY;

      const redimensionar = (e: PointerEvent) => {
        const deltaX = e.clientX - partidaX;
        const deltaY = e.clientY - partidaY;
        const projetado =
          deltaX * Math.cos(angulo) + deltaY * Math.sin(angulo);

        editor.redimensionar(
          indice,
          arredondarLargura(inicial + (projetado / areaPagina.width) * 100)
        );
      };

      const soltar = () => {
        window.removeEventListener("pointermove", redimensionar);
        window.removeEventListener("pointerup", soltar);
      };

      window.addEventListener("pointermove", redimensionar);
      window.addEventListener("pointerup", soltar);
    },
    [editor, indice, w, rotacao]
  );
}

function useRotacao(indice: number, campo: Campo, editor?: EditorDocumento) {
  const { x, y, rotacao } = campo;

  return useCallback(
    (evento: React.PointerEvent<HTMLSpanElement>) => {
      if (!editor) return;

      evento.preventDefault();
      evento.stopPropagation();
      editor.selecionar(indice);

      const pagina = evento.currentTarget.parentElement?.parentElement;
      if (!pagina) return;

      const areaPagina = pagina.getBoundingClientRect();
      const ancoraX = areaPagina.left + (x / 100) * areaPagina.width;
      const ancoraY = areaPagina.top + (y / 100) * areaPagina.height;
      const inicial = rotacao ?? 0;
      const partida = Math.atan2(
        evento.clientY - ancoraY,
        evento.clientX - ancoraX
      );

      const girar = (e: PointerEvent) => {
        const atual = Math.atan2(e.clientY - ancoraY, e.clientX - ancoraX);
        const graus = inicial + ((atual - partida) * 180) / Math.PI;
        editor.girar(indice, arredondarAngulo(graus));
      };

      const soltar = () => {
        window.removeEventListener("pointermove", girar);
        window.removeEventListener("pointerup", soltar);
      };

      window.addEventListener("pointermove", girar);
      window.addEventListener("pointerup", soltar);
    },
    [editor, indice, x, y, rotacao]
  );
}

function CampoRender({
  indice,
  campo,
  dados,
  valores,
  editor,
}: {
  indice: number;
  campo: Campo;
  dados: DadosProposta;
  valores?: ValoresManuais;
  editor?: EditorDocumento;
}) {  const arrastar = useArrasto(indice, campo, editor);
  const esticar = useRedimensionamento(indice, campo, editor);
  const girar = useRotacao(indice, campo, editor);

  const lista = campo.tipo === "lista";
  const corpo = lista
    ? conteudoLista(campo as CampoLista, dados)
    : conteudoTexto(campo as CampoTexto, dados, valores);

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
                : "outline-line-strong"
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

      {editor?.selecionado === indice ? (
        <span
          onPointerDown={girar}
          title="Arraste para inclinar"
          className="absolute -top-4 -left-4 h-4 w-4 cursor-grab rounded-full border border-white bg-brand-navy"
        />
      ) : null}
    </div>
  );
}

function conteudoTexto(
  campo: CampoTexto,
  dados: DadosProposta,
  valores?: ValoresManuais
) {
  const texto = valorDoCampo(dados, campo, valores);
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
