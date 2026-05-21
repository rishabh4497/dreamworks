import type { Tag } from "@/lib/types";
import { compactNumber } from "@/lib/utils";

export function StoreTagBreakdown({ tags }: { tags: Tag[] }) {
  if (tags.length === 0) return null;
  const max = Math.max(...tags.map((t) => t.voteCount));
  return (
    <div className="space-y-1.5">
      {tags.map((t) => (
        <div key={t.slug} className="flex items-center gap-3">
          <span className="w-32 text-[12px] text-foreground/80 truncate">{t.name}</span>
          <div className="h-1.5 flex-1 rounded-full bg-card-active overflow-hidden">
            <div
              className="h-full rounded-full bg-steam-accent"
              style={{ width: `${(t.voteCount / max) * 100}%` }}
            />
          </div>
          <span className="w-14 text-right text-[11px] text-muted/60 tabular-nums">
            {compactNumber(t.voteCount)}
          </span>
        </div>
      ))}
    </div>
  );
}
