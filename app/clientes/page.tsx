import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "../components/app-header";
import { ClientesFilters } from "./clientes-filters";
import { ClientesTable, type Cliente } from "./clientes-table";
import { ORCAMENTO_FAIXAS, escapeFilterValue, readParam } from "./filtros";

function distinct(values: (string | null)[]) {
  return [...new Set(values.filter((value): value is string => Boolean(value)))]
    .sort((a, b) => a.localeCompare(b, "pt-BR"));
}

export default async function ClientesPage({
  searchParams,
}: PageProps<"/clientes">) {
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

  const params = await searchParams;
  const busca = readParam(params.busca);
  const perfil = readParam(params.perfil);
  const etapa = readParam(params.etapa);
  const faixa = ORCAMENTO_FAIXAS.find(
    (item) => item.value === readParam(params.orcamento)
  );

  let query = supabase.from("clientes").select("*");

  if (busca) {
    const termo = escapeFilterValue(busca);
    query = query.or(
      `nome.ilike."%${termo}%",email.ilike."%${termo}%",telefone.ilike."%${termo}%"`
    );
  }
  if (perfil) {
    query = query.eq("perfil", perfil);
  }
  if (etapa) {
    query = query.eq("etapa", etapa);
  }
  if (faixa) {
    query = query.gte("orcamento", faixa.min);
    if (faixa.max !== null) {
      query = query.lt("orcamento", faixa.max);
    }
  }

  const { data: rows, error } = await query.order("id", { ascending: false });
  const clientes = (rows ?? []) as Cliente[];

  // Opções dos selects saem da tabela inteira, não do resultado filtrado.
  const { data: optionRows } = await supabase
    .from("clientes")
    .select("perfil, etapa");
  const opcoes = (optionRows ?? []) as Pick<Cliente, "perfil" | "etapa">[];

  const hasFilters = Boolean(busca || perfil || etapa || faixa);

  return (
    <>
      <AppHeader
        email={email}
        name={metadata?.full_name}
        isAdmin={isAdmin === true}
      />
      <main className="flex-1 bg-zinc-50 px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-6xl space-y-6">
          <div>
            <h1 className="text-2xl font-semibold text-brand-navy">
              Gestão de clientes
            </h1>
            <p className="mt-1 text-sm text-zinc-600">
              {clientes.length === 1
                ? "1 cliente encontrado."
                : `${clientes.length} clientes encontrados.`}
            </p>
          </div>

          <ClientesFilters
            perfis={distinct(opcoes.map((item) => item.perfil))}
            etapas={distinct(opcoes.map((item) => item.etapa))}
          />

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-brand-red">
              Não foi possível carregar os clientes: {error.message}
            </div>
          ) : (
            <ClientesTable
              clientes={clientes}
              emptyMessage={
                hasFilters
                  ? "Nenhum cliente corresponde aos filtros."
                  : "Nenhum cliente cadastrado."
              }
            />
          )}
        </div>
      </main>
    </>
  );
}
