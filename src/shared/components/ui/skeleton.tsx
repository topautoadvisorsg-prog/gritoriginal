import { cn } from "@/shared/lib/utils";

/**
 * Branded shimmer skeleton — premium feel.
 * Uses a diagonal moving highlight on a muted base color, GPU-accelerated.
 * Respects prefers-reduced-motion (animation falls back to a static pulse).
 */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("skeleton-shimmer rounded-md", className)}
      aria-hidden="true"
      {...props}
    />
  );
}

export { Skeleton };
