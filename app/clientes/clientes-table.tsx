import Link from "next/link";
import { formatTelefone } from "./telefone";

export type Cliente = {
  id: number;
  nome: string;
  email: string;
  telefone: string | null;
  data_contato: string | null;
  periodo_para_viajar: string | null;
  qtd_adultos: number | null;
  qtd_criancas: number | null;
  qtd_bebes: number | null;
  perfil: string | null;
  orcamento: number | string | null;
  etapa: string | null;
  data_ultimo_contato: string | null;
  acao: string | null;
};

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

// Colunas DATE chegam como "YYYY-MM-DD"; evita o deslocamento de fuso do Date.
function formatDate(value: string | null) {
  if (!value) return "—";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function formatMoney(value: number | string | null) {
  if (value === null) return "—";
  const parsed = typeof value === "string" ? Number(value) : value;
  return Number.isNaN(parsed) ? "—" : currency.format(parsed);
}

function formatTravelers(cliente: Cliente) {
  const parts: string[] = [];

  if (cliente.qtd_adultos) parts.push(`${cliente.qtd_adultos} adt`);
  if (cliente.qtd_criancas) parts.push(`${cliente.qtd_criancas} chd`);
  if (cliente.qtd_bebes) parts.push(`${cliente.qtd_bebes} inf`);

  return parts.length > 0 ? parts.join(" · ") : "—";
}

export function ClientesTable({
  clientes,
  emptyMessage = "Nenhum cliente cadastrado.",
}: {
  clientes: Cliente[];
  emptyMessage?: string;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
          <tr>
            <th className="px-4 py-3 font-semibold">Cliente</th>
            <th className="px-4 py-3 font-semibold">Telefone</th>
            <th className="px-4 py-3 font-semibold">Período</th>
            <th className="px-4 py-3 font-semibold">Viajantes</th>
            <th className="px-4 py-3 font-semibold">Orçamento</th>
            <th className="px-4 py-3 font-semibold">Etapa</th>
            <th className="px-4 py-3 font-semibold">Último contato</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {clientes.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-4 py-10 text-center text-zinc-500">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            clientes.map((cliente) => (
              <tr key={cliente.id} className="align-top hover:bg-zinc-50">
                <td className="px-4 py-3">
                  <Link
                    href={`/clientes/${cliente.id}`}
                    className="font-medium text-brand-navy transition hover:text-brand-blue hover:underline"
                  >
                    {cliente.nome}
                  </Link>
                  {cliente.perfil && (
                    <p className="text-xs text-zinc-500">{cliente.perfil}</p>
                  )}
                </td>
                <td className="px-4 py-3 text-zinc-600">
                  {formatTelefone(cliente.telefone) || "—"}
                </td>
                <td className="px-4 py-3 text-zinc-600">
                  {cliente.periodo_para_viajar ?? "—"}
                </td>
                <td className="px-4 py-3 text-zinc-600">
                  {formatTravelers(cliente)}
                </td>
                <td className="px-4 py-3 text-zinc-600">
                  {formatMoney(cliente.orcamento)}
                </td>
                <td className="px-4 py-3">
                  {cliente.etapa ? (
                    <span className="rounded-full bg-brand-blue/10 px-2.5 py-1 text-xs font-semibold text-brand-navy">
                      {cliente.etapa}
                    </span>
                  ) : (
                    <span className="text-zinc-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-zinc-600">
                  {formatDate(cliente.data_ultimo_contato)}
                  {cliente.acao && (
                    <p className="text-xs text-zinc-500">{cliente.acao}</p>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
