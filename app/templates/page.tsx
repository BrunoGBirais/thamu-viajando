import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "../components/app-header";
import { TemplateGrid, type Template } from "./template-grid";

type CanvaItem = {
  type?: string;
  design?: {
    id?: string;
    title?: string;
    thumbnail?: { url?: string; width?: number; height?: number };
    urls?: { view_url?: string; edit_url?: string };
    page_count?: number;
  };
};

// O n8n pode responder com o objeto do Canva ou com ele dentro de um array.
function extractDesigns(payload: unknown): Template[] {
  const root = Array.isArray(payload) ? payload[0] : payload;
  const items = (root as { items?: unknown } | null)?.items;

  if (!Array.isArray(items)) return [];

  return (items as CanvaItem[])
    .filter((item) => item.type === "design" && item.design?.id)
    .map((item) => ({
      id: item.design!.id!,
      title: item.design!.title ?? "Sem título",
      thumbnailUrl: item.design!.thumbnail?.url,
      thumbnailWidth: item.design!.thumbnail?.width,
      thumbnailHeight: item.design!.thumbnail?.height,
      viewUrl: item.design!.urls?.view_url,
      pageCount: item.design!.page_count,
    }));
}

async function loadTemplates(): Promise<
  { templates: Template[]; error?: never } | { templates?: never; error: string }
> {
  const webhookUrl = process.env.N8N_TEMPLATES_WEBHOOK_URL;

  if (!webhookUrl) {
    return {
      error:
        "Defina N8N_TEMPLATES_WEBHOOK_URL no .env.local com a URL do webhook do n8n.",
    };
  }

  try {
    const response = await fetch(webhookUrl, { cache: "no-store" });

    if (!response.ok) {
      return { error: `O webhook respondeu com status ${response.status}.` };
    }

    return { templates: extractDesigns(await response.json()) };
  } catch (cause) {
    console.error("loadTemplates:", cause);
    return { error: "Não foi possível contatar o webhook do n8n." };
  }
}

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
