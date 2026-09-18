import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

export const controlClass =
  "w-full rounded-lg border border-line-strong bg-surface px-3 py-2.5 text-[0.9375rem] text-foreground transition-colors duration-150 placeholder:text-subtle hover:border-[#9fb0c6] focus:border-brand-navy focus:shadow-[0_0_0_3px_rgb(41_169_224/0.28)] focus-visible:outline-none disabled:cursor-not-allowed disabled:bg-surface-sunken disabled:text-muted";

export const labelClass = "mb-1.5 block text-sm font-semibold text-foreground";

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
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-brand-navy"
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
  label: ReactNode;
  hint?: ReactNode;
  htmlFor?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint ? <p className="mt-1.5 text-[0.8125rem] text-muted">{hint}</p> : null}
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
        "animate-pop flex items-start gap-2 rounded-lg border px-3.5 py-2.5 text-sm font-semibold",
        error
          ? "border-brand-red/30 bg-brand-red/6 text-[#b3241c]"
          : "border-emerald-600/25 bg-emerald-500/8 text-emerald-800"
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
