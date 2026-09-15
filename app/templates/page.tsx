import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Campo } from "@/lib/proposta/template";
import { AppHeader } from "../components/app-header";
import { TemplatesManager, type TemplateRow } from "./templates-manager";

type TemplateRecord = Omit<TemplateRow, "totalCampos"> & { campos: Campo[] };

export default async function TemplatesPage() {
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

  const { data: rows, error } = await supabase
    .from("proposta_templates")
    .select("id, nome, descricao, paginas, largura_mm, altura_mm, ativo, campos")
    .order("nome");

  const templates = ((rows ?? []) as unknown as TemplateRecord[]).map(
    ({ campos, ...template }) => ({
      ...template,
      totalCampos: Array.isArray(campos) ? campos.length : 0,
    })
  );

  return (
    <>
      <AppHeader
        email={email}
        name={metadata?.full_name}
        isAdmin={isAdmin === true}
      />
      <main className="flex-1 bg-zinc-50 px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-6xl space-y-6">
          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-brand-red">
              Não foi possível carregar os modelos.
            </div>
          ) : (
            <TemplatesManager templates={templates} />
          )}
        </div>
      </main>
    </>
  );
}
