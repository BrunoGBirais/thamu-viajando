import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { carregarDadosProposta } from "@/lib/proposta/dados";
import type { PropostaTemplate, ValoresManuais } from "@/lib/proposta/template";
import { PropostaDocumento } from "../../components/proposta-documento";
import { buttonClass } from "../../components/ui/button";
import { PrintButton } from "./print-button";

export default async function PropostaPage({
  params,
  searchParams,
}: {
  params: Promise<{ cenarioId: string }>;
  searchParams: Promise<{ template?: string }>;
}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    redirect("/login");
  }

  const cenarioId = Number((await params).cenarioId);
  const templateId = Number((await searchParams).template);

  if (!Number.isInteger(cenarioId) || !Number.isInteger(templateId)) {
    notFound();
  }

  const [dados, { data: template }, { data: salvos }] = await Promise.all([
    carregarDadosProposta(supabase, cenarioId),
    supabase
      .from("proposta_templates")
      .select("*")
      .eq("id", templateId)
      .maybeSingle(),
    supabase
      .from("proposta_valores")
      .select("valores")
      .eq("cenario_id", cenarioId)
      .eq("template_id", templateId)
      .maybeSingle(),
  ]);

  if (!dados || !template) {
    notFound();
  }

  const valores = (salvos?.valores ?? {}) as ValoresManuais;

  return (
    <main className="app-canvas min-h-screen px-4 py-8 print:bg-white print:p-0">
      <div className="sticky top-4 z-10 mx-auto mb-6 flex max-w-[900px] flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-surface px-5 py-3.5 shadow-lg print:hidden">
        <div>
          <h1 className="text-xl font-bold text-brand-navy">
            {template.nome}
          </h1>
          <p className="text-sm text-muted">
            {String(dados.cenario.destino ?? "")}
            {dados.cliente.nome ? ` · ${String(dados.cliente.nome)}` : ""}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/criar-proposta?cenario=${cenarioId}&template=${templateId}`}
            className={buttonClass("ghost", "sm")}
          >
            Editar textos
          </Link>
          <Link
            href={`/templates/${templateId}`}
            className={buttonClass("outline", "sm")}
          >
            Editar modelo
          </Link>
          <PrintButton />
        </div>
      </div>

      <PropostaDocumento
        template={template as PropostaTemplate}
        dados={dados}
        valores={valores}
      />
    </main>
  );
}
