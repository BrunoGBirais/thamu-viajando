export type Template = {
  id: string;
  title: string;
  thumbnailUrl?: string;
  thumbnailWidth?: number;
  thumbnailHeight?: number;
  viewUrl?: string;
  pageCount?: number;
};

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

export async function loadTemplates(): Promise<
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
