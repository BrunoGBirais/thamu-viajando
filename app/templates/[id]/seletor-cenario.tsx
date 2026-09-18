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
    <label className="flex items-center gap-2 text-sm font-semibold text-muted">
      Amostra
      <select
        value={atual ?? ""}
        onChange={(event) =>
          router.replace(`?cenario=${event.target.value}`, { scroll: false })
        }
        className="rounded-lg border border-line-strong bg-surface px-3 py-1.5 text-sm font-semibold text-foreground transition-colors hover:border-[#9fb0c6] focus:border-brand-navy focus:shadow-[0_0_0_3px_rgb(41_169_224/0.28)] focus-visible:outline-none"
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
