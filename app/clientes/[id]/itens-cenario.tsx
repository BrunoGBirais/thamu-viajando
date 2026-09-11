"use client";

import {
  useActionState,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useToast } from "../../components/toast";
import type { ItemFormState } from "./itens-actions";

export type ItemRecord = {
  id: number;
  [key: string]: string | number | boolean | null;
};

export type ItemSummary = {
  title: string;
  meta?: string | null;
  badge?: string | null;
};

export type FieldDef = {
  name: string;
  label: string;
  type?: "text" | "date" | "datetime-local" | "number" | "checkbox" | "url";
  maxLength?: number;
  step?: string;
  min?: string;
  required?: boolean;
  newValue?: string;
  span?: string;
};

type ItemAction = (
  state: ItemFormState,
  formData: FormData
) => Promise<ItemFormState>;

const fieldClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-sm text-zinc-900 outline-none transition focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/30";

const labelClass = "mb-1 block text-[11px] font-medium text-zinc-500";

function Feedback({ state }: { state: ItemFormState }) {
  if (!state?.error) return null;

  return (
    <p className="rounded-lg bg-red-50 px-2.5 py-1.5 text-[11px] text-brand-red">
      {state.error}
    </p>
  );
}

function storedValue(field: FieldDef, stored: ItemRecord[string] | undefined) {
  if (stored === null || stored === undefined || typeof stored === "boolean") {
    return "";
  }

  // O input datetime-local só aceita "YYYY-MM-DDTHH:mm".
  if (field.type === "datetime-local") {
    return String(stored).slice(0, 16);
  }

  return stored;
}

function Fields({ fields, item }: { fields: FieldDef[]; item?: ItemRecord }) {
  return (
    <>
      {fields.map((field) => {
        const stored = item?.[field.name];

        if (field.type === "checkbox") {
          return (
            <label
              key={field.name}
              className={`flex items-center gap-2 pt-5 text-sm text-zinc-700 ${field.span ?? ""}`}
            >
              <input
                type="checkbox"
                name={field.name}
                defaultChecked={stored === true}
                className="size-4 rounded border-zinc-300 accent-brand-blue"
              />
              {field.label}
            </label>
          );
        }

        return (
          <div key={field.name} className={field.span}>
            <label className={labelClass}>{field.label}</label>
            <input
              name={field.name}
              type={field.type ?? "text"}
              required={field.required}
              maxLength={field.maxLength}
              step={field.step}
              min={field.min}
              defaultValue={
                item ? storedValue(field, stored) : field.newValue ?? ""
              }
              className={fieldClass}
            />
          </div>
        );
      })}
    </>
  );
}

function ItemRow({
  item,
  fields,
  cenarioId,
  saveAction,
  deleteAction,
  describe,
  expanded,
  onToggle,
  onDone,
}: {
  item: ItemRecord;
  fields: FieldDef[];
  cenarioId: number;
  saveAction: ItemAction;
  deleteAction: ItemAction;
  describe: (item: ItemRecord) => ItemSummary;
  expanded: boolean;
  onToggle: () => void;
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState<ItemFormState, FormData>(
    saveAction,
    undefined
  );
  const [deleteState, removeAction, deleting] = useActionState<
    ItemFormState,
    FormData
  >(deleteAction, undefined);
  const [confirming, setConfirming] = useState(false);
  const toast = useToast();
  const { title, meta, badge } = describe(item);

  useEffect(() => {
    if (state?.success) {
      toast(state.success);
      onDone();
    }
  }, [state, toast, onDone]);

  useEffect(() => {
    if (deleteState?.success) toast(deleteState.success);
  }, [deleteState, toast]);

  return (
    <li
      className={`rounded-xl border transition ${
        expanded
          ? "border-brand-blue/40 bg-brand-blue/5"
          : "border-zinc-200 bg-white hover:border-zinc-300"
      }`}
    >
      <div className="flex items-center gap-3 px-3 py-2.5">
        <button
          type="button"
          onClick={onToggle}
          className="min-w-0 flex-1 text-left"
        >
          <p className="truncate text-sm font-medium text-zinc-800">{title}</p>
          {meta && <p className="truncate text-xs text-zinc-500">{meta}</p>}
        </button>

        {badge && (
          <span className="shrink-0 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-700">
            {badge}
          </span>
        )}

        {confirming ? (
          <form action={removeAction} className="flex shrink-0 items-center gap-2">
            <input type="hidden" name="id" value={item.id} />
            <input type="hidden" name="cenario_id" value={cenarioId} />
            <button
              type="submit"
              disabled={deleting}
              className="rounded-lg bg-brand-red px-2.5 py-1 text-xs font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
            >
              {deleting ? "..." : "Excluir"}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="text-xs font-medium text-zinc-500 hover:underline"
            >
              Não
            </button>
          </form>
        ) : (
          <div className="flex shrink-0 items-center gap-1">
            <IconButton label="Editar" onClick={onToggle}>
              <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
            </IconButton>
            <IconButton
              label="Excluir"
              danger
              onClick={() => setConfirming(true)}
            >
              <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6" />
            </IconButton>
          </div>
        )}
      </div>

      <Feedback state={deleteState} />

      {expanded && (
        <form
          action={formAction}
          className="grid gap-3 border-t border-brand-blue/20 px-3 py-3 sm:grid-cols-4"
        >
          <input type="hidden" name="id" value={item.id} />
          <input type="hidden" name="cenario_id" value={cenarioId} />

          <Fields fields={fields} item={item} />

          <div className="sm:col-span-4">
            <Feedback state={state} />
            <div className="mt-1 flex items-center gap-2">
              <button
                type="submit"
                disabled={pending}
                className="rounded-lg bg-brand-navy px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-blue disabled:opacity-60"
              >
                {pending ? "Salvando..." : "Salvar"}
              </button>
              <button
                type="button"
                onClick={onToggle}
                className="text-xs font-medium text-zinc-500 hover:underline"
              >
                Cancelar
              </button>
            </div>
          </div>
        </form>
      )}
    </li>
  );
}

function IconButton({
  label,
  onClick,
  danger = false,
  children,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-100 ${
        danger ? "hover:text-brand-red" : "hover:text-brand-navy"
      }`}
    >
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {children}
      </svg>
    </button>
  );
}

function AddItemForm({
  fields,
  cenarioId,
  saveAction,
  addLabel,
  open,
  onOpen,
  onClose,
}: {
  fields: FieldDef[];
  cenarioId: number;
  saveAction: ItemAction;
  addLabel: string;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState<ItemFormState, FormData>(
    saveAction,
    undefined
  );
  const formRef = useRef<HTMLFormElement>(null);
  const toast = useToast();

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
      toast(state.success);
    }
  }, [state, toast]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-zinc-300 py-2.5 text-xs font-semibold text-zinc-500 transition hover:border-brand-blue hover:bg-brand-blue/5 hover:text-brand-blue"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
        {addLabel}
      </button>
    );
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      className="grid gap-3 rounded-xl border border-dashed border-brand-blue/50 bg-brand-blue/5 p-3 sm:grid-cols-4"
    >
      <input type="hidden" name="cenario_id" value={cenarioId} />

      <Fields fields={fields} />

      <div className="sm:col-span-4">
        <Feedback state={state} />
        <div className="mt-1 flex items-center gap-2">
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-brand-navy px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-brand-blue disabled:opacity-60"
          >
            {pending ? "Adicionando..." : "Adicionar"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-medium text-zinc-500 hover:underline"
          >
            Fechar
          </button>
        </div>
      </div>
    </form>
  );
}

export function ItensCenario({
  addLabel,
  emptyMessage,
  fields,
  items,
  cenarioId,
  saveAction,
  deleteAction,
  describe,
}: {
  addLabel: string;
  emptyMessage: string;
  fields: FieldDef[];
  items: ItemRecord[];
  cenarioId: number;
  saveAction: ItemAction;
  deleteAction: ItemAction;
  describe: (item: ItemRecord) => ItemSummary;
}) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);

  const collapse = useCallback(() => setExpanded(null), []);

  return (
    <div className="space-y-2">
      {items.length === 0 ? (
        <p className="rounded-xl bg-zinc-50 px-3 py-6 text-center text-xs text-zinc-500">
          {emptyMessage}
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              fields={fields}
              cenarioId={cenarioId}
              saveAction={saveAction}
              deleteAction={deleteAction}
              describe={describe}
              expanded={expanded === item.id}
              onToggle={() =>
                setExpanded((current) => (current === item.id ? null : item.id))
              }
              onDone={collapse}
            />
          ))}
        </ul>
      )}

      <AddItemForm
        fields={fields}
        cenarioId={cenarioId}
        saveAction={saveAction}
        addLabel={addLabel}
        open={adding}
        onOpen={() => setAdding(true)}
        onClose={() => setAdding(false)}
      />
    </div>
  );
}
