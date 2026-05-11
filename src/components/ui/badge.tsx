import { cn } from "@/lib/utils";

const toneClasses = {
  neutral: "border-[#d8dfe8] bg-[#eef4f8] text-[#50617a]",
  success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  danger: "border-red-200 bg-red-50 text-red-800",
  info: "border-blue-200 bg-blue-50 text-blue-800",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: keyof typeof toneClasses }) {
  return (
    <span
      className={cn("inline-flex items-center rounded-[4px] border px-2 py-0.5 text-xs font-medium", toneClasses[tone], className)}
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
