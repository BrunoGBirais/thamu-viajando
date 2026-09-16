import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { ValoresManuais } from "@/lib/proposta/template";
import { AppHeader } from "../components/app-header";
import {
  PropostaWizard,
  type ClienteOpcao,
  type TemplateOpcao,
} from "./proposta-wizard";

export default async function CriarPropostaPage() {
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

  return (
    <>
      <AppHeader
        email={email}
        name={metadata?.full_name}
        isAdmin={isAdmin === true}
      />
      <main className="flex-1 bg-zinc-50 px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-5xl space-y-6">
          <div>
            <h1 className="text-2xl font-semibold text-brand-navy">
              Criar proposta
            </h1>
            <p className="mt-1 text-sm text-zinc-600">
              Escolha o cliente, a proposta e o template do Canva.
            </p>
          </div>

          {clientesError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-brand-red">
              Não foi possível carregar os clientes: {clientesError.message}
            </div>
          ) : (
            <PropostaWizard
              clientes={clientes}
              templates={templates}
              valoresSalvos={valoresSalvos}
            />
          )}
        </div>
      </main>
    </>
  );
}
