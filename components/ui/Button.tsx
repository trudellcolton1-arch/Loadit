"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost";

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  href?: string;
}

const base =
  "group relative inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium tracking-tight transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rail-400 focus-visible:ring-offset-2 focus-visible:ring-offset-void disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary:
    "text-void bg-white hover:bg-white/90 shadow-[0_0_40px_-8px_rgba(255,255,255,0.4)] hover:shadow-[0_0_50px_-6px_rgba(91,155,255,0.6)]",
  secondary:
    "text-white glass glass-hover hover:shadow-glow",
  ghost: "text-white/70 hover:text-white",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", href, children, ...props }, ref) => {
    const classes = cn(base, variants[variant], className);
    if (href) {
      return (
        <a href={href} className={classes}>
          {children}
        </a>
      );
    }
    return (
      <button ref={ref} className={classes} {...props}>
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
