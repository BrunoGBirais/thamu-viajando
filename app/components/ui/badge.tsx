import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

export type BadgeTone =
  | "navy"
  | "blue"
  | "yellow"
  | "red"
  | "green"
  | "neutral";

const TONES: Record<BadgeTone, string> = {
  navy: "bg-brand-navy/10 text-brand-navy ring-brand-navy/15",
  blue: "bg-brand-blue/12 text-[#1071a0] ring-brand-blue/20",
  yellow: "bg-brand-yellow/18 text-[#8a6a00] ring-brand-yellow/30",
  red: "bg-brand-red/10 text-brand-red ring-brand-red/20",
  green: "bg-emerald-500/12 text-emerald-700 ring-emerald-500/20",
  neutral: "bg-surface-sunken text-muted ring-line-strong/60",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: ComponentProps<"span"> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
        TONES[tone],
        className
      )}
      {...props}
    />
  );
}

export function Dot({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("h-1.5 w-1.5 rounded-full bg-current", className)}
    />
  );
}
