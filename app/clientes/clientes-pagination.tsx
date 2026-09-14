"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

const buttonClass =
  "rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-semibold text-brand-navy transition hover:border-brand-blue hover:text-brand-blue disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-zinc-300 disabled:hover:text-brand-navy";

export function ClientesPagination({
  page,
  totalPages,
  total,
  from,
  to,
}: {
  page: number;
  totalPages: number;
  total: number;
  from: number;
  to: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function goTo(target: number) {
    const params = new URLSearchParams(searchParams.toString());

    if (target > 1) {
      params.set("pagina", String(target));
    } else {
      params.delete("pagina");
    }

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  }

  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-sm text-zinc-600">
        Exibindo {from}–{to} de {total}
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => goTo(page - 1)}
          disabled={page <= 1}
          className={buttonClass}
        >
          Anterior
        </button>
        <span className="text-sm text-zinc-600">
          Página {page} de {totalPages}
        </span>
        <button
          type="button"
          onClick={() => goTo(page + 1)}
          disabled={page >= totalPages}
          className={buttonClass}
        >
          Próxima
        </button>
      </div>
    </div>
  );
}
