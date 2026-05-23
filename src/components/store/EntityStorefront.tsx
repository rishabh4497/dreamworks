import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowLeft, Building, Building2, CalendarDays, Flame, Sparkles, Trophy } from "lucide-react";
import type { Game } from "@/lib/types";
import { ROUTES } from "@/lib/routes";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PriceTag } from "@/components/ui/price-tag";
import { RatingBar } from "@/components/ui/rating-bar";
import { GameCard } from "@/components/store/GameCard";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { EntityNewsRail } from "@/components/store/EntityNewsRail";
import { toast } from "@/stores/toast-store";
import { useAccentStore } from "@/stores/accent-store";
import { studioBrand } from "@/lib/studio-logos";
import { useDeveloper } from "@/hooks/use-developer";
import { usePublisher } from "@/hooks/use-publisher";
import { cn, slugify } from "@/lib/utils";

export type EntityKind = "Developer" | "Publisher";

interface EntityStorefrontProps {
  kind: EntityKind;
  name: string;
  games: Game[];
  isLoading: boolean;
}

function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "??";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

/**
 * Spotify-style brand gradient — the studio's primary color washed across the
 * top third of the hero, then dissolving into the page background. Returns the
 * `background` value for an `inset-0` div so callers don't have to know the
 * inner shape.
 */
function brandWashBackground(brandColor: string): string {
  // Two stacked linear gradients: brand color (with alpha) at the top fading
  // by ~70%, then a second pass that locks the bottom to the page background
  // so the studio card / overlay always reads cleanly.
  return `linear-gradient(180deg, ${brandColor}55 0%, ${brandColor}20 35%, transparent 70%), linear-gradient(180deg, transparent 50%, var(--color-background) 100%)`;
}

export function EntityStorefront({ kind, name, games, isLoading }: EntityStorefrontProps) {
  const sorted = useMemo(
    () => [...games].sort((a, b) => b.reviewSummary.scorePct - a.reviewSummary.scorePct),
    [games],
  );
  const featured = sorted[0];
  const restOfCatalog = useMemo(() => sorted.slice(1), [sorted]);

  const stats = useMemo(() => {
    if (games.length === 0) return null;
    const avgScore = Math.round(
      games.reduce((acc, g) => acc + g.reviewSummary.scorePct, 0) / games.length,
    );
    const totalReviews = games.reduce((acc, g) => acc + g.reviewSummary.totalReviews, 0);
    const titlesOnSale = games.filter((g) => g.isOnSale && !g.price.isFree).length;
    const oldestYear = games.reduce((min, g) => {
      const y = new Date(g.releaseDate).getFullYear();
      return Number.isFinite(y) && y < min ? y : min;
    }, Number.POSITIVE_INFINITY);
    const newestYear = games.reduce((max, g) => {
      const y = new Date(g.releaseDate).getFullYear();
      return Number.isFinite(y) && y > max ? y : max;
    }, 0);
    const yearsActive = oldestYear !== Number.POSITIVE_INFINITY && newestYear >= oldestYear
      ? newestYear - oldestYear + 1
      : null;
    return { avgScore, totalReviews, titlesOnSale, oldestYear, newestYear, yearsActive };
  }, [games]);

  const specialties = useMemo(() => {
    const genres = new Map<string, number>();
    const tags = new Map<string, number>();
    for (const g of games) {
      for (const genre of g.genres) genres.set(genre, (genres.get(genre) ?? 0) + 1);
      for (const tag of g.tags) tags.set(tag, (tags.get(tag) ?? 0) + 1);
    }
    const top = (m: Map<string, number>, n: number) =>
      [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([k]) => k);
    return { topGenres: top(genres, 4), topTags: top(tags, 6) };
  }, [games]);

  const entitySlug = slugify(name);
  const isDeveloper = kind === "Developer";
  const { data: developerEntity } = useDeveloper(isDeveloper ? entitySlug : undefined);
  const { data: publisherEntity } = usePublisher(!isDeveloper ? entitySlug : undefined);
  const dbProfile = isDeveloper ? developerEntity : publisherEntity;

  const Icon = isDeveloper ? Building2 : Building;
  const brand = studioBrand(name);
  // PlayStation blue fallback — neutral enough for any unknown studio.
  const wash = dbProfile?.brandColor || brand?.brandColor || "#66c0f4";
  const initials = initialsOf(name);

  // Drive the app-wide Spotify accent from the studio brand color.
  const setAccent = useAccentStore((s) => s.setAccent);
  useEffect(() => {
    setAccent(dbProfile?.brandColor || brand?.brandColor || null);
    return () => setAccent(null);
  }, [dbProfile?.brandColor, brand?.brandColor, setAccent]);
  const tagline = dbProfile?.tagline || (isDeveloper
    ? "Welcome to the studio — every game crafted here, all in one place."
    : "Discover the catalog this publisher brings to players worldwide.");

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Link
        to={ROUTES.store}
        className="inline-flex items-center gap-1.5 text-[12px] text-muted/60 hover:text-foreground/80 mb-4"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to store
      </Link>

      {/* ── Cinematic hero ───────────────────────────────────────────────── */}
      <section className="relative mb-8 overflow-hidden rounded-2xl border border-separator">
        <div className="relative h-56 sm:h-72">
          {dbProfile?.bannerUrl ? (
            <>
              <img
                src={dbProfile.bannerUrl}
                alt=""
                referrerPolicy="no-referrer"
                className="absolute inset-0 h-full w-full object-cover opacity-90"
              />
              <div
                className="absolute inset-0"
                style={{ background: brandWashBackground(wash) }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-background/70 via-transparent to-background/20" />
            </>
          ) : featured ? (
            <>
              <img
                src={featured.headerUrl}
                alt=""
                referrerPolicy="no-referrer"
                className="absolute inset-0 h-full w-full scale-110 object-cover blur-[2px] opacity-70"
              />
              {/* Spotify-style brand wash — studio's primary color across the
                  top, dissolving into the page background by the midline. */}
              <div
                className="absolute inset-0"
                style={{ background: brandWashBackground(wash) }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-background/70 via-transparent to-background/20" />
            </>
          ) : (
            <div
              className="absolute inset-0"
              style={{ background: brandWashBackground(wash) }}
            />
          )}
        </div>

        <div className="relative -mt-24 flex flex-col gap-4 px-6 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-4 sm:gap-5">
            <StudioLogo name={name} initials={initials} dbLogoUrl={dbProfile?.logoUrl} />
            <div className="min-w-0 pb-1">
              <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-acid">
                <Icon className="h-3.5 w-3.5" />
                {kind}
              </p>
              <h1 className="mt-1 text-[28px] font-bold leading-tight tracking-tight text-foreground sm:text-[34px]">
                {name}
              </h1>
              <p className="mt-1.5 max-w-prose text-[13px] text-muted/70">{tagline}</p>
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <Pill tone="acid">
                  {games.length} {games.length === 1 ? "game" : "games"}
                </Pill>
                {stats && <Pill>{stats.avgScore}% avg score</Pill>}
                {stats?.yearsActive && (
                  <Pill>
                    Since {stats.oldestYear} · {stats.yearsActive} {stats.yearsActive === 1 ? "year" : "years"}
                  </Pill>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2 sm:pb-1">
            <Button
              variant="primary"
              size="sm"
              onClick={() => toast.success(`Following ${name}`)}
            >
              Follow studio
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => toast.info(`Sharing ${name}'s storefront`)}
            >
              Share
            </Button>
          </div>
        </div>
      </section>

      {/* ── Loading ──────────────────────────────────────────────────────── */}
      {isLoading && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[210px] w-full" />
          ))}
        </div>
      )}

      {/* ── Empty ────────────────────────────────────────────────────────── */}
      {!isLoading && games.length === 0 && (
        <EmptyState
          icon={Icon}
          title={`No games for this ${kind.toLowerCase()} yet`}
          description={`We couldn't find any games ${
            isDeveloper ? "developed" : "published"
          } by "${name}".`}
          action={
            <Link to={ROUTES.store} className="text-[12px] text-acid hover:underline">
              Browse the store
            </Link>
          }
        />
      )}

      {/* ── Populated content ────────────────────────────────────────────── */}
      {/* 2-column grid at lg+: main catalog rail on the left, news on the
          right. Stacks single-column at md and below. */}
      {!isLoading && games.length > 0 && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div>
          {/* Stats strip */}
          {stats && (
            <section className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
              <StatTile
                icon={Trophy}
                label="Average score"
                value={`${stats.avgScore}%`}
                hint="across all titles"
              />
              <StatTile
                icon={Sparkles}
                label="Catalog size"
                value={games.length.toString()}
                hint={games.length === 1 ? "title" : "titles"}
              />
              <StatTile
                icon={CalendarDays}
                label="Years active"
                value={stats.yearsActive ? `${stats.yearsActive}` : "—"}
                hint={
                  stats.yearsActive
                    ? `${stats.oldestYear} → ${stats.newestYear}`
                    : "release dates pending"
                }
              />
              <StatTile
                icon={Flame}
                label="On sale now"
                value={stats.titlesOnSale.toString()}
                hint={stats.titlesOnSale === 0 ? "no active deals" : "active deals"}
              />
            </section>
          )}

          {/* Featured headliner */}
          {featured && (
            <section className="mb-8">
              <div className="mb-3 flex items-baseline justify-between">
                <h2 className="text-[16px] font-semibold text-foreground">Featured title</h2>
                <p className="text-[11px] text-muted/50">Highest reviewed in catalog</p>
              </div>
              <FeaturedHero game={featured} />
            </section>
          )}

          {/* Specialties */}
          {(specialties.topGenres.length > 0 || specialties.topTags.length > 0) && (
            <section className="mb-8">
              <h2 className="mb-3 text-[16px] font-semibold text-foreground">
                What {name} makes
              </h2>
              <div className="space-y-3 rounded-2xl border border-separator bg-card p-4">
                {specialties.topGenres.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted/50">
                      Genres
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {specialties.topGenres.map((genre) => (
                        <Link
                          key={genre}
                          to={ROUTES.storeCategory(slugify(genre))}
                          className="rounded-full border border-separator bg-card-active px-3 py-1 text-[11.5px] font-medium text-foreground/80 transition-colors hover:border-acid/40 hover:bg-acid/10 hover:text-acid"
                        >
                          {genre}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                {specialties.topTags.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted/50">
                      Recurring tags
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {specialties.topTags.map((tag) => (
                        <Link
                          key={tag}
                          to={ROUTES.storeTag(tag)}
                          className="rounded-md border border-separator bg-card-active px-2.5 py-1 text-[11px] text-foreground/75 transition-colors hover:border-acid/40 hover:bg-acid/15 hover:text-acid"
                        >
                          {tag}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Catalog */}
          {restOfCatalog.length > 0 && (
            <section>
              <h2 className="mb-3 text-[16px] font-semibold text-foreground">
                More from {name}
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {restOfCatalog.map((g) => (
                  <GameCard key={g.id} game={g} width="100%" />
                ))}
              </div>
            </section>
          )}
        </div>
        <aside className="space-y-4">
          <EntityNewsRail kind={kind} name={name} />
        </aside>
        </div>
      )}
    </motion.div>
  );
}

// ── Stat tile ──────────────────────────────────────────────────────────────
interface StatTileProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint?: string;
}

function StatTile({ icon: Icon, label, value, hint }: StatTileProps) {
  return (
    <div className="rounded-xl border border-separator bg-card p-4">
      <div className="mb-2 flex items-center gap-1.5 text-muted/60">
        <Icon className="h-3.5 w-3.5" />
        <p className="text-[10px] uppercase tracking-widest">{label}</p>
      </div>
      <p className="text-[20px] font-semibold tabular-nums text-foreground">{value}</p>
      {hint && <p className="mt-0.5 text-[11px] text-muted/60">{hint}</p>}
    </div>
  );
}

// ── Featured hero card ─────────────────────────────────────────────────────
function FeaturedHero({ game }: { game: Game }) {
  return (
    <Link
      to={ROUTES.gameDetail(game.id)}
      className="group relative block overflow-hidden rounded-2xl border border-separator bg-card transition-all hover:border-acid/30 hover:bg-card-hover"
    >
      <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr]">
        <div className="relative aspect-[16/9] overflow-hidden md:aspect-auto">
          <img
            src={game.headerUrl}
            alt={game.name}
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-card/60 md:to-card" />
        </div>
        <div className="flex flex-col justify-center gap-3 p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-1.5">
            {game.comingSoon && <Badge variant="soon">Coming Soon</Badge>}
            {game.price.isFree && <Badge variant="free">Free to Play</Badge>}
            {game.isOnSale && !game.price.isFree && (
              <Badge variant="discount">-{game.price.discountPct}%</Badge>
            )}
            <span className="text-[10px] uppercase tracking-widest text-acid">Headliner</span>
          </div>
          <h3 className="text-[22px] font-bold leading-tight tracking-tight text-foreground">
            {game.name}
          </h3>
          <RatingBar summary={game.reviewSummary} />
          {game.genres.length > 0 && (
            <p className="text-[12px] text-muted/70">{game.genres.join(" · ")}</p>
          )}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <PriceTag price={game.price} size="md" />
            <Button variant="primary" size="sm" className="ml-auto">
              View game →
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ── Studio logo ────────────────────────────────────────────────────────────
interface StudioLogoProps {
  name: string;
  initials: string;
  dbLogoUrl?: string;
}

function StudioLogo({ name, initials, dbLogoUrl }: StudioLogoProps) {
  const brand = studioBrand(name);
  const [failed, setFailed] = useState(false);
  const logoUrl = dbLogoUrl || brand?.logoUrl;
  const showLogo = !!logoUrl && !failed;

  return (
    <div
      className={cn(
        "flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-separator shadow-2xl shadow-black/50 sm:h-28 sm:w-28",
        showLogo ? "bg-white p-3" : "bg-card-active",
      )}
    >
      {showLogo ? (
        <img
          src={logoUrl}
          alt={`${name} logo`}
          className="h-full w-full object-contain"
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="text-[26px] font-bold tracking-tight text-foreground sm:text-[30px]">
          {initials}
        </span>
      )}
    </div>
  );
}

// ── Pill ───────────────────────────────────────────────────────────────────
function Pill({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "acid";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-[3px] text-[11px] font-semibold tracking-wide",
        tone === "acid"
          ? "border-acid/30 bg-acid/10 text-acid"
          : "border-separator bg-card text-foreground/70",
      )}
    >
      {children}
    </span>
  );
}
