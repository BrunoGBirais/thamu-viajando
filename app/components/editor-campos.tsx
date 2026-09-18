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

// As fontes "proposta.*" já vêm com o texto pronto ({partida_texto}, {texto}...).
const FONTES: { valor: CampoLista["fonte"]; rotulo: string }[] = [
  { valor: "proposta.voos", rotulo: "Voos" },
  { valor: "proposta.transfers", rotulo: "Transfers" },
  { valor: "proposta.passeios", rotulo: "Passeios" },
];

// Conteúdo de cada linha da lista, para não precisar digitar "{partida_texto}".
const CONTEUDOS: Record<string, { valor: string; rotulo: string }[]> = {
  "proposta.voos": [
    { valor: "{partida_texto}", rotulo: "Saída (CWB 08/12 11:40)" },
    { valor: "{chegada_texto}", rotulo: "Chegada (NAT 08/12 23:55)" },
    { valor: "{escala_texto}", rotulo: "Escala (1 escala (BSB 7h40))" },
    { valor: "{companhia}", rotulo: "Companhia (LATAM)" },
  ],
  "proposta.transfers": [
    { valor: "{texto}", rotulo: "Transfer (Transfer CGH → GRU)" },
    { valor: "{fornecedor}", rotulo: "Fornecedor" },
  ],
  "proposta.passeios": [
    { valor: "{texto}", rotulo: "Passeio com cidade" },
    { valor: "{descricao}", rotulo: "Só a descrição" },
  ],
};

const FORMATOS = [
  { valor: "texto", rotulo: "Texto" },
  { valor: "data", rotulo: "Data (08/12/2026)" },
  { valor: "moeda", rotulo: "Dinheiro (R$ 1.930,00)" },
  { valor: "numero", rotulo: "Número" },
];

const ALINHAMENTOS = [
  { valor: "left", rotulo: "À esquerda" },
  { valor: "center", rotulo: "Centralizado" },
  { valor: "right", rotulo: "À direita" },
];

// Nomes das colunas da view em linguagem de agência, não de banco.
const ROTULOS: Record<string, string> = {
  numero_proposta: "Número da proposta",
  duracao: "Duração (6 DIAS & 5 NOITES)",
  dias: "Quantidade de dias",
  noites: "Quantidade de noites",
  destino_titulo: "Destino em maiúsculas",
  destino_estado: "Estado do destino",
  destino_pais: "País do destino",
  origem_cidade: "Cidade de origem",
  periodo: "Período da viagem",
  pessoas: "Quantidade de pessoas",
  transporte_tipo: "Tipo de transporte",
  passagem: "Passagem aérea e tarifa",
  bagagem: "Bagagem",
  diarias: "Diárias",
  diarias_titulo: "Diárias em maiúsculas",
  hospedagem: "Quartos e acomodação",
  nota: "Nota do hotel",
  refeicao: "Refeição",
  passeios_inclusos: "Passeios inclusos",
  valor_credito: "Valor no crédito",
  valor_parcela: "Valor da parcela",
  valor_pix: "Valor no pix",
  parcelas_texto: "Parcelas sem juros",
  juros_texto: "Parcelas com juros",
  desconto_pix_texto: "Desconto do pix",
  custo_total: "Custo total (interno)",
  custo_pessoa: "Custo por pessoa (interno)",
  credito_pessoa: "Crédito por pessoa (número)",
  parcela_pessoa: "Parcela por pessoa (número)",
  pix_pessoa: "Pix por pessoa (número)",
};

// IDs não interessam a quem monta a arte.
const OCULTOS = new Set(["cenario_id", "cliente_id"]);

// Como o campo aparece na lista lateral quando não tem rótulo próprio.
function nomeDoCampo(campo: Campo) {
  if (campo.tipo === "lista") {
    const fonte = FONTES.find((opcao) => opcao.valor === campo.fonte);
    return `Lista · ${fonte?.rotulo ?? campo.fonte}`;
  }

  const caminho = (campo as CampoTexto).campo;
  if (campo.origem === "manual") return "Digitado na proposta";

  return caminho.startsWith("proposta.")
    ? rotuloDaColuna(caminho.slice("proposta.".length))
    : caminho;
}

function rotuloDaColuna(coluna: string) {
  if (ROTULOS[coluna]) return ROTULOS[coluna];

  const texto = coluna.replace(/_/g, " ");
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

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

// Só as colunas da view proposta_dados: é lá que os textos já saem prontos.
// Cada opção mostra o valor do cenário escolhido, não o nome da coluna.
// Caminhos escalares viram campo de texto; arrays viram campo do tipo lista.
function opcoesDeDado(dados: DadosProposta) {
  return Object.entries(dados.proposta ?? {})
    .filter(
      ([chave, valor]) =>
        !OCULTOS.has(chave) && (!valor || typeof valor !== "object")
    )
    .map(([chave, valor]) => {
      const exemplo =
        valor === null || valor === undefined || valor === ""
          ? ""
          : String(valor);
      const rotulo = rotuloDaColuna(chave);

      return {
        valor: `proposta.${chave}`,
        rotulo: exemplo ? `${exemplo} — ${rotulo}` : `(vazio) — ${rotulo}`,
        ordem: rotulo,
      };
    })
    .sort((a, b) => a.ordem.localeCompare(b.ordem, "pt-BR"));
}

// Campos antigos apontam para cliente.*/cenario.*; mantém a opção para não
// trocar o dado sozinho ao abrir o seletor.
function comAtual<T extends { valor: string; rotulo: string }>(
  opcoes: T[],
  atual?: string
) {
  return atual && !opcoes.some((opcao) => opcao.valor === atual)
    ? [{ valor: atual, rotulo: `${atual} (personalizado)` }, ...opcoes]
    : opcoes;
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

  const opcoesDado = opcoesDeDado(dados);
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
        campo: opcoesDado[0]?.valor ?? "proposta.destino_titulo",
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
        fonte: "proposta.voos",
        linha: "{partida_texto}",
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

      <aside className="w-full shrink-0 space-y-4 self-start rounded-2xl border border-line bg-surface p-4 shadow-sm lg:sticky lg:top-4 lg:w-80">
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
                className={`w-full truncate rounded-md border-l-4 px-2.5 py-1.5 text-left transition-colors ${
                  selecionado === indice
                    ? "border-brand-yellow bg-brand-navy font-semibold text-white"
                    : "border-transparent text-muted hover:bg-surface-sunken hover:text-foreground"
                }`}
              >
                {campo.rotulo || nomeDoCampo(campo)}
              </button>
            </li>
          ))}
          {campos.length === 0 ? (
            <li className="px-2 py-1 text-subtle">Nenhum campo ainda.</li>
          ) : null}
        </ul>

        {atual ? (
          <div className="space-y-3 border-t border-line pt-3">
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
            <p className="-mt-2 text-[0.8125rem] text-muted">
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
                  rotulo="Lista"
                  valor={atual.fonte}
                  opcoes={comAtual([...FONTES], atual.fonte)}
                  onChange={(valor) =>
                    atualizar({
                      fonte: valor as CampoLista["fonte"],
                      linha: CONTEUDOS[valor]?.[0]?.valor ?? "{texto}",
                    })
                  }
                />
                <Selecao
                  rotulo="Conteúdo da linha"
                  valor={atual.linha}
                  opcoes={comAtual(CONTEUDOS[atual.fonte] ?? [], atual.linha)}
                  onChange={(valor) => atualizar({ linha: valor })}
                />
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
                  <p className="rounded-lg bg-surface-sunken px-2.5 py-2 text-[0.8125rem] text-muted">
                    O texto é digitado ao criar a proposta.
                  </p>
                ) : (
                  <Selecao
                    rotulo="Dado do cenário"
                    valor={(atual as CampoTexto).campo}
                    opcoes={comAtual(opcoesDado, (atual as CampoTexto).campo)}
                    onChange={(valor) => atualizar({ campo: valor })}
                  />
                )}
                <Selecao
                  rotulo="Formato"
                  valor={(atual as CampoTexto).formato ?? "texto"}
                  opcoes={FORMATOS}
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
              <p className="text-[0.8125rem] font-semibold text-[#6b5000]">
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
                  className="h-9 w-full cursor-pointer rounded-lg border border-line-strong bg-surface"
                />
              </Grupo>
              <Selecao
                rotulo="Alinhamento"
                valor={atual.align ?? "left"}
                opcoes={ALINHAMENTOS}
                onChange={(valor) =>
                  atualizar({ align: valor as CampoTexto["align"] })
                }
              />
            </div>

            <button
              type="button"
              onClick={remover}
              className="text-sm font-semibold text-[#b3241c] underline-offset-4 transition hover:underline"
            >
              Remover campo
            </button>
          </div>
        ) : (
          <p className="border-t border-line pt-3 text-sm text-subtle">
            Clique em um campo na página para arrastar e editar.
          </p>
        )}

        <div className="border-t border-line pt-3">
          <button
            type="button"
            onClick={salvar}
            disabled={salvando}
            className="h-10 w-full rounded-lg bg-brand-navy px-4 text-sm font-semibold text-white transition-colors hover:bg-[#244680] active:translate-y-px disabled:opacity-45"
          >
            {salvando ? "Salvando…" : "Salvar layout"}
          </button>
          {mensagem ? (
            <p className="mt-2 text-center text-sm text-muted">{mensagem}</p>
          ) : null}
        </div>
      </aside>
    </div>
  );
}

const ENTRADA =
  "w-full rounded-lg border border-line-strong bg-surface px-2.5 py-1.5 text-sm text-foreground transition-colors placeholder:text-subtle hover:border-[#9fb0c6] focus:border-brand-navy focus:shadow-[0_0_0_3px_rgb(41_169_224/0.28)] focus-visible:outline-none";

function Grupo({
  rotulo,
  children,
}: {
  rotulo: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[0.8125rem] font-semibold text-foreground">
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
  opcoes: readonly { valor: string; rotulo: string }[];
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
          <option key={opcao.valor} value={opcao.valor}>
            {opcao.rotulo}
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
      className="h-9 flex-1 rounded-lg border border-line-strong bg-surface px-3 text-sm font-semibold text-brand-navy transition-colors hover:border-brand-navy/40 hover:bg-surface-muted active:translate-y-px"
    >
      {children}
    </button>
  );
}
