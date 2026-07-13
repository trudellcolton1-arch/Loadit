import { cn } from "@/lib/utils";

/**
 * Loadit brand mark — the green "L→" logo (transparent PNG, reads on dark
 * surfaces). Sizing is controlled via className (the asset is square).
 */
export function Logo({
  className,
  alt = "",
  priority = false,
}: {
  className?: string;
  alt?: string;
  priority?: boolean;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/loadit-mark.png"
      alt={alt}
      width={64}
      height={64}
      decoding="async"
      loading={priority ? "eager" : "lazy"}
      className={cn("h-7 w-7 select-none object-contain", className)}
      aria-hidden={alt === "" ? true : undefined}
      draggable={false}
    />
  );
}
