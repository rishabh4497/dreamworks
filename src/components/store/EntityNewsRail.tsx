import { Link } from "react-router-dom";
import { ArrowRight, Newspaper } from "lucide-react";
import { useNewsByDeveloper, useNewsByPublisher } from "@/hooks/use-news";
import { ROUTES } from "@/lib/routes";
import { relativeDate } from "@/lib/utils";

interface EntityNewsRailProps {
  kind: "Developer" | "Publisher";
  name: string;
}

/**
 * Sidebar rail surfaced on developer/publisher storefronts. Shows the three
 * newest articles whose `relatedGameIds` overlap with the studio's catalog —
 * effectively "what's been written about this studio recently".
 */
export function EntityNewsRail({ kind, name }: EntityNewsRailProps) {
  // Always call both hooks (React rules-of-hooks); the inactive one is
  // disabled via its `enabled` flag inside the hook.
  const devQuery = useNewsByDeveloper(kind === "Developer" ? name : "");
  const pubQuery = useNewsByPublisher(kind === "Publisher" ? name : "");
  const query = kind === "Developer" ? devQuery : pubQuery;
  const articles = query.data ?? [];

  return (
    <div className="rounded-2xl border border-separator bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Newspaper className="h-3.5 w-3.5 text-acid" />
          <h3 className="text-[13px] font-semibold text-foreground">
            Latest from {name}
          </h3>
        </div>
        <Link
          to={ROUTES.news}
          className="inline-flex items-center gap-0.5 text-[11px] text-muted/60 hover:text-foreground/80"
        >
          All <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      {articles.length === 0 ? (
        <p className="py-6 text-center text-[11.5px] text-muted/50">
          No recent news from {name}.
        </p>
      ) : (
        <ul className="divide-y divide-separator">
          {articles.slice(0, 3).map((a) => (
            <li key={a.slug} className="py-2.5 first:pt-0 last:pb-0">
              <Link
                to={ROUTES.newsArticle(a.slug)}
                className="group flex gap-3"
              >
                <img
                  src={a.heroUrl}
                  alt=""
                  className="h-12 w-16 shrink-0 rounded-md object-cover"
                  loading="lazy"
                />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-[12px] font-medium leading-snug text-foreground/90 transition-colors group-hover:text-acid">
                    {a.title}
                  </p>
                  <p className="mt-1 text-[10px] text-muted/55">
                    {relativeDate(a.publishedAt)}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
