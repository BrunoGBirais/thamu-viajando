import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Campo } from "@/lib/proposta/template";
import { AppHeader } from "../components/app-header";
import { Card } from "../components/ui/card";
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
      <main className="app-canvas flex-1 px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-6xl space-y-6">
          {error ? (
            <Card className="border-brand-red/30 bg-brand-red/6 p-6 font-semibold text-[#b3241c]">
              Não foi possível carregar os modelos.
            </Card>
          ) : (
            <TemplatesManager templates={templates} />
          )}
        </div>
      </main>
    </>
  );
}
