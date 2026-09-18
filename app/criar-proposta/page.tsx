import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { carregarDadosProposta } from "@/lib/proposta/dados";
import type { ValoresManuais } from "@/lib/proposta/template";
import { AppHeader } from "../components/app-header";
import { Card, PageHeader } from "../components/ui/card";
import {
  PropostaWizard,
  type ClienteOpcao,
  type TemplateOpcao,
} from "./proposta-wizard";

export default async function CriarPropostaPage({
  searchParams,
}: {
  searchParams: Promise<{ cenario?: string; template?: string }>;
}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    redirect("/login");
  }

  const email = data.claims.email as string | undefined;
  const metadata = data.claims.user_metadata as
    | { full_name?: string }
    | undefined;

  const { data: isAdmin } = await supabase.rpc("thamu_viajando_is_admin");

  const [{ data: clienteRows, error: clientesError }, { data: templateRows }, { data: valorRows }] =
    await Promise.all([
      supabase
        .from("clientes")
        .select("id, nome, cenarios(id, destino, data_inicio, data_fim, hotel_nome)")
        .order("nome", { ascending: true }),
      supabase
        .from("proposta_templates")
        .select("id, nome, paginas, campos")
        .eq("ativo", true)
        .order("nome", { ascending: true }),
      supabase.from("proposta_valores").select("cenario_id, template_id, valores"),
    ]);

  if (clientesError) {
    console.error("Falha ao carregar clientes:", clientesError);
  }

  const clientes = (clienteRows ?? []) as unknown as ClienteOpcao[];
  const templates = (templateRows ?? []) as unknown as TemplateOpcao[];
  const valoresSalvos = Object.fromEntries(
    (valorRows ?? []).map((row) => [
      `${row.cenario_id}:${row.template_id}`,
      (row.valores ?? {}) as ValoresManuais,
    ])
  );

  // Voltar da proposta impressa reabre o wizard já preenchido.
  const busca = await searchParams;
  const cenarioAlvo = Number(busca.cenario);
  const clienteDoCenario = clientes.find((item) =>
    item.cenarios.some((cenario) => cenario.id === cenarioAlvo)
  );
  const templateAlvo = templates.find(
    (item) => String(item.id) === busca.template
  );

  const inicial = clienteDoCenario
    ? {
        clienteId: String(clienteDoCenario.id),
        cenarioId: String(cenarioAlvo),
        templateId: templateAlvo ? String(templateAlvo.id) : "",
        dados: await carregarDadosProposta(supabase, cenarioAlvo),
      }
    : undefined;

  return (
    <>
      <AppHeader
        email={email}
        name={metadata?.full_name}
        isAdmin={isAdmin === true}
      />
      <main className="app-canvas flex-1 px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-5xl space-y-8">
          <PageHeader
            title="Criar proposta"
            description="Escolha o cliente, a proposta e o template do Canva."
          />

          {clientesError ? (
            <Card className="border-brand-red/30 bg-brand-red/6 p-6 font-semibold text-[#b3241c]">
              Não foi possível carregar os clientes: {clientesError.message}
            </Card>
          ) : (
            <PropostaWizard
              clientes={clientes}
              templates={templates}
              valoresSalvos={valoresSalvos}
              inicial={inicial}
            />
          )}
        </div>
      </main>
    </>
  );
}
