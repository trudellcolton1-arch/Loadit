import { cn } from "@/lib/utils";

export function Badge({
  children,
  className,
  dot = true,
}: {
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-mono uppercase tracking-[0.2em] text-white/60",
        className
      )}
    >
      {dot && (
        <span className="h-1.5 w-1.5 rounded-full bg-signal shadow-[0_0_8px_2px_rgba(52,211,153,0.6)]" />
      )}
      {children}
    </span>
  );
}
