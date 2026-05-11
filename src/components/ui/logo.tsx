export function LogoMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg
      aria-hidden
      className={className}
      fill="none"
      height={size}
      viewBox="0 0 36 36"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect fill="#0c8c5e" height="36" rx="9" width="36" />
      {/* Left leg */}
      <path d="M8.5 27.5L18 8.5L27.5 27.5" stroke="white" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
      {/* Crossbar — tilted upward like a trendline */}
      <path d="M12.5 22.5L23.5 18.5" stroke="white" strokeLinecap="round" strokeWidth="2.5" />
    </svg>
  );
}

export function LogoFull({ className }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className ?? ""}`}>
      <LogoMark size={32} />
      <span className="text-[15px] font-bold tracking-tight">AutoNet</span>
    </span>
  );
}
