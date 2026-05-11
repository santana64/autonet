import { cn } from "@/lib/utils";

const toneClasses = {
  neutral: "border-[#e2e8f0] bg-[#f1f5f9] text-[#64748b]",
  success: "border-emerald-200/60 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200/60 bg-amber-50 text-amber-700",
  danger:  "border-red-200/60 bg-red-50 text-red-700",
  info:    "border-blue-200/60 bg-blue-50 text-blue-700",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: keyof typeof toneClasses }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-[0.01em]",
        toneClasses[tone],
        className
      )}
      {...props}
    />
  );
}

export function statusTone(status: string) {
  if (["PAID", "DONE", "COLLECTED"].includes(status)) return "success" as const;
  if (["READY", "DECLARED", "PENDING_INVOICE"].includes(status)) return "info" as const;
  if (["LATE", "EXCLUDED", "CANCELLED"].includes(status)) return "danger" as const;
  return "neutral" as const;
}
