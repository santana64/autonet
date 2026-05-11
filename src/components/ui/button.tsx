import Link from "next/link";
import { cn } from "@/lib/utils";

const base =
  "inline-flex h-9 items-center justify-center gap-2 rounded-full px-5 text-[13px] font-semibold tracking-[-0.01em] transition-all duration-150 focus:outline-none focus-visible:ring-3 focus-visible:ring-[#0c8c5e]/25 disabled:pointer-events-none disabled:opacity-50 select-none";

const variants = {
  primary:
    "bg-[#0c8c5e] text-white shadow-[0_1px_2px_rgba(12,140,94,0.2)] hover:bg-[#08764f] active:scale-[0.98]",
  secondary:
    "border border-[#e2e8f0] bg-white text-[#0a0f1a] shadow-[0_1px_2px_rgba(10,15,26,0.04)] hover:bg-[#f8fafb] hover:border-[#cbd5e1] active:scale-[0.98]",
  subtle:
    "bg-[#f1f5f9] text-[#0a0f1a] hover:bg-[#e2e8f0] active:scale-[0.98]",
  danger:
    "bg-red-600 text-white shadow-[0_1px_2px_rgba(220,38,38,0.2)] hover:bg-red-700 active:scale-[0.98]",
  ghost:
    "text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0a0f1a]",
};

export function buttonClassName(variant: keyof typeof variants = "primary", className?: string) {
  return cn(base, variants[variant], className);
}

export function Button({
  className,
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof variants }) {
  return <button className={buttonClassName(variant, className)} {...props} />;
}

export function ButtonLink({
  className,
  variant = "primary",
  href,
  ...props
}: React.ComponentProps<typeof Link> & { variant?: keyof typeof variants }) {
  return <Link className={buttonClassName(variant, className)} href={href} {...props} />;
}
