import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "../../components/app-header";
import type { Cliente } from "../clientes-table";
import { CenariosSection, type Cenario } from "./cenarios-section";
import { ClientePainel } from "./cliente-form";

export default async function ClientePage({
  params,
}: {
  params: Promise<{ id: string }>;
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

  const id = Number((await params).id);

  if (!Number.isInteger(id)) {
    notFound();
  }

  const { data: row } = await supabase
    .from("clientes")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!row) {
    notFound();
  }

  const cliente = row as Cliente;

  const { data: cenarioRows, error: cenarioError } = await supabase
    .from("cenarios")
    .select("*, voos(*), transporte(*), passeios(*)")
    .eq("cliente_id", id)
    .order("data_inicio", { ascending: true });

  if (cenarioError) {
    console.error("Falha ao carregar cenarios:", cenarioError);
  }

  return (
    <>
      <AppHeader
        email={email}
        name={metadata?.full_name}
        isAdmin={isAdmin === true}
      />
      <main className="app-canvas flex-1 px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-5xl space-y-8">
          <div className="border-b border-line pb-6">
            <Link
              href="/clientes"
              className="inline-flex items-center gap-1 text-sm font-semibold text-brand-blue-ink underline-offset-4 transition-colors hover:underline"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
              Voltar para clientes
            </Link>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <h1 className="text-[2rem] font-extrabold text-brand-navy sm:text-[2.5rem]">
                {cliente.nome}
              </h1>
              {cliente.etapa && (
                <span className="rounded-md border border-brand-blue/35 bg-brand-blue/8 px-2 py-0.5 text-sm font-semibold text-brand-blue-ink">
                  {cliente.etapa}
                </span>
              )}
              {cliente.perfil && (
                <span className="rounded-md border border-line-strong bg-surface-muted px-2 py-0.5 text-sm font-semibold text-muted">
                  {cliente.perfil}
                </span>
              )}
            </div>
          </div>

          <ClientePainel cliente={cliente} />

          <CenariosSection
            clienteId={cliente.id}
            cenarios={(cenarioRows ?? []) as Cenario[]}
          />
        </div>
      </main>
    </>
  );
}
