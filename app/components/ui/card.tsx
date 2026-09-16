import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

export const cardClass =
  "rounded-2xl border border-line bg-surface shadow-sm transition duration-300 ease-out-expo";

export function Card({
  className,
  hover = false,
  ...props
}: ComponentProps<"div"> & { hover?: boolean }) {
  return (
    <div
      className={cn(
        cardClass,
        hover && "hover:-translate-y-0.5 hover:border-brand-blue/40 hover:shadow-lg",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({
  title,
  description,
  actions,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4",
        className
      )}
    >
      <div className="min-w-0">
        <h2 className="text-sm font-semibold tracking-tight text-brand-navy">
          {title}
        </h2>
        {description ? (
          <p className="mt-0.5 text-xs text-muted">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="animate-rise flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-brand-blue">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-3xl font-semibold tracking-tight text-brand-navy sm:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm text-muted">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-line-strong bg-surface-muted/60 px-6 py-14 text-center",
        className
      )}
    >
      {icon ? (
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-blue/10 text-brand-blue">
          {icon}
        </span>
      ) : null}
      <p className="text-sm font-semibold text-brand-navy">{title}</p>
      {description ? (
        <p className="max-w-sm text-sm text-muted">{description}</p>
      ) : null}
      {action}
    </div>
  );
}
