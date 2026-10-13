import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const PILL_TONES = {
  green: "border-[#a7f3d0] bg-[#ecfdf5] text-[#047857]",
  red: "border-[#fecaca] bg-[#fef2f2] text-[#b91c1c]",
  orange: "border-[#fed7aa] bg-[#fff7ed] text-[#c2410c]",
  solid: "border-[#ff6b00] bg-[#ff6b00] text-white",
  neutral: "border-[#cbd5e1] bg-[#f1f5f9] text-[#1e293b]",
};

// Rounded status pill used across the portal screens
export function Pill({
  tone,
  className,
  children,
}: {
  tone: keyof typeof PILL_TONES;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-[26px] items-center rounded-full border px-[11px] text-[11px] font-bold whitespace-nowrap",
        PILL_TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function SectionBadge({ number, className }: { number: number; className?: string }) {
  return (
    <Pill tone="neutral" className={cn("min-w-[58px] justify-center px-2.5 font-semibold", className)}>
      Sec {number}
    </Pill>
  );
}

// The "|" between facts on one line
export function Divider() {
  return (
    <span aria-hidden className="mx-1.5">
      |
    </span>
  );
}

// Loading, error and empty states inside a list
export function Notice({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-40 flex-col items-center justify-center gap-2 rounded-lg border border-[#e2e8f0] bg-white p-6 text-center",
        className,
      )}
    >
      <div className="text-sm font-bold text-[#0f172a]">{title}</div>
      {description && <p className="text-xs text-[#64748b]">{description}</p>}
      {action}
    </div>
  );
}
