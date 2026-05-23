import { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Building, Building2, Sparkles } from "lucide-react";
import { useGamesByDeveloper, useGamesByPublisher } from "@/hooks/use-games";
import { useDeveloper } from "@/hooks/use-developer";
import { usePublisher } from "@/hooks/use-publisher";
import { useGameReviews } from "@/hooks/use-reviews";
import { useAIDeveloperOverview, useAIPublisherOverview } from "@/hooks/use-ai";
import type { Game } from "@/lib/types";
import type { StudioOverviewPayload } from "@/lib/ai/payload-types";
import { ROUTES } from "@/lib/routes";
import { slugify } from "@/lib/utils";

interface AIStudioOverviewProps {
  kind: "Developer" | "Publisher";
  name: string;
  /** Compact variant for the game-detail cross-reference card. */
  variant?: "full" | "compact";
}

const MIN_CATALOG_FOR_OVERVIEW = 1;
const MAX_REVIEW_EXCERPTS = 8;

export function AIStudioOverview({ kind, name, variant = "full" }: AIStudioOverviewProps) {
  const slug = slugify(name);
  const isDeveloper = kind === "Developer";
  // Call both query hooks unconditionally (Rules of Hooks). The inactive one
  // is gated by passing an empty slug, which flips its `enabled` to false.
  const devGames = useGamesByDeveloper(isDeveloper ? slug : "");
  const pubGames = useGamesByPublisher(!isDeveloper ? slug : "");
  const games = isDeveloper ? devGames : pubGames;
  const dbDev = useDeveloper(isDeveloper ? slug : undefined);
  const dbPub = usePublisher(!isDeveloper ? slug : undefined);
  const dbProfile = isDeveloper ? dbDev.data : dbPub.data;

  const topGame = useMemo<Game | null>(() => {
    const list = games.data ?? [];
    if (list.length === 0) return null;
    return [...list].sort((a, b) => b.reviewSummary.scorePct - a.reviewSummary.scorePct)[0];
  }, [games.data]);

  const reviews = useGameReviews(topGame?.id);

  const payload = useMemo<StudioOverviewPayload | null>(() => {
    if (!games.data || games.data.length < MIN_CATALOG_FOR_OVERVIEW) return null;
    if (!topGame) return null;
    const excerpts = (reviews.data ?? [])
      .map((r) => r.body)
      .filter((s): s is string => typeof s === "string" && s.length > 0)
      .slice(0, MAX_REVIEW_EXCERPTS);

    return {
      kind: isDeveloper ? "developer" : "publisher",
      name,
      tagline: dbProfile?.tagline,
      catalog: games.data.map((g) => ({
        id: g.id,
        name: g.name,
        genres: g.genres,
        tags: g.tags.slice(0, 4),
        releaseDate: g.releaseDate,
        scorePct: g.reviewSummary.scorePct,
        totalReviews: g.reviewSummary.totalReviews,
        comingSoon: !!g.comingSoon,
      })),
      reviewSamples: excerpts.length > 0 ? { gameId: topGame.id, excerpts } : undefined,
    };
  }, [games.data, topGame, reviews.data, isDeveloper, name, dbProfile?.tagline]);

  const developerQuery = useAIDeveloperOverview(isDeveloper ? payload : null);
  const publisherQuery = useAIPublisherOverview(!isDeveloper ? payload : null);
  const ai = isDeveloper ? developerQuery : publisherQuery;

  // Hide entirely on error or when no catalog exists.
  if (ai.error || (games.data && games.data.length === 0)) return null;

  const Icon = isDeveloper ? Building2 : Building;
  const heading =
    variant === "compact"
      ? `About the ${kind.toLowerCase()}: ${name}`
      : `Dreamworks AI · About ${name}`;

  const isLoading = ai.isLoading || games.isLoading || (!!topGame && reviews.isLoading);

  if (isLoading || !ai.data) {
    return <Skeleton variant={variant} />;
  }

  const gameNameById = new Map(games.data?.map((g) => [g.id, g.name]) ?? []);
  const mustPlay = ai.data.mustPlayGameIds
    .map((id) => ({ id, name: gameNameById.get(id) }))
    .filter((g): g is { id: string; name: string } => !!g.name);

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="rounded-2xl border border-acid/20 bg-card overflow-hidden"
    >
      <div className="flex items-center justify-between gap-3 border-b border-separator px-5 py-3 bg-gradient-to-r from-acid/10 via-transparent to-transparent">
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles className="h-4 w-4 text-acid shrink-0" />
          <Icon className="h-3.5 w-3.5 text-acid shrink-0" />
          <h3 className="text-[14px] font-semibold text-foreground truncate">{heading}</h3>
          <span className="rounded-full border border-acid/30 bg-acid/10 px-1.5 py-[1px] text-[9px] font-bold uppercase tracking-widest text-acid shrink-0">
            Beta
          </span>
        </div>
      </div>

      <div
        className={
          variant === "full"
            ? "grid gap-5 px-5 py-4 md:grid-cols-3"
            : "flex flex-col gap-3 px-5 py-4"
        }
      >
        <Section label="History" body={ai.data.history} variant={variant} />
        <Section label="Current peak" body={ai.data.currentPeak} variant={variant} />
        <Section label="Future outlook" body={ai.data.futureOutlook} variant={variant} />
      </div>

      {(ai.data.signatureThemes.length > 0 || mustPlay.length > 0) && (
        <div className="border-t border-separator px-5 py-3 space-y-2.5">
          {ai.data.signatureThemes.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted/60 mr-1">
                Signature
              </span>
              {ai.data.signatureThemes.map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-separator bg-card-active px-2 py-[2px] text-[10.5px] text-foreground/75"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
          {mustPlay.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted/60 mr-1">
                Must play
              </span>
              {mustPlay.slice(0, 5).map((g) => (
                <Link
                  key={g.id}
                  to={ROUTES.gameDetail(g.id)}
                  className="rounded-md border border-separator bg-card-active px-2 py-[2px] text-[10.5px] text-foreground/85 hover:border-acid/40 hover:bg-acid/10 hover:text-acid"
                >
                  {g.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </motion.section>
  );
}

function Section({
  label,
  body,
  variant,
}: {
  label: string;
  body: string;
  variant: "full" | "compact";
}) {
  return (
    <div className="space-y-1.5">
      <h4
        className={
          variant === "full"
            ? "text-[10px] font-semibold uppercase tracking-widest text-muted/60"
            : "text-[10px] font-semibold uppercase tracking-widest text-acid/80"
        }
      >
        {label}
      </h4>
      <p
        className={
          variant === "full"
            ? "text-[12.5px] leading-relaxed text-foreground/80"
            : "text-[12px] leading-relaxed text-foreground/75"
        }
      >
        {body}
      </p>
    </div>
  );
}

function Skeleton({ variant }: { variant: "full" | "compact" }) {
  return (
    <div className="rounded-2xl border border-acid/20 bg-card overflow-hidden animate-pulse">
      <div className="border-b border-separator px-5 py-3 h-10" />
      <div
        className={
          variant === "full"
            ? "grid gap-5 px-5 py-4 md:grid-cols-3"
            : "flex flex-col gap-3 px-5 py-4"
        }
      >
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-2.5 w-20 bg-card-active rounded" />
            <div className="h-2.5 w-full bg-card-active rounded" />
            <div className="h-2.5 w-3/4 bg-card-active rounded" />
            <div className="h-2.5 w-2/3 bg-card-active rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
