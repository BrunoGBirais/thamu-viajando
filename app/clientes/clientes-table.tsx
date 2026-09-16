import Link from "next/link";
import { Badge } from "../components/ui/badge";
import { EmptyState } from "../components/ui/card";
import { Table, TableShell, Td, Th, Tr } from "../components/ui/table";
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
    <TableShell className="animate-rise">
      <Table className="min-w-[900px] text-left">
        <thead>
          <tr>
            <Th>Cliente</Th>
            <Th>Telefone</Th>
            <Th>Período</Th>
            <Th>Viajantes</Th>
            <Th>Orçamento</Th>
            <Th>Etapa</Th>
            <Th>Último contato</Th>
          </tr>
        </thead>
        <tbody>
          {clientes.length === 0 ? (
            <tr>
              <td colSpan={7} className="p-4">
                <EmptyState
                  title={emptyMessage}
                  className="border-0 bg-transparent py-10"
                />
              </td>
            </tr>
          ) : (
            clientes.map((cliente) => (
              <Tr key={cliente.id} className="align-top">
                <Td>
                  <Link
                    href={`/clientes/${cliente.id}`}
                    className="font-semibold text-brand-navy transition hover:text-brand-blue"
                  >
                    {cliente.nome}
                  </Link>
                  {cliente.perfil && (
                    <p className="mt-0.5 text-xs text-subtle">{cliente.perfil}</p>
                  )}
                </Td>
                <Td className="text-muted">
                  {formatTelefone(cliente.telefone) || "—"}
                </Td>
                <Td className="text-muted">
                  {cliente.periodo_para_viajar ?? "—"}
                </Td>
                <Td className="text-muted">{formatTravelers(cliente)}</Td>
                <Td className="font-medium text-foreground">
                  {formatMoney(cliente.orcamento)}
                </Td>
                <Td>
                  {cliente.etapa ? (
                    <Badge tone="blue">{cliente.etapa}</Badge>
                  ) : (
                    <span className="text-subtle">—</span>
                  )}
                </Td>
                <Td className="text-muted">
                  {formatDate(cliente.data_ultimo_contato)}
                  {cliente.acao && (
                    <p className="mt-0.5 text-xs text-subtle">{cliente.acao}</p>
                  )}
                </Td>
              </Tr>
            ))
          )}
        </tbody>
      </Table>
    </TableShell>
  );
}
