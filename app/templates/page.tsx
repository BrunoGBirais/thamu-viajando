import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loadTemplates } from "@/lib/n8n/templates";
import { AppHeader } from "../components/app-header";
import { TemplateGrid } from "./template-grid";

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
  const result = await loadTemplates();

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
            <h1 className="text-2xl font-semibold text-brand-navy">Templates</h1>
            <p className="mt-1 text-sm text-zinc-600">
              Modelos disponíveis na pasta do Canva.
            </p>
          </div>

          {result.error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-brand-red">
              {result.error}
            </div>
          ) : (
            <TemplateGrid templates={result.templates ?? []} />
          )}
        </div>
      </main>
    </>
  );
}
