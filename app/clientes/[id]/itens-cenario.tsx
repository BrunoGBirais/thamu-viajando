"use client";

import {
  useActionState,
  useCallback,
  useEffect,
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

export type FormValues = Record<string, string>;

export type FormSummary = (values: FormValues) => ReactNode;

export type FieldOption = { value: string; label: string };

export type FieldDef = {
  name: string;
  label: string;
  type?:
    | "text"
    | "date"
    | "datetime-local"
    | "number"
    | "checkbox"
    | "url"
    | "select"
    | "chips";
  options?: FieldOption[];
  placeholder?: string;
  maxLength?: number;
  step?: string;
  min?: string;
  required?: boolean;
  newValue?: string;
  span?: string;
  section?: string;
  showWhen?: (values: FormValues) => boolean;
};

type ItemAction = (
  state: ItemFormState,
  formData: FormData
) => Promise<ItemFormState>;

const fieldClass =
  "w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-300 focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/15";

const labelClass = "mb-1.5 block text-[11px] font-medium text-zinc-500";

function Feedback({ state }: { state: ItemFormState }) {
  if (!state?.error) return null;

  return (
    <p className="rounded-lg bg-red-50 px-2.5 py-1.5 text-[11px] text-brand-red">
      {state.error}
    </p>
  );
}

function storedValue(field: FieldDef, stored: ItemRecord[string] | undefined) {
  if (stored === null || stored === undefined) return "";
  if (typeof stored === "boolean") return stored ? "1" : "";

  // O input datetime-local só aceita "YYYY-MM-DDTHH:mm".
  if (field.type === "datetime-local") return String(stored).slice(0, 16);

  return String(stored);
}

function initialValues(fields: FieldDef[], item?: ItemRecord): FormValues {
  const values: FormValues = {};

  for (const field of fields) {
    values[field.name] = item
      ? storedValue(field, item[field.name])
      : field.newValue ?? "";
  }

  return values;
}

// Mantém a ordem declarada e junta campos vizinhos que dividem a mesma seção.
function agrupar(fields: FieldDef[], values: FormValues) {
  const grupos: { title: string | null; fields: FieldDef[] }[] = [];

  for (const field of fields) {
    if (field.showWhen && !field.showWhen(values)) continue;

    const title = field.section ?? null;
    const ultimo = grupos[grupos.length - 1];

    if (ultimo && ultimo.title === title) ultimo.fields.push(field);
    else grupos.push({ title, fields: [field] });
  }

  return grupos;
}

// Valores gravados antes de a lista de opções existir continuam selecionáveis.
function comValorAtual(options: FieldOption[], value: string) {
  if (!value || options.some((option) => option.value === value)) return options;

  return [{ value, label: value }, ...options];
}

function Field({
  field,
  value,
  onChange,
}: {
  field: FieldDef;
  value: string;
  onChange: (name: string, value: string) => void;
}) {
  if (field.type === "checkbox") {
    const marcado = value === "1";

    return (
      <label
        className={`flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2 text-sm transition ${
          marcado
            ? "border-brand-blue bg-brand-blue/5 font-medium text-brand-navy"
            : "border-zinc-200 text-zinc-600 hover:border-zinc-300"
        } ${field.span ?? ""}`}
      >
        <input
          type="checkbox"
          name={field.name}
          value="1"
          checked={marcado}
          onChange={(event) =>
            onChange(field.name, event.target.checked ? "1" : "")
          }
          className="size-4 rounded border-zinc-300 accent-brand-blue"
        />
        {field.label}
      </label>
    );
  }

  if (field.type === "chips") {
    return (
      <div className={field.span}>
        <span className={labelClass}>{field.label}</span>
        <div className="flex flex-wrap gap-1.5">
          {comValorAtual(field.options ?? [], value).map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={value === option.value}
              onClick={() => onChange(field.name, option.value)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                value === option.value
                  ? "bg-brand-navy text-white shadow-sm"
                  : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-700"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <input type="hidden" name={field.name} value={value} />
      </div>
    );
  }

  if (field.type === "select") {
    return (
      <div className={field.span}>
        <label className={labelClass}>{field.label}</label>
        <select
          name={field.name}
          required={field.required}
          value={value}
          onChange={(event) => onChange(field.name, event.target.value)}
          className={fieldClass}
        >
          <option value="" disabled={field.required}>
            {field.required ? "Selecione" : "—"}
          </option>
          {comValorAtual(field.options ?? [], value).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className={field.span}>
      <label className={labelClass}>{field.label}</label>
      <input
        name={field.name}
        type={field.type ?? "text"}
        required={field.required}
        maxLength={field.maxLength}
        step={field.step}
        min={field.min}
        placeholder={field.placeholder}
        value={value}
        onChange={(event) => onChange(field.name, event.target.value)}
        className={fieldClass}
      />
    </div>
  );
}

function ItemForm({
  fields,
  cenarioId,
  item,
  saveAction,
  summary,
  submitLabel,
  pendingLabel,
  className,
  onCancel,
  onDone,
}: {
  fields: FieldDef[];
  cenarioId: number;
  item?: ItemRecord;
  saveAction: ItemAction;
  summary?: FormSummary;
  submitLabel: string;
  pendingLabel: string;
  className: string;
  onCancel: () => void;
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState<ItemFormState, FormData>(
    saveAction,
    undefined
  );
  const [values, setValues] = useState(() => initialValues(fields, item));
  const toast = useToast();

  const change = useCallback(
    (name: string, value: string) =>
      setValues((current) => ({ ...current, [name]: value })),
    []
  );

  useEffect(() => {
    if (state?.success) {
      toast(state.success);
      onDone();
    }
  }, [state, toast, onDone]);

  return (
    <form action={formAction} className={`space-y-4 ${className}`}>
      {item && <input type="hidden" name="id" value={item.id} />}
      <input type="hidden" name="cenario_id" value={cenarioId} />

      {agrupar(fields, values).map((grupo, index) => (
        <div key={grupo.title ?? index} className="space-y-2.5">
          {grupo.title && (
            <p className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
              {grupo.title}
              <span className="h-px flex-1 bg-zinc-200" />
            </p>
          )}

          <div className="grid gap-3 sm:grid-cols-4">
            {grupo.fields.map((field) => (
              <Field
                key={field.name}
                field={field}
                value={values[field.name] ?? ""}
                onChange={change}
              />
            ))}
          </div>
        </div>
      ))}

      {summary?.(values)}

      <Feedback state={state} />

      <div className="flex items-center justify-end gap-3 border-t border-zinc-200 pt-3">
        <button
          type="button"
          onClick={onCancel}
          className="text-xs font-medium text-zinc-500 transition hover:text-zinc-800"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-brand-navy px-4 py-2 text-xs font-semibold text-white transition hover:bg-brand-blue disabled:opacity-60"
        >
          {pending ? pendingLabel : submitLabel}
        </button>
      </div>
    </form>
  );
}

function ItemRow({
  item,
  fields,
  cenarioId,
  saveAction,
  deleteAction,
  describe,
  summary,
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
  summary?: FormSummary;
  expanded: boolean;
  onToggle: () => void;
  onDone: () => void;
}) {
  const [deleteState, removeAction, deleting] = useActionState<
    ItemFormState,
    FormData
  >(deleteAction, undefined);
  const [confirming, setConfirming] = useState(false);
  const toast = useToast();
  const { title, meta, badge } = describe(item);

  useEffect(() => {
    if (deleteState?.success) toast(deleteState.success);
  }, [deleteState, toast]);

  return (
    <li
      className={`overflow-hidden rounded-xl border transition ${
        expanded
          ? "border-brand-blue/40 bg-white shadow-sm"
          : "border-zinc-200 bg-white hover:border-zinc-300"
      }`}
    >
      <div className="flex items-center gap-3 px-3 py-2.5">
        <button
          type="button"
          onClick={onToggle}
          className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className={`shrink-0 text-zinc-300 transition-transform duration-200 ${
              expanded ? "rotate-90 text-brand-blue" : ""
            }`}
          >
            <path d="m9 18 6-6-6-6" />
          </svg>

          <span className="min-w-0">
            <span className="block truncate text-sm font-medium text-zinc-800">
              {title}
            </span>
            {meta && (
              <span className="block truncate text-xs text-zinc-500">
                {meta}
              </span>
            )}
          </span>
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
        <ItemForm
          fields={fields}
          cenarioId={cenarioId}
          item={item}
          saveAction={saveAction}
          summary={summary}
          submitLabel="Salvar"
          pendingLabel="Salvando..."
          className="border-t border-zinc-200 bg-zinc-50/70 px-4 py-4"
          onCancel={onToggle}
          onDone={onDone}
        />
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
  summary,
  addLabel,
  open,
  onOpen,
  onClose,
  onSaved,
}: {
  fields: FieldDef[];
  cenarioId: number;
  saveAction: ItemAction;
  summary?: FormSummary;
  addLabel: string;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  onSaved: () => void;
}) {
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
    <div className="overflow-hidden rounded-xl border border-brand-blue/30 bg-white shadow-sm">
      <p className="border-b border-zinc-200 bg-brand-blue/5 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-brand-blue">
        {addLabel}
      </p>

      <ItemForm
        fields={fields}
        cenarioId={cenarioId}
        saveAction={saveAction}
        summary={summary}
        submitLabel="Adicionar"
        pendingLabel="Adicionando..."
        className="px-4 py-4"
        onCancel={onClose}
        onDone={onSaved}
      />
    </div>
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
  summary,
}: {
  addLabel: string;
  emptyMessage: string;
  fields: FieldDef[];
  items: ItemRecord[];
  cenarioId: number;
  saveAction: ItemAction;
  deleteAction: ItemAction;
  describe: (item: ItemRecord) => ItemSummary;
  summary?: FormSummary;
}) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  // Trocar a chave remonta o formulário, limpando os campos após cada inclusão.
  const [addKey, setAddKey] = useState(0);

  const collapse = useCallback(() => setExpanded(null), []);
  const resetAdd = useCallback(() => setAddKey((key) => key + 1), []);

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
              summary={summary}
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
        key={addKey}
        fields={fields}
        cenarioId={cenarioId}
        saveAction={saveAction}
        summary={summary}
        addLabel={addLabel}
        open={adding}
        onOpen={() => setAdding(true)}
        onClose={() => setAdding(false)}
        onSaved={resetAdd}
      />
    </div>
  );
}
