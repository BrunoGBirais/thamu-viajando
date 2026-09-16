import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { montarDados, type PropostaTemplate, type ValoresManuais } from "@/lib/proposta/template";
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
    <main className="app-canvas min-h-screen px-4 py-8 print:bg-white print:p-0">
      <div className="animate-rise sticky top-4 z-10 mx-auto mb-6 flex max-w-[900px] flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-surface/85 px-5 py-3.5 shadow-lg backdrop-blur-xl print:hidden">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-brand-navy">
            {template.nome}
          </h1>
          <p className="text-sm text-muted">
            {String(dadosCenario.destino ?? "")}
            {cliente?.nome ? ` · ${cliente.nome}` : ""}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/criar-proposta" className={buttonClass("ghost", "sm")}>
            Voltar
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
