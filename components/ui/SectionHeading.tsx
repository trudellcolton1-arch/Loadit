import { cn } from "@/lib/utils";
import { Reveal } from "./Reveal";

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "max-w-3xl",
        align === "center" && "mx-auto text-center",
        className
      )}
    >
      {eyebrow && (
        <Reveal>
          <span className="eyebrow">
            <span className="h-1.5 w-1.5 rounded-full bg-rail-400 animate-pulse-rail" />
            {eyebrow}
          </span>
        </Reveal>
      )}
      <Reveal index={1}>
        <h2 className="mt-4 text-balance text-4xl font-semibold tracking-tightest text-gradient sm:text-5xl lg:text-6xl">
          {title}
        </h2>
      </Reveal>
      {description && (
        <Reveal index={2}>
          <p className="mt-5 text-pretty text-base leading-relaxed text-white/55 sm:text-lg">
            {description}
          </p>
        </Reveal>
      )}
    </div>
  );
}
