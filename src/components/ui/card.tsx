import { cn } from "@/lib/utils";

export function Card({
  className,
  interactive = false,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { interactive?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-[10px] border border-[#e2e8f0] bg-white p-5",
        "shadow-[0px_1px_3px_rgba(10,15,26,0.06),0px_4px_16px_rgba(10,15,26,0.04)]",
        interactive &&
          "cursor-pointer transition-all duration-150 hover:-translate-y-px hover:shadow-[0px_4px_24px_rgba(10,15,26,0.1),0px_2px_8px_rgba(10,15,26,0.04)]",
        className
      )}
      {...props}
    />
  );
}

export function SectionHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 border-b border-[#e2e8f0] pb-5 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#0c8c5e]">AutoNet</p>
        <h1 className="text-[22px] font-bold tracking-[-0.025em] text-[#0a0f1a]">{title}</h1>
        {description ? (
          <p className="mt-1 max-w-3xl text-[13px] leading-relaxed text-[#64748b]">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
