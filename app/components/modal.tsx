"use client";

import { useEffect, type ReactNode } from "react";
import { Button, type ButtonVariant } from "./ui/button";

const SIZES = {
  sm: "max-w-md",
  md: "max-w-2xl",
  lg: "max-w-4xl",
} as const;

export function Modal({
  open,
  onClose,
  title,
  description,
  size = "md",
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  size?: keyof typeof SIZES;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="animate-fade-in fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-brand-navy/35 p-4 backdrop-blur-md sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`animate-pop my-auto w-full ${SIZES[size]} overflow-hidden rounded-3xl border border-white/60 bg-surface shadow-2xl`}
      >
        <div className="brand-rule h-1" />

        <header className="flex items-start justify-between gap-4 border-b border-line px-6 py-5">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold tracking-tight text-brand-navy">
              {title}
            </h2>
            {description && (
              <p className="mt-1 text-sm text-muted">{description}</p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="-mr-1.5 -mt-1 rounded-xl p-2 text-subtle transition hover:bg-surface-sunken hover:text-brand-navy"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </header>

        <div className="max-h-[70vh] overflow-y-auto px-6 py-6">{children}</div>

        {footer && (
          <footer className="border-t border-line bg-surface-muted px-6 py-4">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}

export function ModalActions({
  onCancel,
  confirmLabel,
  confirmVariant = "primary",
  pending = false,
  disabled = false,
  children,
}: {
  onCancel: () => void;
  confirmLabel: string;
  confirmVariant?: ButtonVariant;
  pending?: boolean;
  disabled?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
      {children}
      <Button variant="outline" onClick={onCancel} disabled={pending}>
        Cancelar
      </Button>
      <Button
        type="submit"
        variant={confirmVariant}
        disabled={pending || disabled}
      >
        {pending ? "Salvando..." : confirmLabel}
      </Button>
    </div>
  );
}
