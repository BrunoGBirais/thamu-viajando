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
    <label className="flex items-center gap-2 text-sm text-zinc-600">
      Amostra
      <select
        value={atual ?? ""}
        onChange={(event) =>
          router.replace(`?cenario=${event.target.value}`, { scroll: false })
        }
        className="rounded-lg border border-zinc-300 px-2 py-1 text-sm text-zinc-900 outline-none focus:border-brand-blue"
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
