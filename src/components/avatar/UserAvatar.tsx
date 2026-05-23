import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { renderAvatarSvg, type AvatarOptions } from "@/lib/avatar";

interface UserAvatarProps {
  options: AvatarOptions;
  size: number;
  className?: string;
}

/**
 * Renders a Notion-style avatar from the dicebear `notionists` collection.
 *
 * The SVG is built once per options object (memoized by stringified options)
 * so rapid customizer interaction stays snappy. The wrapping div clips to a
 * rounded square — notionists comes with rounded backgrounds, but the extra
 * clip keeps things consistent across browsers.
 */
export function UserAvatar({ options, size, className }: UserAvatarProps) {
  const svg = useMemo(() => renderAvatarSvg(options), [
    // Stable hash: include every customizable field.
    options.seed,
    options.backgroundColor,
    options.backgroundType,
    options.backgroundColor2,
    options.backgroundRotation,
    options.body,
    options.brows,
    options.eyes,
    options.glasses,
    options.hair,
    options.lips,
    options.nose,
    options.gesture,
    options.beard,
    options.bodyIcon,
    options.flip,
  ]);

  return (
    <div
      role="img"
      aria-label="User avatar"
      className={cn("rounded-2xl overflow-hidden inline-block shrink-0", className)}
      style={{ width: size, height: size }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
