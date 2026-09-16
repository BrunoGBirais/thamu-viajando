import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

export function TableShell({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-2xl border border-line bg-surface shadow-sm",
        className
      )}
      {...props}
    />
  );
}

export function Table({ className, ...props }: ComponentProps<"table">) {
  return (
    <div className="overflow-x-auto">
      <table
        className={cn("w-full min-w-[40rem] border-collapse text-sm", className)}
        {...props}
      />
    </div>
  );
}

export function Th({ className, ...props }: ComponentProps<"th">) {
  return (
    <th
      className={cn(
        "border-b border-line bg-surface-muted px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-muted",
        className
      )}
      {...props}
    />
  );
}

export function Tr({ className, ...props }: ComponentProps<"tr">) {
  return (
    <tr
      className={cn(
        "border-b border-line/70 transition-colors last:border-0 hover:bg-brand-blue/4",
        className
      )}
      {...props}
    />
  );
}

export function Td({ className, ...props }: ComponentProps<"td">) {
  return <td className={cn("px-4 py-3.5 align-middle", className)} {...props} />;
}
