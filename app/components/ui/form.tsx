import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

export const controlClass =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-foreground shadow-2xs transition duration-200 placeholder:text-subtle hover:border-line-strong focus:border-brand-blue focus:ring-4 focus:ring-brand-blue/15 focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-surface-sunken disabled:text-muted";

export const labelClass =
  "mb-1.5 block text-xs font-semibold tracking-wide text-muted";

export function Label({ className, ...props }: ComponentProps<"label">) {
  return <label className={cn(labelClass, className)} {...props} />;
}

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(controlClass, className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea className={cn(controlClass, "resize-y", className)} {...props} />
  );
}

// A seta é desenhada aqui para o select não herdar o widget nativo do SO.
export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <div className="relative">
      <select
        className={cn(controlClass, "cursor-pointer appearance-none pr-10", className)}
        {...props}
      >
        {children}
      </select>
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        aria-hidden="true"
        className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-subtle"
      >
        <path d="M6 9l6 6 6-6" />
      </svg>
    </div>
  );
}

export function Field({
  label,
  hint,
  htmlFor,
  className,
  children,
}: {
  label: string;
  hint?: ReactNode;
  htmlFor?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint ? <p className="mt-1.5 text-xs text-subtle">{hint}</p> : null}
    </div>
  );
}

export function FormFeedback({
  error,
  success,
}: {
  error?: string | null;
  success?: string | null;
}) {
  const mensagem = error ?? success;
  if (!mensagem) return null;

  return (
    <p
      role="status"
      className={cn(
        "animate-rise flex items-start gap-2 rounded-xl px-3.5 py-2.5 text-sm font-medium",
        error
          ? "bg-brand-red/8 text-brand-red"
          : "bg-emerald-500/10 text-emerald-700"
      )}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        aria-hidden="true"
        className="mt-0.5 shrink-0"
      >
        {error ? (
          <>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v5M12 16h.01" />
          </>
        ) : (
          <>
            <circle cx="12" cy="12" r="9" />
            <path d="m8.5 12.5 2.5 2.5 4.5-5" />
          </>
        )}
      </svg>
      {mensagem}
    </p>
  );
}
