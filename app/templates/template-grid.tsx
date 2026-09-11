import Image from "next/image";

export type Template = {
  id: string;
  title: string;
  thumbnailUrl?: string;
  thumbnailWidth?: number;
  thumbnailHeight?: number;
  viewUrl?: string;
  pageCount?: number;
};

export function TemplateGrid({ templates }: { templates: Template[] }) {
  if (templates.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-10 text-center text-zinc-500 shadow-sm">
        Nenhum template encontrado.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {templates.map((template) => (
        <TemplateCard key={template.id} template={template} />
      ))}
    </div>
  );
}

function TemplateCard({ template }: { template: Template }) {
  const content = (
    <>
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-zinc-100">
        {template.thumbnailUrl ? (
          <Image
            src={template.thumbnailUrl}
            alt={template.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 33vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-zinc-400">
            Sem prévia
          </div>
        )}
      </div>

      <div className="p-4">
        <p className="truncate font-medium text-brand-navy">{template.title}</p>
        {template.pageCount !== undefined && (
          <p className="mt-1 text-xs text-zinc-500">
            {template.pageCount === 1
              ? "1 página"
              : `${template.pageCount} páginas`}
          </p>
        )}
      </div>
    </>
  );

  const cardClass =
    "group block overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition hover:border-brand-blue hover:shadow-md";

  if (!template.viewUrl) {
    return <div className={cardClass}>{content}</div>;
  }

  return (
    <a
      href={template.viewUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={cardClass}
    >
      {content}
    </a>
  );
}
