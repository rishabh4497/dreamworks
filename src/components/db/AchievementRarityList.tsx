import type { Achievement } from "@/lib/types";
import { cn } from "@/lib/utils";

export function AchievementRarityList({ achievements }: { achievements: Achievement[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-separator bg-card divide-y divide-separator">
      {achievements.map((a) => (
        <div key={a.id} className="flex items-center gap-3 px-4 py-2.5">
          <img
            src={a.iconUrl}
            alt=""
            className="h-8 w-8 rounded-md border border-separator object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-medium text-foreground/80">
              {a.hidden ? <span className="italic text-muted/50">Hidden achievement</span> : a.name}
            </p>
            <p className="truncate text-[11px] text-muted/50">
              {a.hidden ? "—" : a.description}
            </p>
          </div>
          <div className="flex items-center gap-2 w-44">
            <div className="h-1.5 flex-1 rounded-full bg-card-active overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full",
                  a.globalUnlockPct < 5
                    ? "bg-red"
                    : a.globalUnlockPct < 25
                    ? "bg-orange"
                    : "bg-positive",
                )}
                style={{ width: `${a.globalUnlockPct}%` }}
              />
            </div>
            <span className="w-10 text-right text-[11px] text-muted/70 tabular-nums">
              {a.globalUnlockPct}%
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
