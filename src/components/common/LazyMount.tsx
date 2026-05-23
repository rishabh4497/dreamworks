import { useRef, type ReactNode } from "react";
import { useInView } from "motion/react";

interface LazyMountProps {
  children: ReactNode;
  /** Reserved space (CSS height) before content mounts. Prevents layout shift. */
  placeholderHeight?: number | string;
  /** How far before the section enters the viewport to start mounting. */
  rootMargin?: string;
  /** Mount once and keep mounted (default true). Set false to remount on re-enter. */
  once?: boolean;
  className?: string;
}

/**
 * Defers rendering its children until the section is near the viewport.
 *
 * - Saves initial render time and avoids firing child queries (Firebase, Gemini,
 *   Recharts, image decoders) for sections the user may never scroll to.
 * - Reserves placeholderHeight to prevent CLS — pick a number close to the
 *   eventual rendered height of the section.
 *
 * Powered by motion/react's `useInView`, which uses IntersectionObserver under
 * the hood — zero bundle cost beyond what's already loaded.
 */
export function LazyMount({
  children,
  placeholderHeight = 200,
  rootMargin = "1200px",
  once = true,
  className,
}: LazyMountProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once, margin: rootMargin as `${number}px` });

  return (
    <div
      ref={ref}
      className={className}
      style={inView ? undefined : { minHeight: placeholderHeight }}
    >
      {inView ? children : null}
    </div>
  );
}
