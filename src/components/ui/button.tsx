import Link from "next/link";
import { cn } from "@/lib/utils";

const base =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-[6px] px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-[#0c8c5e]/25 disabled:pointer-events-none disabled:opacity-55";

const variants = {
  primary: "bg-[#0c8c5e] text-white shadow-[0_8px_18px_rgba(12,140,94,0.18)] hover:bg-[#08764f]",
  secondary: "border border-[#d8dfe8] bg-white text-[#061b31] shadow-[0_1px_2px_rgba(6,27,49,0.04)] hover:bg-[#f8fafd]",
  subtle: "bg-[#eef4f8] text-[#061b31] hover:bg-[#e5edf5]",
  danger: "bg-red-700 text-white shadow-[0_8px_18px_rgba(185,28,28,0.16)] hover:bg-red-800",
  ghost: "text-[#50617a] hover:bg-[#eef4f8] hover:text-[#061b31]",
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
