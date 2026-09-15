"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useActionState,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import {
  atualizarTemplate,
  criarTemplate,
  excluirTemplate,
  type TemplateFormState,
} from "./actions";

export type TemplateRow = {
  id: number;
  nome: string;
  descricao: string | null;
  paginas: string[];
  largura_mm: number | string;
  altura_mm: number | string;
  ativo: boolean;
  totalCampos: number;
};

const inputClass =
  "w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/30";

const labelClass = "block text-sm font-medium text-zinc-700";

export function TemplatesManager({ templates }: { templates: TemplateRow[] }) {
  const [criando, setCriando] = useState(false);
  const [editando, setEditando] = useState<TemplateRow | null>(null);
  const [excluindo, setExcluindo] = useState<TemplateRow | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-brand-navy">Templates</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Modelos de proposta e a posição de cada campo.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setCriando(true)}
          className="rounded-lg bg-brand-red px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-navy"
        >
          Novo template
        </button>
      </div>

      {templates.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-300 bg-white p-10 text-center text-sm text-zinc-500">
          Nenhum modelo cadastrado ainda.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <li
              key={template.id}
              className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm"
            >
              <Link
                href={`/templates/${template.id}`}
                className="relative block aspect-[3/4] bg-zinc-100"
              >
                <Image
                  src={template.paginas[0]}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 100vw, 33vw"
                  className="object-contain"
                />
              </Link>

              <div className="space-y-3 p-4">
                <div>
                  <p className="truncate font-semibold text-brand-navy">
                    {template.nome}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {template.paginas.length}{" "}
                    {template.paginas.length === 1 ? "página" : "páginas"} ·{" "}
                    {template.totalCampos}{" "}
                    {template.totalCampos === 1 ? "campo" : "campos"}
                    {template.ativo ? "" : " · inativo"}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/templates/${template.id}`}
                    className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:border-brand-blue hover:text-brand-blue"
                  >
                    Editar campos
                  </Link>
                  <button
                    type="button"
                    onClick={() => setEditando(template)}
                    className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:border-brand-blue hover:text-brand-blue"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => setExcluindo(template)}
                    className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:border-brand-red hover:text-brand-red"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {criando && <DialogoCriar onClose={() => setCriando(false)} />}
      {editando && (
        <DialogoEditar
          template={editando}
          onClose={() => setEditando(null)}
        />
      )}
      {excluindo && (
        <DialogoExcluir
          template={excluindo}
          onClose={() => setExcluindo(null)}
        />
      )}
    </div>
  );
}

function Dialog({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Fechar"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/50"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full max-w-md overflow-hidden rounded-xl bg-white shadow-xl"
      >
        <div className="h-1 bg-gradient-to-r from-brand-red via-brand-yellow to-brand-blue" />
        <div className="p-6">
          <h2 className="text-lg font-semibold text-brand-navy">{title}</h2>
          <div className="mt-4">{children}</div>
        </div>
      </div>
    </div>
  );
}

function FormFeedback({ state }: { state: TemplateFormState }) {
  if (!state?.error) return null;

  return (
    <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-brand-red">
      {state.error}
    </p>
  );
}

function DialogActions({
  pending,
  disabled = false,
  confirmLabel,
  danger = false,
  onClose,
}: {
  pending: boolean;
  disabled?: boolean;
  confirmLabel: string;
  danger?: boolean;
  onClose: () => void;
}) {
  return (
    <div className="flex justify-end gap-3 pt-2">
      <button
        type="button"
        onClick={onClose}
        className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
      >
        Cancelar
      </button>
      <button
        type="submit"
        disabled={pending || disabled}
        className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-60 ${
          danger
            ? "bg-brand-red hover:bg-red-700"
            : "bg-brand-navy hover:bg-brand-blue"
        }`}
      >
        {pending ? "Salvando..." : confirmLabel}
      </button>
    </div>
  );
}

const MM_POR_PIXEL = 25.4 / 96;
const TAMANHO_MAXIMO = 8 * 1024 * 1024;

// A extensão vem do MIME, nunca do nome do arquivo escolhido.
const EXTENSOES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

type EstadoPaginas = {
  enviando: boolean;
  urls: string[];
  largura?: number;
  altura?: number;
  erro?: string;
};

const PAGINAS_VAZIO: EstadoPaginas = { enviando: false, urls: [] };

// crypto.randomUUID só existe em contexto seguro; em dev via IP usamos getRandomValues.
function nomeAleatorio() {
  if (typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("");
}

function medirImagem(arquivo: File) {
  return new Promise<{ largura: number; altura: number }>((resolve, reject) => {
    const url = URL.createObjectURL(arquivo);
    const imagem = new window.Image();

    imagem.onload = () => {
      URL.revokeObjectURL(url);
      resolve({
        largura: Number((imagem.naturalWidth * MM_POR_PIXEL).toFixed(2)),
        altura: Number((imagem.naturalHeight * MM_POR_PIXEL).toFixed(2)),
      });
    };
    imagem.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("imagem inválida"));
    };
    imagem.src = url;
  });
}

// O upload vai direto para o Storage: Server Actions limitam o corpo a 1 MB.
function SeletorPaginas({
  obrigatorio,
  estado,
  onEstado,
}: {
  obrigatorio: boolean;
  estado: EstadoPaginas;
  onEstado: (estado: EstadoPaginas) => void;
}) {
  const aoSelecionar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const arquivos = Array.from(event.target.files ?? []).sort((a, b) =>
      a.name.localeCompare(b.name, "pt-BR", { numeric: true })
    );

    if (arquivos.length === 0) {
      onEstado(PAGINAS_VAZIO);
      return;
    }

    if (arquivos.some((arquivo) => !EXTENSOES[arquivo.type])) {
      onEstado({ ...PAGINAS_VAZIO, erro: "Use apenas PNG, JPG ou WebP." });
      return;
    }
    if (arquivos.some((arquivo) => arquivo.size > TAMANHO_MAXIMO)) {
      onEstado({ ...PAGINAS_VAZIO, erro: "Cada página deve ter até 8 MB." });
      return;
    }

    onEstado({ ...PAGINAS_VAZIO, enviando: true });

    try {
      const supabase = createClient();
      const medidas = await medirImagem(arquivos[0]);
      const urls: string[] = [];

      for (const arquivo of arquivos) {
        const caminho = `templates/${nomeAleatorio()}.${
          EXTENSOES[arquivo.type]
        }`;
        const { error } = await supabase.storage
          .from("propostas")
          .upload(caminho, arquivo, { contentType: arquivo.type });

        if (error) throw error;

        urls.push(
          supabase.storage.from("propostas").getPublicUrl(caminho).data
            .publicUrl
        );
      }

      onEstado({ enviando: false, urls, ...medidas });
    } catch (erro) {
      const detalhe = erro instanceof Error ? erro.message : "";
      onEstado({
        ...PAGINAS_VAZIO,
        erro: `Falha ao enviar as imagens. ${detalhe}`.trim(),
      });
    }
  };

  return (
    <div className="space-y-1">
      <label htmlFor="paginas" className={labelClass}>
        Páginas (imagens exportadas do Canva)
      </label>
      <input
        id="paginas"
        type="file"
        multiple
        required={obrigatorio && estado.urls.length === 0}
        accept="image/png,image/jpeg,image/webp"
        onChange={aoSelecionar}
        className="w-full text-sm text-zinc-700 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-navy file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
      />
      {estado.urls.map((url) => (
        <input key={url} type="hidden" name="paginas_url" value={url} />
      ))}
      <input type="hidden" name="largura_mm" value={estado.largura ?? ""} />
      <input type="hidden" name="altura_mm" value={estado.altura ?? ""} />
      <p
        className={`text-xs ${
          estado.erro ? "text-brand-red" : "text-zinc-500"
        }`}
      >
        {estado.erro ??
          (estado.enviando
            ? "Enviando imagens..."
            : estado.urls.length > 0
            ? `${estado.urls.length} ${
                estado.urls.length === 1 ? "página enviada" : "páginas enviadas"
              } · ${estado.largura} × ${estado.altura} mm`
            : "PNG, JPG ou WebP, até 8 MB por página.")}
      </p>
    </div>
  );
}

function DialogoCriar({ onClose }: { onClose: () => void }) {
  const [state, formAction, pending] = useActionState<
    TemplateFormState,
    FormData
  >(criarTemplate, undefined);
  const [paginas, setPaginas] = useState<EstadoPaginas>(PAGINAS_VAZIO);

  useEffect(() => {
    if (state?.success) onClose();
  }, [state, onClose]);

  return (
    <Dialog title="Novo template" onClose={onClose}>
      <form action={formAction} className="space-y-4">
        <FormFeedback state={state} />

        <div className="space-y-1">
          <label htmlFor="novo-nome" className={labelClass}>
            Nome
          </label>
          <input id="novo-nome" name="nome" required className={inputClass} />
        </div>

        <div className="space-y-1">
          <label htmlFor="nova-descricao" className={labelClass}>
            Descrição
          </label>
          <textarea
            id="nova-descricao"
            name="descricao"
            rows={3}
            placeholder="Contexto para a IA: tom, público e o que cada seção representa."
            className={inputClass}
          />
        </div>

        <SeletorPaginas obrigatorio estado={paginas} onEstado={setPaginas} />

        <DialogActions
          pending={pending || paginas.enviando}
          disabled={paginas.urls.length === 0}
          confirmLabel="Criar template"
          onClose={onClose}
        />
      </form>
    </Dialog>
  );
}

function DialogoEditar({
  template,
  onClose,
}: {
  template: TemplateRow;
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState<
    TemplateFormState,
    FormData
  >(atualizarTemplate, undefined);
  const [paginas, setPaginas] = useState<EstadoPaginas>(PAGINAS_VAZIO);

  useEffect(() => {
    if (state?.success) onClose();
  }, [state, onClose]);

  return (
    <Dialog title="Editar template" onClose={onClose}>
      <form action={formAction} className="space-y-4">
        <FormFeedback state={state} />
        <input type="hidden" name="id" value={template.id} />

        <div className="space-y-1">
          <label htmlFor="editar-nome" className={labelClass}>
            Nome
          </label>
          <input
            id="editar-nome"
            name="nome"
            required
            defaultValue={template.nome}
            className={inputClass}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="editar-descricao" className={labelClass}>
            Descrição
          </label>
          <textarea
            id="editar-descricao"
            name="descricao"
            rows={3}
            defaultValue={template.descricao ?? ""}
            placeholder="Contexto para a IA: tom, público e o que cada seção representa."
            className={inputClass}
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-zinc-700">
          <input
            type="checkbox"
            name="ativo"
            defaultChecked={template.ativo}
            className="h-4 w-4 rounded border-zinc-300 accent-brand-navy"
          />
          Disponível na criação de propostas
        </label>

        <SeletorPaginas
          obrigatorio={false}
          estado={paginas}
          onEstado={setPaginas}
        />
        <p className="text-xs text-zinc-500">
          Enviar novas imagens substitui todas as páginas atuais.
        </p>

        <DialogActions
          pending={pending || paginas.enviando}
          confirmLabel="Salvar"
          onClose={onClose}
        />
      </form>
    </Dialog>
  );
}

function DialogoExcluir({
  template,
  onClose,
}: {
  template: TemplateRow;
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState<
    TemplateFormState,
    FormData
  >(excluirTemplate, undefined);

  useEffect(() => {
    if (state?.success) onClose();
  }, [state, onClose]);

  return (
    <Dialog title="Excluir template" onClose={onClose}>
      <form action={formAction} className="space-y-4">
        <FormFeedback state={state} />
        <input type="hidden" name="id" value={template.id} />

        <p className="text-sm text-zinc-700">
          Excluir <strong>{template.nome}</strong> e o layout dos campos? As
          propostas já impressas não são afetadas.
        </p>

        <DialogActions
          pending={pending}
          confirmLabel="Excluir"
          danger
          onClose={onClose}
        />
      </form>
    </Dialog>
  );
}
