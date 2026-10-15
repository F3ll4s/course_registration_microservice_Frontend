import { Check, Timer, TriangleAlert, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Penpot "Design #1" > Toast Notification Matrix: accent bar, round icon, uppercase title, one-line detail
const TONES = {
  success: { bar: "bg-[#10b981]", icon: "bg-[#ecfdf5] text-[#065f46]", Icon: Check },
  error: { bar: "bg-[#dc2626]", icon: "bg-[#fef2f2] text-[#991b1b]", Icon: TriangleAlert },
  waitlist: { bar: "bg-[#ff5722]", icon: "bg-[#fff3e0] text-[#d84315]", Icon: Timer },
};

export type ToastTone = keyof typeof TONES;

// Shown through `notify` (./notify.tsx), not rendered directly
export function PortalToast({
  id,
  tone,
  title,
  description,
}: {
  id: string | number;
  tone: ToastTone;
  title: string;
  description?: string;
}) {
  const { bar, icon, Icon } = TONES[tone];
  return (
    <div className="flex w-full items-stretch gap-2.5 rounded-lg border border-[#e2e8f0] bg-white px-3 py-[11px] shadow-[0_4px_12px_-2px_rgba(15,23,42,0.1)]">
      <span aria-hidden className={cn("w-1 shrink-0 rounded-sm", bar)} />
      <span aria-hidden className={cn("flex size-7 shrink-0 items-center justify-center self-center rounded-full", icon)}>
        <Icon className="size-3.5" strokeWidth={2.5} />
      </span>
      <div className="min-w-0 flex-1 self-center">
        <div className="text-xs leading-[15px] font-bold text-[#0f172a] uppercase">{title}</div>
        {description && <p className="mt-0.5 text-[11px] leading-[14px] text-[#475569]">{description}</p>}
      </div>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => toast.dismiss(id)}
        className="flex size-6 shrink-0 items-center justify-center self-center rounded text-[#94a3b8] hover:text-[#475569] focus-visible:outline-2 focus-visible:outline-[#ff6b00]"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
