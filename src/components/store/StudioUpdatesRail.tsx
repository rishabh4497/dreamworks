import { Link } from "react-router-dom";
import { Megaphone } from "lucide-react";
import { useAnnouncementsByApps } from "@/hooks/use-announcements";
import { ROUTES } from "@/lib/routes";
import { relativeDate } from "@/lib/utils";
import type { Announcement, Game } from "@/lib/types";

interface StudioUpdatesRailProps {
  name: string;
  games: Game[];
}

const CAT_STYLES: Record<Announcement["category"], string> = {
  patch: "text-cyan",
  event: "text-acid",
  news: "text-green",
  maintenance: "text-orange",
};

/**
 * Surfaces announcements authored from the Developer Portal across all of a
 * studio's apps. Sibling to <EntityNewsRail/>, which pulls editorial news.
 */
export function StudioUpdatesRail({ name, games }: StudioUpdatesRailProps) {
  const ids = games.map((g) => g.id);
  const { data, isLoading } = useAnnouncementsByApps(ids);
  const items = (data ?? []).slice(0, 5);
  const titleByApp = new Map(games.map((g) => [g.id, g.name] as const));

  if (isLoading || items.length === 0) return null;

  return (
    <div className="rounded-2xl border border-separator bg-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <Megaphone className="h-3.5 w-3.5 text-acid" />
        <h3 className="text-[13px] font-semibold text-foreground">From {name}</h3>
      </div>

      <ul className="divide-y divide-separator">
        {items.map((a) => (
          <li key={a.id} className="py-2.5 first:pt-0 last:pb-0">
            <Link to={ROUTES.gameDetail(a.appId)} className="group block">
              <p className="line-clamp-2 text-[12px] font-medium leading-snug text-foreground/90 transition-colors group-hover:text-acid">
                {a.title}
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-[10px] text-muted/55">
                <span className={`uppercase tracking-widest ${CAT_STYLES[a.category]}`}>
                  {a.category}
                </span>
                <span>·</span>
                <span className="truncate">{titleByApp.get(a.appId) ?? a.appId}</span>
                <span>·</span>
                <span>{relativeDate(a.publishedAt)}</span>
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
