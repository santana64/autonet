import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[8px] border border-[#d8dfe8] bg-white p-5 shadow-[0_2px_10px_rgba(6,27,49,0.04)]",
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
    <div className="mb-5 flex flex-col gap-3 border-b border-[#d8dfe8] pb-5 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.08em] text-[#0c8c5e]">AutoNet</p>
        <h1 className="text-2xl font-semibold tracking-normal text-[#061b31]">{title}</h1>
        {description ? <p className="mt-1 max-w-3xl text-sm leading-6 text-[#50617a]">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
