import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// Penpot "Design #1" > Component Library > Status Pills & Badges
const PILL_TONES = {
  green: "border-[#a7f3d0] bg-[#ecfdf5] text-[#065f46]",
  red: "border-[#fecaca] bg-[#fef2f2] text-[#991b1b]",
  amber: "border-[#fde68a] bg-[#fffbeb] text-[#92400e]",
  orange: "border-[#ffcc80] bg-[#fff3e0] text-[#d84315]",
  blue: "border-[#bfdbfe] bg-[#eff6ff] text-[#1d4ed8]",
  neutral: "border-[#e2e8f0] bg-[#f1f5f9] text-[#64748b]",
};

const DOT_TONES: Record<keyof typeof PILL_TONES, string> = {
  green: "bg-[#10b981]",
  red: "bg-[#ef4444]",
  amber: "bg-[#f59e0b]",
  orange: "bg-[#ff5722]",
  blue: "bg-[#3b82f6]",
  neutral: "bg-[#94a3b8]",
};

export type Tone = keyof typeof PILL_TONES;

// The colored dot that stands in for the 🟢 🔴 🟡 emoji on the boards
export function Dot({ tone, className }: { tone: Tone; className?: string }) {
  return <span aria-hidden className={cn("inline-block size-2 shrink-0 rounded-full", DOT_TONES[tone], className)} />;
}

// Rounded status pill used across the portal screens
export function Pill({
  tone,
  className,
  children,
}: {
  tone: Tone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center justify-center gap-1.5 rounded-full border px-3 text-[11px] font-bold whitespace-nowrap [&_svg]:size-3",
        PILL_TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

// Grey course-code chip ("CS301") at the start of a course card or table row
export function CodeChip({ code, className }: { code: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 shrink-0 items-center justify-center rounded border border-[#cbd5e1] bg-[#f1f5f9] px-3 text-[13px] font-bold text-[#0f172a]",
        className,
      )}
    >
      {code}
    </span>
  );
}

// Loading, error and empty states inside a list. Empty states get an icon in a circle (Penpot "Design #1" zero state).
export function Notice({
  title,
  description,
  icon,
  action,
  className,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-h-40 flex-col items-center justify-center gap-2 rounded-[10px] border border-[#e2e8f0] bg-white p-6 text-center",
        className,
      )}
    >
      {icon && (
        <span
          aria-hidden
          className="mb-1 flex size-12 items-center justify-center rounded-full bg-[#f1f5f9] text-[#475569] [&_svg]:size-5"
        >
          {icon}
        </span>
      )}
      <div className="text-base font-bold text-[#0f172a]">{title}</div>
      {description && <p className="text-[13px] text-[#64748b]">{description}</p>}
      {action}
    </div>
  );
}
