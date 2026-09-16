"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Field, Input, Select } from "@/app/components/ui/form";
import { ORCAMENTO_FAIXAS } from "./filtros";

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

      params.delete("pagina");

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
    <Card className="animate-rise p-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Field label="Buscar" htmlFor="busca" className="lg:col-span-2">
          <Input
            id="busca"
            type="search"
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            placeholder="Nome, e-mail ou telefone"
          />
        </Field>

        <Field label="Perfil" htmlFor="perfil">
          <Select
            id="perfil"
            value={perfil}
            onChange={(event) => setParam("perfil", event.target.value)}
          >
            <option value="">Todos</option>
            {perfis.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Etapa" htmlFor="etapa">
          <Select
            id="etapa"
            value={etapa}
            onChange={(event) => setParam("etapa", event.target.value)}
          >
            <option value="">Todas</option>
            {etapas.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Orçamento" htmlFor="orcamento">
          <Select
            id="orcamento"
            value={orcamento}
            onChange={(event) => setParam("orcamento", event.target.value)}
          >
            <option value="">Qualquer</option>
            {ORCAMENTO_FAIXAS.map((faixa) => (
              <option key={faixa.value} value={faixa.value}>
                {faixa.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setBusca("");
            router.replace(pathname);
          }}
          className="mt-4 text-brand-red hover:bg-brand-red/8 hover:text-brand-red"
        >
          Limpar filtros
        </Button>
      )}
    </Card>
  );
}
