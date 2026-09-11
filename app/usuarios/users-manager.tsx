"use client";

import { useActionState, useEffect, useState, type ReactNode } from "react";
import {
  createUser,
  deleteUser,
  updateUser,
  type UserFormState,
} from "./actions";

export type UserRow = {
  user_id: string;
  email: string;
  full_name: string;
  role: string;
  createdAtLabel: string;
};

const inputClass =
  "w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/30";

const labelClass = "block text-sm font-medium text-zinc-700";

export function UsersManager({
  users,
  currentUserId,
}: {
  users: UserRow[];
  currentUserId: string;
}) {
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [deleting, setDeleting] = useState<UserRow | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-brand-navy">
            Gestão de usuários
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            {users.length === 1
              ? "1 usuário cadastrado."
              : `${users.length} usuários cadastrados.`}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setCreating(true)}
          className="rounded-lg bg-brand-red px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-navy"
        >
          Novo usuário
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Nome</th>
              <th className="px-4 py-3 font-semibold">E-mail</th>
              <th className="px-4 py-3 font-semibold">Perfil</th>
              <th className="px-4 py-3 font-semibold">Criado em</th>
              <th className="px-4 py-3 text-right font-semibold">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-zinc-500">
                  Nenhum usuário encontrado.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.user_id} className="hover:bg-zinc-50">
                  <td className="px-4 py-3 font-medium text-brand-navy">
                    {user.full_name || "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-600">{user.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        user.role === "admin"
                          ? "rounded-full bg-brand-navy px-2.5 py-1 text-xs font-semibold text-white"
                          : "rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-600"
                      }
                    >
                      {user.role === "admin" ? "Administrador" : "Visualizador"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {user.createdAtLabel}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditing(user)}
                        className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:border-brand-blue hover:text-brand-blue"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleting(user)}
                        disabled={user.user_id === currentUserId}
                        title={
                          user.user_id === currentUserId
                            ? "Você não pode excluir o seu próprio usuário."
                            : undefined
                        }
                        className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:border-brand-red hover:text-brand-red disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-zinc-300 disabled:hover:text-zinc-700"
                      >
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {creating && <CreateDialog onClose={() => setCreating(false)} />}
      {editing && (
        <EditDialog
          user={editing}
          isSelf={editing.user_id === currentUserId}
          onClose={() => setEditing(null)}
        />
      )}
      {deleting && (
        <DeleteDialog user={deleting} onClose={() => setDeleting(null)} />
      )}
    </div>
  );
}

function Dialog({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Fechar"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/50"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full max-w-md overflow-hidden rounded-xl bg-white shadow-xl"
      >
        <div className="h-1 bg-gradient-to-r from-brand-red via-brand-yellow to-brand-blue" />
        <div className="p-6">
          <h2 className="text-lg font-semibold text-brand-navy">{title}</h2>
          <div className="mt-4">{children}</div>
        </div>
      </div>
    </div>
  );
}

function FormFeedback({ state }: { state: UserFormState }) {
  if (!state?.error) return null;

  return (
    <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-brand-red">
      {state.error}
    </p>
  );
}

function DialogActions({
  pending,
  confirmLabel,
  danger = false,
  onClose,
}: {
  pending: boolean;
  confirmLabel: string;
  danger?: boolean;
  onClose: () => void;
}) {
  return (
    <div className="flex justify-end gap-3 pt-2">
      <button
        type="button"
        onClick={onClose}
        className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
      >
        Cancelar
      </button>
      <button
        type="submit"
        disabled={pending}
        className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition disabled:opacity-60 ${
          danger
            ? "bg-brand-red hover:bg-red-700"
            : "bg-brand-navy hover:bg-brand-blue"
        }`}
      >
        {pending ? "Salvando..." : confirmLabel}
      </button>
    </div>
  );
}

function CreateDialog({ onClose }: { onClose: () => void }) {
  const [state, formAction, pending] = useActionState<UserFormState, FormData>(
    createUser,
    undefined
  );

  useEffect(() => {
    if (state?.success) onClose();
  }, [state, onClose]);

  return (
    <Dialog title="Novo usuário" onClose={onClose}>
      <form action={formAction} className="space-y-4">
        <FormFeedback state={state} />

        <div className="space-y-1">
          <label htmlFor="new-name" className={labelClass}>
            Nome
          </label>
          <input id="new-name" name="full_name" required className={inputClass} />
        </div>

        <div className="space-y-1">
          <label htmlFor="new-email" className={labelClass}>
            E-mail
          </label>
          <input
            id="new-email"
            name="email"
            type="email"
            required
            autoComplete="off"
            className={inputClass}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="new-password" className={labelClass}>
            Senha
          </label>
          <input
            id="new-password"
            name="password"
            type="password"
            minLength={8}
            required
            autoComplete="new-password"
            className={inputClass}
          />
          <p className="text-xs text-zinc-500">Mínimo de 8 caracteres.</p>
        </div>

        <label className="flex items-center gap-2 text-sm text-zinc-700">
          <input
            type="checkbox"
            name="is_admin"
            className="h-4 w-4 rounded border-zinc-300 accent-brand-navy"
          />
          Administrador
        </label>

        <DialogActions
          pending={pending}
          confirmLabel="Criar usuário"
          onClose={onClose}
        />
      </form>
    </Dialog>
  );
}

function EditDialog({
  user,
  isSelf,
  onClose,
}: {
  user: UserRow;
  isSelf: boolean;
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState<UserFormState, FormData>(
    updateUser,
    undefined
  );

  useEffect(() => {
    if (state?.success) onClose();
  }, [state, onClose]);

  return (
    <Dialog title="Editar usuário" onClose={onClose}>
      <form action={formAction} className="space-y-4">
        <FormFeedback state={state} />
        <input type="hidden" name="user_id" value={user.user_id} />

        <div className="space-y-1">
          <label className={labelClass}>E-mail</label>
          <p className="rounded-lg bg-zinc-100 px-3 py-2 text-sm text-zinc-600">
            {user.email}
          </p>
        </div>

        <div className="space-y-1">
          <label htmlFor="edit-name" className={labelClass}>
            Nome
          </label>
          <input
            id="edit-name"
            name="full_name"
            required
            defaultValue={user.full_name}
            className={inputClass}
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-zinc-700">
          <input
            type="checkbox"
            name="is_admin"
            defaultChecked={user.role === "admin"}
            disabled={isSelf}
            className="h-4 w-4 rounded border-zinc-300 accent-brand-navy disabled:opacity-50"
          />
          Administrador
        </label>
        {isSelf && (
          <p className="text-xs text-zinc-500">
            Você não pode alterar o seu próprio perfil de acesso.
          </p>
        )}

        <DialogActions
          pending={pending}
          confirmLabel="Salvar"
          onClose={onClose}
        />
      </form>
    </Dialog>
  );
}

function DeleteDialog({
  user,
  onClose,
}: {
  user: UserRow;
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState<UserFormState, FormData>(
    deleteUser,
    undefined
  );

  useEffect(() => {
    if (state?.success) onClose();
  }, [state, onClose]);

  return (
    <Dialog title="Excluir usuário" onClose={onClose}>
      <form action={formAction} className="space-y-4">
        <FormFeedback state={state} />
        <input type="hidden" name="user_id" value={user.user_id} />

        <p className="text-sm text-zinc-600">
          Tem certeza que deseja excluir{" "}
          <strong className="text-brand-navy">
            {user.full_name || user.email}
          </strong>
          ? Essa ação não pode ser desfeita.
        </p>

        <DialogActions
          pending={pending}
          confirmLabel="Excluir"
          danger
          onClose={onClose}
        />
      </form>
    </Dialog>
  );
}
