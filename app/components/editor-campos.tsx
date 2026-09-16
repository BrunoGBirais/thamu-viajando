"use client";

import { useEffect, useState, useTransition } from "react";
import { salvarCampos } from "@/app/templates/actions";
import { PropostaDocumento } from "./proposta-documento";
import {
  chavePadrao,
  slugDeChave,
  type Campo,
  type CampoLista,
  type CampoTexto,
  type DadosProposta,
  type Familia,
  type Origem,
  type PropostaTemplate,
} from "@/lib/proposta/template";

const FONTES: CampoLista["fonte"][] = ["voos", "transporte", "passeios"];

const TIPOGRAFIAS: { valor: Familia; rotulo: string }[] = [
  { valor: "open-sans", rotulo: "Open Sans" },
  { valor: "childos", rotulo: "Childos Arabic" },
];

const ORIGENS: { valor: Origem; rotulo: string }[] = [
  { valor: "dado", rotulo: "Dado do banco" },
  { valor: "ia", rotulo: "Gerado pela IA" },
  { valor: "manual", rotulo: "Preenchido à mão" },
];

function chaveUnica(lista: Campo[], campo: Campo) {
  const usadas = new Set(lista.map((item) => item.chave).filter(Boolean));
  const base = chavePadrao(campo);
  let chave = base;
  let sufixo = 2;

  while (usadas.has(chave)) {
    chave = `${base}_${sufixo}`;
    sufixo += 1;
  }

  return chave;
}

// Só caminhos escalares viram campo de texto; arrays viram campo do tipo lista.
function caminhosDisponiveis(dados: DadosProposta) {
  const grupos = ["cliente", "cenario", "totais"] as const;

  return grupos.flatMap((grupo) =>
    Object.entries(dados[grupo] ?? {})
      .filter(([, valor]) => !valor || typeof valor !== "object")
      .map(([chave]) => `${grupo}.${chave}`)
      .sort()
  );
}

export function EditorCampos({
  template,
  dados,
}: {
  template: PropostaTemplate;
  dados: DadosProposta;
}) {
  const [campos, setCampos] = useState<Campo[]>(template.campos ?? []);
  const [selecionado, setSelecionado] = useState<number | null>(null);
  const [mensagem, setMensagem] = useState("");
  const [salvando, iniciarSalvamento] = useTransition();
  const [fonteAusente, setFonteAusente] = useState(false);

  useEffect(() => {
    document.fonts
      .load("1rem 'Childos Arabic'")
      .then(() => setFonteAusente(!document.fonts.check("1rem 'Childos Arabic'")))
      .catch(() => setFonteAusente(true));
  }, []);

  const caminhos = caminhosDisponiveis(dados);
  const atual = selecionado === null ? null : campos[selecionado] ?? null;

  const atualizar = (patch: Partial<CampoTexto> & Partial<CampoLista>) => {
    if (selecionado === null) return;
    setCampos((lista) =>
      lista.map((campo, indice) =>
        indice === selecionado ? ({ ...campo, ...patch } as Campo) : campo
      )
    );
  };

  const adicionarTexto = () => {
    setCampos((lista) => {
      const campo: Campo = {
        tipo: "texto",
        campo: caminhos[0] ?? "cliente.nome",
        origem: "dado",
        pagina: 1,
        x: 10,
        y: 10,
        w: 60,
        fontSize: 3,
      };

      return [...lista, { ...campo, chave: chaveUnica(lista, campo) }];
    });
    setSelecionado(campos.length);
  };

  const adicionarLista = () => {
    setCampos((lista) => {
      const campo: Campo = {
        tipo: "lista",
        fonte: "voos",
        linha: "{origem} → {destino} · {total:moeda}",
        origem: "dado",
        pagina: 1,
        x: 10,
        y: 40,
        w: 80,
        fontSize: 2.4,
      };

      return [...lista, { ...campo, chave: chaveUnica(lista, campo) }];
    });
    setSelecionado(campos.length);
  };

  const remover = () => {
    if (selecionado === null) return;
    setCampos((lista) => lista.filter((_, indice) => indice !== selecionado));
    setSelecionado(null);
  };

  const mover = (indice: number, x: number, y: number) => {
    setCampos((lista) =>
      lista.map((campo, posicao) =>
        posicao === indice ? { ...campo, x, y } : campo
      )
    );
  };

  const redimensionar = (indice: number, w: number) => {
    setCampos((lista) =>
      lista.map((campo, posicao) =>
        posicao === indice ? { ...campo, w } : campo
      )
    );
  };

  const girar = (indice: number, rotacao: number) => {
    setCampos((lista) =>
      lista.map((campo, posicao) =>
        posicao === indice ? { ...campo, rotacao } : campo
      )
    );
  };

  const salvar = () => {
    setMensagem("");
    iniciarSalvamento(async () => {
      const resultado = await salvarCampos(template.id, campos);
      setMensagem(resultado.error ?? resultado.success ?? "");
    });
  };

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-6 lg:flex-row">
      <div className="min-w-0 flex-1">
        <PropostaDocumento
          template={{ ...template, campos }}
          dados={dados}
          editor={{
            selecionado,
            selecionar: setSelecionado,
            mover,
            redimensionar,
            girar,
          }}
        />
      </div>

      <aside className="w-full shrink-0 space-y-4 rounded-xl bg-white p-4 shadow-lg lg:w-80">
        <div className="flex gap-2">
          <BotaoSecundario onClick={adicionarTexto}>+ Texto</BotaoSecundario>
          <BotaoSecundario onClick={adicionarLista}>+ Lista</BotaoSecundario>
        </div>

        <ul className="max-h-48 space-y-1 overflow-y-auto text-sm">
          {campos.map((campo, indice) => (
            <li key={indice}>
              <button
                type="button"
                onClick={() => setSelecionado(indice)}
                className={`w-full truncate rounded px-2 py-1 text-left transition ${
                  selecionado === indice
                    ? "bg-brand-navy text-white"
                    : "hover:bg-zinc-100"
                }`}
              >
                {campo.rotulo ||
                  (campo.tipo === "lista"
                    ? `lista · ${campo.fonte}`
                    : (campo as CampoTexto).campo)}
              </button>
            </li>
          ))}
          {campos.length === 0 ? (
            <li className="px-2 py-1 text-zinc-500">Nenhum campo ainda.</li>
          ) : null}
        </ul>

        {atual ? (
          <div className="space-y-3 border-t border-zinc-200 pt-3">
            <Grupo rotulo="Rótulo">
              <input
                type="text"
                value={atual.rotulo ?? ""}
                onChange={(e) => atualizar({ rotulo: e.target.value })}
                placeholder="Nome do cliente"
                className={ENTRADA}
              />
            </Grupo>

            <Grupo rotulo="Chave">
              <input
                type="text"
                value={atual.chave ?? ""}
                onChange={(e) =>
                  atualizar({ chave: slugDeChave(e.target.value) })
                }
                placeholder={chavePadrao(atual)}
                className={`${ENTRADA} font-mono`}
              />
            </Grupo>
            <p className="-mt-2 text-xs text-zinc-500">
              Identifica o campo nas propostas salvas. Mudar quebra o histórico.
            </p>

            <Grupo rotulo="Descrição para a IA">
              <textarea
                value={atual.descricao ?? ""}
                onChange={(e) => atualizar({ descricao: e.target.value })}
                rows={3}
                placeholder="O que escrever aqui e em que tom."
                className={ENTRADA}
              />
            </Grupo>

            <div className="grid grid-cols-2 gap-2">
              <Grupo rotulo="Origem">
                <select
                  value={atual.origem ?? "dado"}
                  onChange={(e) =>
                    atualizar({ origem: e.target.value as Origem })
                  }
                  className={ENTRADA}
                >
                  {ORIGENS.map((opcao) => (
                    <option key={opcao.valor} value={opcao.valor}>
                      {opcao.rotulo}
                    </option>
                  ))}
                </select>
              </Grupo>
              <NumeroInput
                rotulo="Máx. caracteres"
                valor={atual.maxCaracteres ?? 0}
                passo={10}
                onChange={(valor) =>
                  atualizar({ maxCaracteres: valor || undefined })
                }
              />
            </div>

            {atual.tipo === "lista" ? (
              <>
                <Selecao
                  rotulo="Fonte"
                  valor={atual.fonte}
                  opcoes={FONTES}
                  onChange={(valor) =>
                    atualizar({ fonte: valor as CampoLista["fonte"] })
                  }
                />
                <Grupo rotulo="Linha">
                  <input
                    type="text"
                    value={atual.linha}
                    onChange={(e) => atualizar({ linha: e.target.value })}
                    className={ENTRADA}
                  />
                </Grupo>
                <NumeroInput
                  rotulo="Espaçamento"
                  valor={atual.espacamento ?? 1.6}
                  passo={0.1}
                  onChange={(valor) => atualizar({ espacamento: valor })}
                />
                <NumeroInput
                  rotulo="Máx. itens"
                  valor={atual.maxItens ?? 0}
                  passo={1}
                  onChange={(valor) => atualizar({ maxItens: valor || undefined })}
                />
              </>
            ) : (
              <>
                {atual.origem === "manual" ? (
                  <p className="text-xs text-zinc-500">
                    O texto é digitado ao criar a proposta.
                  </p>
                ) : (
                  <Selecao
                    rotulo="Dado"
                    valor={(atual as CampoTexto).campo}
                    opcoes={caminhos}
                    onChange={(valor) => atualizar({ campo: valor })}
                  />
                )}
                <Selecao
                  rotulo="Formato"
                  valor={(atual as CampoTexto).formato ?? "texto"}
                  opcoes={["texto", "data", "moeda", "numero"]}
                  onChange={(valor) =>
                    atualizar({ formato: valor as CampoTexto["formato"] })
                  }
                />
              </>
            )}

            <div className="grid grid-cols-2 gap-2">
              <NumeroInput
                rotulo="X (%)"
                valor={atual.x}
                passo={0.1}
                onChange={(valor) => atualizar({ x: valor })}
              />
              <NumeroInput
                rotulo="Y (%)"
                valor={atual.y}
                passo={0.1}
                onChange={(valor) => atualizar({ y: valor })}
              />
              <NumeroInput
                rotulo="Largura (%)"
                valor={atual.w ?? 60}
                passo={1}
                onChange={(valor) => atualizar({ w: valor })}
              />
              <NumeroInput
                rotulo="Fonte (%)"
                valor={atual.fontSize ?? 2.5}
                passo={0.1}
                onChange={(valor) => atualizar({ fontSize: valor })}
              />
              <NumeroInput
                rotulo="Ângulo (°)"
                valor={atual.rotacao ?? 0}
                passo={1}
                onChange={(valor) => atualizar({ rotacao: valor || undefined })}
              />
              <NumeroInput
                rotulo="Página"
                valor={atual.pagina ?? 1}
                passo={1}
                onChange={(valor) => atualizar({ pagina: valor })}
              />
              <NumeroInput
                rotulo="Peso"
                valor={atual.peso ?? 400}
                passo={100}
                onChange={(valor) => atualizar({ peso: valor })}
              />
            </div>

            <Grupo rotulo="Tipo de letra">
              <select
                value={atual.familia ?? "open-sans"}
                onChange={(e) =>
                  atualizar({ familia: e.target.value as Familia })
                }
                className={ENTRADA}
              >
                {TIPOGRAFIAS.map((opcao) => (
                  <option key={opcao.valor} value={opcao.valor}>
                    {opcao.rotulo}
                  </option>
                ))}
              </select>
            </Grupo>

            {atual.familia === "childos" && fonteAusente ? (
              <p className="text-xs text-amber-700">
                Childos Arabic não carregou. Recarregue a página; se persistir,
                confira o arquivo em public/fonts.
              </p>
            ) : null}

            <div className="grid grid-cols-2 gap-2">
              <Grupo rotulo="Cor">
                <input
                  type="color"
                  value={atual.cor ?? "#1b2a4a"}
                  onChange={(e) => atualizar({ cor: e.target.value })}
                  className="h-9 w-full rounded border border-zinc-300"
                />
              </Grupo>
              <Selecao
                rotulo="Alinhamento"
                valor={atual.align ?? "left"}
                opcoes={["left", "center", "right"]}
                onChange={(valor) =>
                  atualizar({ align: valor as CampoTexto["align"] })
                }
              />
            </div>

            <button
              type="button"
              onClick={remover}
              className="text-sm font-semibold text-red-600 transition hover:underline"
            >
              Remover campo
            </button>
          </div>
        ) : (
          <p className="border-t border-zinc-200 pt-3 text-sm text-zinc-500">
            Clique em um campo na página para arrastar e editar.
          </p>
        )}

        <div className="border-t border-zinc-200 pt-3">
          <button
            type="button"
            onClick={salvar}
            disabled={salvando}
            className="w-full rounded-lg bg-brand-navy px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {salvando ? "Salvando…" : "Salvar layout"}
          </button>
          {mensagem ? (
            <p className="mt-2 text-center text-sm text-zinc-600">{mensagem}</p>
          ) : null}
        </div>
      </aside>
    </div>
  );
}

const ENTRADA =
  "w-full rounded border border-zinc-300 px-2 py-1 text-sm focus:border-brand-navy focus:outline-none";

function Grupo({
  rotulo,
  children,
}: {
  rotulo: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-500">
        {rotulo}
      </span>
      {children}
    </label>
  );
}

function NumeroInput({
  rotulo,
  valor,
  passo,
  onChange,
}: {
  rotulo: string;
  valor: number;
  passo: number;
  onChange: (valor: number) => void;
}) {
  return (
    <Grupo rotulo={rotulo}>
      <input
        type="number"
        step={passo}
        value={valor}
        onChange={(e) => onChange(Number(e.target.value))}
        className={ENTRADA}
      />
    </Grupo>
  );
}

function Selecao({
  rotulo,
  valor,
  opcoes,
  onChange,
}: {
  rotulo: string;
  valor: string;
  opcoes: readonly string[];
  onChange: (valor: string) => void;
}) {
  return (
    <Grupo rotulo={rotulo}>
      <select
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        className={ENTRADA}
      >
        {opcoes.map((opcao) => (
          <option key={opcao} value={opcao}>
            {opcao}
          </option>
        ))}
      </select>
    </Grupo>
  );
}

function BotaoSecundario({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm font-semibold text-brand-navy transition hover:bg-zinc-50"
    >
      {children}
    </button>
  );
}
