import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

export type BadgeTone =
  | "navy"
  | "blue"
  | "yellow"
  | "red"
  | "green"
  | "neutral";

// Cantos quase retos e borda fina: lembram um carimbo, não uma pílula.
const TONES: Record<BadgeTone, string> = {
  navy: "border-brand-navy/25 bg-brand-navy/6 text-brand-navy",
  blue: "border-brand-blue/35 bg-brand-blue/8 text-brand-blue-ink",
  yellow: "border-brand-yellow/60 bg-brand-yellow/15 text-[#7a5b00]",
  red: "border-brand-red/30 bg-brand-red/6 text-[#b3241c]",
  green: "border-emerald-600/25 bg-emerald-500/8 text-emerald-800",
  neutral: "border-line-strong bg-surface-muted text-muted",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: ComponentProps<"span"> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border px-2 py-0.5 text-xs font-semibold",
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
