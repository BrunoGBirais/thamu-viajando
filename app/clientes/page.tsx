import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "../components/app-header";
import { Card, PageHeader } from "../components/ui/card";
import { ClientesFilters } from "./clientes-filters";
import { ClientesPagination } from "./clientes-pagination";
import { ClientesTable, type Cliente } from "./clientes-table";
import {
  ORCAMENTO_FAIXAS,
  PAGE_SIZE,
  escapeFilterValue,
  readPage,
  readParam,
} from "./filtros";

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
  const paginaPedida = readPage(params.pagina);

  // O builder do PostgREST é consumido ao ser aguardado, então cada consulta recria os filtros.
  const buildQuery = (
    colunas: string,
    options?: { count: "exact"; head?: boolean }
  ) => {
    let query = supabase.from("clientes").select(colunas, options);

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

    return query;
  };

  const { count } = await buildQuery("id", { count: "exact", head: true });

  const totalClientes = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalClientes / PAGE_SIZE));
  const pagina = Math.min(paginaPedida, totalPages);
  const offset = (pagina - 1) * PAGE_SIZE;

  const { data: rows, error } = await buildQuery("*")
    .order("id", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);
  const clientes = (rows ?? []) as unknown as Cliente[];

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
      <main className="app-canvas flex-1 px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-6xl space-y-8">
          <PageHeader
            eyebrow="Carteira"
            title="Gestão de clientes"
            description={
              totalClientes === 1
                ? "1 cliente encontrado."
                : `${totalClientes} clientes encontrados.`
            }
          />

          <ClientesFilters
            perfis={distinct(opcoes.map((item) => item.perfil))}
            etapas={distinct(opcoes.map((item) => item.etapa))}
          />

          {error ? (
            <Card className="border-brand-red/25 bg-brand-red/5 p-6 text-sm font-medium text-brand-red">
              Não foi possível carregar os clientes: {error.message}
            </Card>
          ) : (
            <>
              <ClientesTable
                clientes={clientes}
                emptyMessage={
                  hasFilters
                    ? "Nenhum cliente corresponde aos filtros."
                    : "Nenhum cliente cadastrado."
                }
              />

              <ClientesPagination
                page={pagina}
                totalPages={totalPages}
                total={totalClientes}
                from={offset + 1}
                to={offset + clientes.length}
              />
            </>
          )}
        </div>
      </main>
    </>
  );
}
