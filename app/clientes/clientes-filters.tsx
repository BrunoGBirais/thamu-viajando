"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ORCAMENTO_FAIXAS } from "./filtros";

const fieldClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/30";

const labelClass =
  "mb-1 block text-xs font-semibold uppercase tracking-wide text-zinc-500";

export function ClientesFilters({
  perfis,
  etapas,
}: {
  perfis: string[];
  etapas: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const buscaParam = searchParams.get("busca") ?? "";
  const perfil = searchParams.get("perfil") ?? "";
  const etapa = searchParams.get("etapa") ?? "";
  const orcamento = searchParams.get("orcamento") ?? "";

  const [busca, setBusca] = useState(buscaParam);

  const setParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());

      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }

      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname);
    },
    [pathname, router, searchParams]
  );

  // Espera o usuário parar de digitar antes de navegar.
  useEffect(() => {
    if (busca === buscaParam) return;

    const timer = setTimeout(() => setParam("busca", busca), 350);
    return () => clearTimeout(timer);
  }, [busca, buscaParam, setParam]);

  const hasFilters = Boolean(busca || perfil || etapa || orcamento);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <label htmlFor="busca" className={labelClass}>
            Buscar
          </label>
          <input
            id="busca"
            type="search"
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            placeholder="Nome, e-mail ou telefone"
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="perfil" className={labelClass}>
            Perfil
          </label>
          <select
            id="perfil"
            value={perfil}
            onChange={(event) => setParam("perfil", event.target.value)}
            className={fieldClass}
          >
            <option value="">Todos</option>
            {perfis.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="etapa" className={labelClass}>
            Etapa
          </label>
          <select
            id="etapa"
            value={etapa}
            onChange={(event) => setParam("etapa", event.target.value)}
            className={fieldClass}
          >
            <option value="">Todas</option>
            {etapas.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="orcamento" className={labelClass}>
            Orçamento
          </label>
          <select
            id="orcamento"
            value={orcamento}
            onChange={(event) => setParam("orcamento", event.target.value)}
            className={fieldClass}
          >
            <option value="">Qualquer</option>
            {ORCAMENTO_FAIXAS.map((faixa) => (
              <option key={faixa.value} value={faixa.value}>
                {faixa.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {hasFilters && (
        <button
          type="button"
          onClick={() => {
            setBusca("");
            router.replace(pathname);
          }}
          className="mt-4 text-sm font-semibold text-brand-red transition hover:underline"
        >
          Limpar filtros
        </button>
      )}
    </div>
  );
}
