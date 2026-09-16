"use client";

import { useActionState, useEffect, useState } from "react";
import { Modal, ModalActions } from "@/app/components/modal";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { PageHeader } from "@/app/components/ui/card";
import { Field, FormFeedback, Input } from "@/app/components/ui/form";
import { Table, TableShell, Td, Th, Tr } from "@/app/components/ui/table";
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

const checkboxClass =
  "h-4 w-4 rounded-md border-line-strong accent-brand-navy disabled:opacity-50";

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
    <div className="space-y-8">
      <PageHeader
        eyebrow="Administração"
        title="Gestão de usuários"
        description={
          users.length === 1
            ? "1 usuário cadastrado."
            : `${users.length} usuários cadastrados.`
        }
        actions={
          <Button variant="primary" onClick={() => setCreating(true)}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            Novo usuário
          </Button>
        }
      />

      <TableShell className="animate-rise">
        <Table className="min-w-[640px] text-left">
          <thead>
            <tr>
              <Th>Nome</Th>
              <Th>E-mail</Th>
              <Th>Perfil</Th>
              <Th>Criado em</Th>
              <Th className="text-right">Ações</Th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted">
                  Nenhum usuário encontrado.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <Tr key={user.user_id}>
                  <Td className="font-semibold text-brand-navy">
                    {user.full_name || "—"}
                  </Td>
                  <Td className="text-muted">{user.email}</Td>
                  <Td>
                    <Badge tone={user.role === "admin" ? "navy" : "neutral"}>
                      {user.role === "admin" ? "Administrador" : "Visualizador"}
                    </Badge>
                  </Td>
                  <Td className="text-muted">{user.createdAtLabel}</Td>
                  <Td>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditing(user)}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleting(user)}
                        disabled={user.user_id === currentUserId}
                        title={
                          user.user_id === currentUserId
                            ? "Você não pode excluir o seu próprio usuário."
                            : undefined
                        }
                        className="text-brand-red hover:bg-brand-red/8 hover:text-brand-red"
                      >
                        Excluir
                      </Button>
                    </div>
                  </Td>
                </Tr>
              ))
            )}
          </tbody>
        </Table>
      </TableShell>

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

function CreateDialog({ onClose }: { onClose: () => void }) {
  const [state, formAction, pending] = useActionState<UserFormState, FormData>(
    createUser,
    undefined
  );

  useEffect(() => {
    if (state?.success) onClose();
  }, [state, onClose]);

  return (
    <Modal open onClose={onClose} title="Novo usuário" size="sm">
      <form action={formAction} className="space-y-4">
        <FormFeedback error={state?.error} />

        <Field label="Nome" htmlFor="new-name">
          <Input id="new-name" name="full_name" required />
        </Field>

        <Field label="E-mail" htmlFor="new-email">
          <Input
            id="new-email"
            name="email"
            type="email"
            required
            autoComplete="off"
          />
        </Field>

        <Field
          label="Senha"
          htmlFor="new-password"
          hint="Mínimo de 8 caracteres."
        >
          <Input
            id="new-password"
            name="password"
            type="password"
            minLength={8}
            required
            autoComplete="new-password"
          />
        </Field>

        <label className="flex w-fit cursor-pointer items-center gap-2.5 rounded-xl border border-line bg-surface-muted px-3.5 py-2.5 text-sm font-medium text-foreground transition hover:border-brand-blue/40">
          <input type="checkbox" name="is_admin" className={checkboxClass} />
          Administrador
        </label>

        <ModalActions
          onCancel={onClose}
          confirmLabel="Criar usuário"
          pending={pending}
        />
      </form>
    </Modal>
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
    <Modal open onClose={onClose} title="Editar usuário" size="sm">
      <form action={formAction} className="space-y-4">
        <FormFeedback error={state?.error} />
        <input type="hidden" name="user_id" value={user.user_id} />

        <Field label="E-mail">
          <p className="rounded-xl border border-line bg-surface-sunken px-3.5 py-2.5 text-sm text-muted">
            {user.email}
          </p>
        </Field>

        <Field label="Nome" htmlFor="edit-name">
          <Input
            id="edit-name"
            name="full_name"
            required
            defaultValue={user.full_name}
          />
        </Field>

        <label className="flex w-fit cursor-pointer items-center gap-2.5 rounded-xl border border-line bg-surface-muted px-3.5 py-2.5 text-sm font-medium text-foreground transition hover:border-brand-blue/40">
          <input
            type="checkbox"
            name="is_admin"
            defaultChecked={user.role === "admin"}
            disabled={isSelf}
            className={checkboxClass}
          />
          Administrador
        </label>
        {isSelf && (
          <p className="text-xs text-subtle">
            Você não pode alterar o seu próprio perfil de acesso.
          </p>
        )}

        <ModalActions
          onCancel={onClose}
          confirmLabel="Salvar"
          pending={pending}
        />
      </form>
    </Modal>
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
    <Modal open onClose={onClose} title="Excluir usuário" size="sm">
      <form action={formAction} className="space-y-4">
        <FormFeedback error={state?.error} />
        <input type="hidden" name="user_id" value={user.user_id} />

        <p className="text-sm text-muted">
          Tem certeza que deseja excluir{" "}
          <strong className="font-semibold text-brand-navy">
            {user.full_name || user.email}
          </strong>
          ? Essa ação não pode ser desfeita.
        </p>

        <ModalActions
          onCancel={onClose}
          confirmLabel="Excluir"
          confirmVariant="danger"
          pending={pending}
        />
      </form>
    </Modal>
  );
}
