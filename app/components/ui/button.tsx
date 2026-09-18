import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant =
  | "primary"
  | "accent"
  | "danger"
  | "outline"
  | "ghost";

export type ButtonSize = "sm" | "md" | "lg" | "icon";

const BASE =
  "relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-lg font-semibold transition-colors duration-150 active:translate-y-px disabled:pointer-events-none disabled:opacity-45";

// Navy é a ação comum; amarelo fica para o que sai para o cliente (criar, imprimir).
const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-brand-navy text-white hover:bg-[#244680]",
  accent:
    "bg-brand-yellow text-brand-navy shadow-[inset_0_-2px_0_rgb(0_0_0/0.12)] hover:bg-[#ffcf2e] disabled:bg-surface-sunken disabled:text-subtle disabled:opacity-100 disabled:shadow-none",
  // O vermelho do logo escurecido um tom para o texto branco passar em contraste.
  danger: "bg-[#d02b22] text-white hover:bg-[#b3241c]",
  outline:
    "border border-line-strong bg-surface text-brand-navy hover:border-brand-navy/40 hover:bg-surface-muted",
  ghost: "text-muted hover:bg-surface-sunken hover:text-brand-navy",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-[0.8125rem]",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-5 text-[0.9375rem]",
  icon: "h-9 w-9",
};

export function buttonClass(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  extra?: string
) {
  return cn(BASE, VARIANTS[variant], SIZES[size], extra);
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...props
}: ComponentProps<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  return (
    <button
      type={type}
      className={buttonClass(variant, size, className)}
      {...props}
    />
  );
}
