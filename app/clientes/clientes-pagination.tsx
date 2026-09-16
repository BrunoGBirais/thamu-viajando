"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/app/components/ui/button";

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
      <p className="text-sm text-muted">
        Exibindo {from}–{to} de {total}
      </p>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => goTo(page - 1)}
          disabled={page <= 1}
        >
          Anterior
        </Button>
        <span className="px-1 text-sm font-medium text-muted">
          Página {page} de {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => goTo(page + 1)}
          disabled={page >= totalPages}
        >
          Próxima
        </Button>
      </div>
    </div>
  );
}
