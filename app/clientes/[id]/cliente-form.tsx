"use client";

import { useActionState, useEffect, useState } from "react";
import { Modal } from "../../components/modal";
import { useToast } from "../../components/toast";
import type { Cliente } from "../clientes-table";
import { formatTelefone } from "../telefone";
import { updateCliente, type ClienteFormState } from "./actions";

const fieldClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/30";

const labelClass = "mb-1 block text-sm font-medium text-zinc-700";

function Field({
  name,
  label,
  type = "text",
  defaultValue,
  ...rest
}: {
  name: string;
  label: string;
  type?: string;
  defaultValue?: string | number | null;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "defaultValue">) {
  return (
    <div>
      <label htmlFor={name} className={labelClass}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue ?? ""}
        className={fieldClass}
        {...rest}
      />
    </div>
  );
}

function TelefoneField({ defaultValue }: { defaultValue: string | null }) {
  const [value, setValue] = useState(() => formatTelefone(defaultValue));

  return (
    <div>
      <label htmlFor="telefone" className={labelClass}>
        Telefone
      </label>
      <input
        id="telefone"
        name="telefone"
        type="tel"
        inputMode="numeric"
        value={value}
        onChange={(event) => setValue(formatTelefone(event.target.value))}
        placeholder="(55) 11 9 9550-0339"
        maxLength={19}
        className={fieldClass}
      />
    </div>
  );
}

export function ClientePainel({ cliente }: { cliente: Cliente }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <section className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 px-6 py-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Dados do cliente
          </h2>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-navy px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-brand-blue"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
            </svg>
            Editar
          </button>
        </header>

        <dl className="grid gap-x-6 gap-y-5 px-6 py-5 sm:grid-cols-2 lg:grid-cols-3">
          <Info label="E-mail" value={cliente.email} />
          <Info label="Telefone" value={formatTelefone(cliente.telefone)} />
          <Info label="Perfil" value={cliente.perfil} />
          <Info
            label="Período para viajar"
            value={cliente.periodo_para_viajar}
          />
          <Info label="Viajantes" value={viajantes(cliente)} />
          <Info label="Orçamento" value={moeda(cliente.orcamento)} />
          <Info label="Etapa" value={cliente.etapa} />
          <Info label="Primeiro contato" value={data(cliente.data_contato)} />
          <Info
            label="Último contato"
            value={data(cliente.data_ultimo_contato)}
          />
        </dl>
      </section>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Editar cliente"
        description={cliente.nome}
        size="lg"
      >
        <ClienteForm cliente={cliente} onSaved={() => setOpen(false)} />
      </Modal>
    </>
  );
}

function ClienteForm({
  cliente,
  onSaved,
}: {
  cliente: Cliente;
  onSaved: () => void;
}) {
  const [state, formAction, pending] = useActionState<
    ClienteFormState,
    FormData
  >(updateCliente, undefined);
  const toast = useToast();

  useEffect(() => {
    if (state?.success) {
      toast(state.success);
      onSaved();
    }
  }, [state, toast, onSaved]);

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="id" value={cliente.id} />

      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-brand-red">
          {state.error}
        </p>
      )}

      <section className="space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
          Contato
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            name="nome"
            label="Nome"
            required
            maxLength={120}
            defaultValue={cliente.nome}
          />
          <Field
            name="email"
            label="E-mail"
            type="email"
            maxLength={160}
            defaultValue={cliente.email}
          />
          <TelefoneField defaultValue={cliente.telefone} />
          <Field
            name="data_contato"
            label="Data do primeiro contato"
            type="date"
            defaultValue={cliente.data_contato}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
          Viagem
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field
            name="periodo_para_viajar"
            label="Período para viajar"
            maxLength={80}
            defaultValue={cliente.periodo_para_viajar}
          />
          <Field
            name="qtd_adultos"
            label="Adultos"
            type="number"
            min={0}
            defaultValue={cliente.qtd_adultos}
          />
          <Field
            name="qtd_criancas"
            label="Crianças"
            type="number"
            min={0}
            defaultValue={cliente.qtd_criancas}
          />
          <Field
            name="qtd_bebes"
            label="Bebês"
            type="number"
            min={0}
            defaultValue={cliente.qtd_bebes}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
          Negociação
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            name="perfil"
            label="Perfil"
            maxLength={80}
            defaultValue={cliente.perfil}
          />
          <Field
            name="orcamento"
            label="Orçamento (R$)"
            type="number"
            min={0}
            step="0.01"
            defaultValue={cliente.orcamento}
          />
          <Field
            name="etapa"
            label="Etapa"
            maxLength={80}
            defaultValue={cliente.etapa}
          />
          <Field
            name="data_ultimo_contato"
            label="Data do último contato"
            type="date"
            defaultValue={cliente.data_ultimo_contato}
          />
        </div>
      </section>

      <div className="flex justify-end gap-2 border-t border-zinc-200 pt-4">
        <button
          type="button"
          onClick={onSaved}
          className="rounded-lg px-4 py-2.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-brand-red px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-navy disabled:opacity-60"
        >
          {pending ? "Salvando..." : "Salvar alterações"}
        </button>
      </div>
    </form>
  );
}

function Info({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-zinc-400">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm text-zinc-800">{value || "—"}</dd>
    </div>
  );
}

function moeda(value: number | string | null) {
  const amount = Number(value);
  if (value === null || !Number.isFinite(amount)) return null;

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount);
}

// A coluna vem como "YYYY-MM-DD"; new Date() deslocaria o dia pelo fuso.
function data(value: string | null) {
  if (!value) return null;

  const [ano, mes, dia] = value.slice(0, 10).split("-");
  return `${dia}/${mes}/${ano}`;
}

function viajantes(cliente: Cliente) {
  const partes = [
    cliente.qtd_adultos ? `${cliente.qtd_adultos} adt` : null,
    cliente.qtd_criancas ? `${cliente.qtd_criancas} chd` : null,
    cliente.qtd_bebes ? `${cliente.qtd_bebes} inf` : null,
  ].filter(Boolean);

  return partes.length > 0 ? partes.join(" · ") : null;
}
