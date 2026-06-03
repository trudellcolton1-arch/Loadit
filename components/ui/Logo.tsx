import { cn } from "@/lib/utils";

/**
 * Loadit mark — an abstract "rail" routing node: three converging paths
 * meeting at a single settlement point. Uses currentColor + gradient.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      className={cn("text-rail-400", className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="loadit-rail" x1="0" y1="0" x2="32" y2="32">
          <stop offset="0%" stopColor="#5eead4" />
          <stop offset="50%" stopColor="#5b9bff" />
          <stop offset="100%" stopColor="#c084fc" />
        </linearGradient>
      </defs>
      <circle
        cx="16"
        cy="16"
        r="14.5"
        stroke="url(#loadit-rail)"
        strokeOpacity="0.25"
      />
      {/* converging rails */}
      <path
        d="M5 9 H16 a5 5 0 0 1 5 5"
        stroke="url(#loadit-rail)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M5 16 H16"
        stroke="url(#loadit-rail)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M5 23 H16 a5 5 0 0 0 5 -5"
        stroke="url(#loadit-rail)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* settlement node */}
      <circle cx="22.5" cy="16" r="3" fill="url(#loadit-rail)" />
    </svg>
  );
}
