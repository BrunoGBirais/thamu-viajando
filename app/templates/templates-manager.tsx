"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Modal, ModalActions } from "@/app/components/modal";
import { Badge } from "@/app/components/ui/badge";
import { Button, buttonClass } from "@/app/components/ui/button";
import { Card, EmptyState, PageHeader } from "@/app/components/ui/card";
import { Field, FormFeedback, Input, Textarea } from "@/app/components/ui/form";
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

export function TemplatesManager({ templates }: { templates: TemplateRow[] }) {
  const [criando, setCriando] = useState(false);
  const [editando, setEditando] = useState<TemplateRow | null>(null);
  const [excluindo, setExcluindo] = useState<TemplateRow | null>(null);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Templates"
        description="Modelos de proposta e a posição de cada campo."
        actions={
          <Button onClick={() => setCriando(true)} variant="primary">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            Novo template
          </Button>
        }
      />

      {templates.length === 0 ? (
        <EmptyState
          title="Nenhum modelo cadastrado"
          description="Crie um template para começar a montar propostas."
          action={
            <Button onClick={() => setCriando(true)}>Novo template</Button>
          }
        />
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <li key={template.id}>
              <Card hover className="group h-full overflow-hidden">
                <Link
                  href={`/templates/${template.id}`}
                  className="relative block aspect-[3/4] overflow-hidden border-b border-line bg-surface-sunken"
                >
                  <Image
                    src={template.paginas[0]}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 100vw, 33vw"
                    className="object-contain p-3 transition-transform duration-300 ease-out-expo group-hover:scale-[1.02]"
                  />
                </Link>

                <div className="space-y-3 p-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="truncate font-display text-lg font-bold text-brand-navy">
                        {template.nome}
                      </p>
                      {template.ativo ? null : (
                        <Badge tone="neutral">inativo</Badge>
                      )}
                    </div>
                    <p className="mt-0.5 text-[0.8125rem] tabular-nums text-muted">
                      {template.paginas.length}{" "}
                      {template.paginas.length === 1 ? "página" : "páginas"} ·{" "}
                      {template.totalCampos}{" "}
                      {template.totalCampos === 1 ? "campo" : "campos"}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/templates/${template.id}`}
                      className={buttonClass("outline", "sm")}
                    >
                      Editar campos
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditando(template)}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExcluindo(template)}
                      className="text-[#b3241c] hover:bg-brand-red/6 hover:text-[#b3241c]"
                    >
                      Excluir
                    </Button>
                  </div>
                </div>
              </Card>
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
    <Field
      label="Páginas (imagens exportadas do Canva)"
      htmlFor="paginas"
      hint={
        <span className={estado.erro ? "font-semibold text-[#b3241c]" : undefined}>
          {estado.erro ??
            (estado.enviando
              ? "Enviando imagens..."
              : estado.urls.length > 0
              ? `${estado.urls.length} ${
                  estado.urls.length === 1
                    ? "página enviada"
                    : "páginas enviadas"
                } · ${estado.largura} × ${estado.altura} mm`
              : "PNG, JPG ou WebP, até 8 MB por página.")}
        </span>
      }
    >
      <input
        id="paginas"
        type="file"
        multiple
        required={obrigatorio && estado.urls.length === 0}
        accept="image/png,image/jpeg,image/webp"
        onChange={aoSelecionar}
        className="w-full cursor-pointer rounded-lg border border-dashed border-line-strong bg-surface-muted p-3 text-sm text-muted transition-colors hover:border-brand-navy/50 file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-brand-navy file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
      />
      {estado.urls.map((url) => (
        <input key={url} type="hidden" name="paginas_url" value={url} />
      ))}
      <input type="hidden" name="largura_mm" value={estado.largura ?? ""} />
      <input type="hidden" name="altura_mm" value={estado.altura ?? ""} />
    </Field>
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
    <Modal open onClose={onClose} title="Novo template" size="sm">
      <form action={formAction} className="space-y-4">
        <FormFeedback error={state?.error} />

        <Field label="Nome" htmlFor="novo-nome">
          <Input id="novo-nome" name="nome" required />
        </Field>

        <Field label="Descrição" htmlFor="nova-descricao">
          <Textarea
            id="nova-descricao"
            name="descricao"
            rows={3}
            placeholder="Contexto para a IA: tom, público e o que cada seção representa."
          />
        </Field>

        <SeletorPaginas obrigatorio estado={paginas} onEstado={setPaginas} />

        <ModalActions
          onCancel={onClose}
          confirmLabel="Criar template"
          pending={pending || paginas.enviando}
          disabled={paginas.urls.length === 0}
        />
      </form>
    </Modal>
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
    <Modal open onClose={onClose} title="Editar template" size="sm">
      <form action={formAction} className="space-y-4">
        <FormFeedback error={state?.error} />
        <input type="hidden" name="id" value={template.id} />

        <Field label="Nome" htmlFor="editar-nome">
          <Input
            id="editar-nome"
            name="nome"
            required
            defaultValue={template.nome}
          />
        </Field>

        <Field label="Descrição" htmlFor="editar-descricao">
          <Textarea
            id="editar-descricao"
            name="descricao"
            rows={3}
            defaultValue={template.descricao ?? ""}
            placeholder="Contexto para a IA: tom, público e o que cada seção representa."
          />
        </Field>

        <label className="flex w-fit cursor-pointer items-center gap-2.5 rounded-lg border border-line-strong bg-surface px-3 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-brand-navy/40">
          <input
            type="checkbox"
            name="ativo"
            defaultChecked={template.ativo}
            className="h-4 w-4 rounded border-line-strong accent-brand-navy"
          />
          Disponível na criação de propostas
        </label>

        <SeletorPaginas
          obrigatorio={false}
          estado={paginas}
          onEstado={setPaginas}
        />
        <p className="text-[0.8125rem] text-muted">
          Enviar novas imagens substitui todas as páginas atuais.
        </p>

        <ModalActions
          onCancel={onClose}
          confirmLabel="Salvar"
          pending={pending || paginas.enviando}
        />
      </form>
    </Modal>
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
    <Modal open onClose={onClose} title="Excluir template" size="sm">
      <form action={formAction} className="space-y-4">
        <FormFeedback error={state?.error} />
        <input type="hidden" name="id" value={template.id} />

        <p className="text-muted">
          Excluir{" "}
          <strong className="font-semibold text-brand-navy">
            {template.nome}
          </strong>{" "}
          e o layout dos campos? As propostas já impressas não são afetadas.
        </p>

        <ModalActions
          onCancel={onClose}
          confirmLabel="Excluir"
          confirmVariant="danger"
          pending={pending}
        />
      </form>
    </Modal>
  );
}
