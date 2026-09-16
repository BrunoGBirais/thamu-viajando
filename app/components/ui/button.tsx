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
  "relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-xl font-semibold transition duration-200 ease-out-expo active:translate-y-0 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-navy text-white shadow-sm hover:-translate-y-px hover:bg-[#24457d] hover:shadow-md",
  accent:
    "bg-brand-blue text-white shadow-sm hover:-translate-y-px hover:brightness-110 hover:shadow-md",
  danger:
    "bg-brand-red text-white shadow-sm hover:-translate-y-px hover:brightness-110 hover:shadow-md",
  outline:
    "border border-line bg-surface text-brand-navy shadow-2xs hover:border-brand-blue/50 hover:bg-surface-muted hover:text-brand-blue",
  ghost: "text-muted hover:bg-surface-sunken hover:text-brand-navy",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-sm",
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
