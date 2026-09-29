/** LOADIT GLOBAL wordmark — mono, precise, reads like an infrastructure badge. */
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span className="relative inline-flex h-5 w-5 items-center justify-center" aria-hidden>
        <span className="absolute inset-0 rounded-[5px] border border-rail-400/70" />
        <span className="h-1.5 w-1.5 rounded-full bg-rail-400" />
      </span>
      <span className="font-mono text-[13px] font-bold tracking-[0.22em] text-white">
        LOADIT<span className="text-white/45"> GLOBAL</span>
      </span>
    </span>
  );
}
