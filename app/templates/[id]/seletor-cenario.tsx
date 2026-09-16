"use client";

import { useRouter } from "next/navigation";

export type CenarioAmostra = {
  id: number;
  destino: string | null;
  clientes: { nome: string } | null;
};

export function SeletorCenario({
  cenarios,
  atual,
}: {
  cenarios: CenarioAmostra[];
  atual?: number;
}) {
  const router = useRouter();

  if (cenarios.length === 0) return null;

  return (
    <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-subtle">
      Amostra
      <select
        value={atual ?? ""}
        onChange={(event) =>
          router.replace(`?cenario=${event.target.value}`, { scroll: false })
        }
        className="rounded-xl border border-line bg-surface px-3 py-1.5 text-sm font-medium normal-case tracking-normal text-foreground shadow-2xs transition hover:border-line-strong focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/15 focus-visible:outline-none"
      >
        {cenarios.map((cenario) => (
          <option key={cenario.id} value={cenario.id}>
            {cenario.clientes?.nome ?? "Sem cliente"} ·{" "}
            {cenario.destino ?? "Sem destino"}
          </option>
        ))}
      </select>
    </label>
  );
}
