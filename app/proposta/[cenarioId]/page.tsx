import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { montarDados, type PropostaTemplate, type ValoresManuais } from "@/lib/proposta/template";
import { PropostaDocumento } from "../../components/proposta-documento";
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

  const [{ data: cenario }, { data: template }, { data: salvos }] = await Promise.all([
    supabase
      .from("cenarios")
      .select("*, clientes(*), voos(*), transporte(*), passeios(*)")
      .eq("id", cenarioId)
      .maybeSingle(),
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

  if (!cenario || !template) {
    notFound();
  }

  const { clientes: cliente, ...dadosCenario } = cenario;
  const dados = montarDados(cliente ?? {}, dadosCenario);
  const valores = (salvos?.valores ?? {}) as ValoresManuais;

  return (
    <main className="min-h-screen bg-zinc-100 px-4 py-8 print:bg-white print:p-0">
      <div className="mx-auto mb-6 flex max-w-[900px] items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-lg font-semibold text-brand-navy">
            {template.nome}
          </h1>
          <p className="text-sm text-zinc-600">
            {String(dadosCenario.destino ?? "")}
            {cliente?.nome ? ` · ${cliente.nome}` : ""}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/criar-proposta"
            className="text-sm font-semibold text-brand-navy transition hover:underline"
          >
            Voltar
          </Link>
          <Link
            href={`/templates/${templateId}`}
            className="text-sm font-semibold text-brand-navy transition hover:underline"
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
