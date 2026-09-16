import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { montarDados, type PropostaTemplate } from "@/lib/proposta/template";
import { EditorCampos } from "../../components/editor-campos";
import { buttonClass } from "../../components/ui/button";
import { SeletorCenario, type CenarioAmostra } from "./seletor-cenario";

export default async function TemplateEditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ cenario?: string }>;
}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    redirect("/login");
  }

  const templateId = Number((await params).id);
  if (!Number.isInteger(templateId)) {
    notFound();
  }

  const [{ data: template }, { data: listaCenarios }] = await Promise.all([
    supabase
      .from("proposta_templates")
      .select("*")
      .eq("id", templateId)
      .maybeSingle(),
    supabase
      .from("cenarios")
      .select("id, destino, clientes(nome)")
      .order("id", { ascending: false })
      .limit(50),
  ]);

  if (!template) {
    notFound();
  }

  const cenarios = (listaCenarios ?? []) as unknown as CenarioAmostra[];
  const escolhido = Number((await searchParams).cenario);
  const cenarioId = cenarios.some((item) => item.id === escolhido)
    ? escolhido
    : cenarios[0]?.id;

  // A amostra só serve para visualizar o layout com dados reais.
  const { data: cenario } = cenarioId
    ? await supabase
        .from("cenarios")
        .select("*, clientes(*), voos(*), transporte(*), passeios(*)")
        .eq("id", cenarioId)
        .maybeSingle()
    : { data: null };

  const { clientes: cliente, ...dadosCenario } = cenario ?? { clientes: {} };
  const dados = montarDados(cliente ?? {}, dadosCenario);

  return (
    <main className="app-canvas min-h-screen px-4 py-8">
      <div className="animate-rise mx-auto mb-6 flex max-w-[1400px] flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-surface/85 px-5 py-3.5 shadow-lg backdrop-blur-xl">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-brand-navy">
            {template.nome}
          </h1>
          <p className="text-sm text-muted">
            Arraste os campos sobre a arte para posicioná-los.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <SeletorCenario cenarios={cenarios} atual={cenarioId} />
          <Link href="/templates" className={buttonClass("outline", "sm")}>
            Voltar
          </Link>
        </div>
      </div>

      <EditorCampos template={template as PropostaTemplate} dados={dados} />
    </main>
  );
}
