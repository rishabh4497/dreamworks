import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { Pencil } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { useLibraryStore } from "@/stores/library-store";
import { useGames } from "@/hooks/use-games";
import { useFriends } from "@/hooks/use-friends";
import { useCompletionStats, useLibraryValue } from "@/hooks/use-account";
import { ROUTES } from "@/lib/routes";
import {
  cn,
  compactNumber,
  formatDate,
  formatHours,
  formatPrice,
  relativeDate,
} from "@/lib/utils";
import { DEFAULT_AVATAR_OPTIONS } from "@/lib/avatar";
import { UserAvatar } from "@/components/avatar/UserAvatar";
import { AvatarCustomizer } from "@/components/avatar/AvatarCustomizer";
import { Button } from "@/components/ui/button";
import { SpendHoursDashboard } from "@/components/profile/SpendHoursDashboard";
import { RecommendationsSection } from "@/components/profile/RecommendationsSection";
import { toast } from "@/stores/toast-store";
import type { Friend, Game, LibraryEntry } from "@/lib/types";

export function ProfilePage() {
  const profile = useAuthStore((s) => s.profile);
  const library = useLibraryStore((s) => s.entries);
  const { data: games } = useGames();
  const { data: value } = useLibraryValue();
  const { data: stats } = useCompletionStats();
  const { data: friends } = useFriends();
  const [customizerOpen, setCustomizerOpen] = useState(false);

  if (!profile) return null;

  const avatarOptions = profile.avatarOptions ?? DEFAULT_AVATAR_OPTIONS;
  const totalMinutes = library.reduce((acc, e) => acc + e.playMinutes, 0);
  const showcase = (games ?? []).filter((g) => profile.showcaseGameIds.includes(g.id));

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      {/* ── Hero band ────────────────────────────────────────────────────── */}
      <section className="relative mb-8 overflow-hidden rounded-2xl border border-separator">
        <div className="h-32 bg-gradient-to-br from-acid/25 via-positive/15 to-transparent" />
        <div className="flex flex-col gap-4 px-6 pb-6 pt-0 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="relative -mt-12 shrink-0">
              <UserAvatar
                options={avatarOptions}
                size={112}
                className="border-4 border-bg bg-card shadow-xl shadow-black/40"
              />
              <button
                onClick={() => setCustomizerOpen(true)}
                aria-label="Edit avatar"
                className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border border-separator bg-card-active text-foreground/80 shadow-md hover:bg-input hover:text-foreground transition-colors"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex flex-col gap-1.5 sm:pb-1">
              <h1 className="text-[22px] font-semibold leading-tight tracking-tight text-foreground">
                {profile.displayName}
              </h1>
              <p className="text-[12px] text-muted/60">@{profile.uid}</p>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <Pill tone="acid">Lvl {profile.level}</Pill>
                <Pill>{profile.country}</Pill>
                <Pill>Member since {formatDate(profile.memberSince)}</Pill>
              </div>
              <p className="mt-2 text-[13px] text-foreground/70 max-w-prose">{profile.bio}</p>
            </div>
          </div>
          <div className="sm:pb-1">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => toast.info("Profile editor coming soon")}
            >
              Edit profile
            </Button>
          </div>
        </div>
      </section>

      {/* ── Spend & Hours dashboard ──────────────────────────────────────── */}
      <SpendHoursDashboard />

      {/* ── Stats grid ───────────────────────────────────────────────────── */}
      <section className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat
          label="Games owned"
          value={library.length.toString()}
          trend="+3 this month"
          tone="positive"
        />
        <Stat
          label="Time played"
          value={formatHours(totalMinutes)}
          trend="+12 hrs this week"
          tone="positive"
        />
        <Stat
          label="Library value"
          value={value ? formatPrice(value.currentRetailCents) : "—"}
          trend={value ? `${formatPrice(value.totalSpentCents)} spent` : ""}
          tone="muted"
        />
        <Stat
          label="Achievements"
          value={stats ? compactNumber(stats.achievementsUnlocked) : "—"}
          trend={stats ? `${stats.perfectGames} perfect games` : ""}
          tone="positive"
        />
      </section>

      {/* ── Showcase ─────────────────────────────────────────────────────── */}
      {showcase.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-[14px] font-semibold text-foreground">Showcase</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {showcase.map((g) => (
              <Link
                key={g.id}
                to={ROUTES.gameDetail(g.id)}
                className="overflow-hidden rounded-xl border border-separator bg-card hover:bg-card-hover transition-colors"
              >
                <img
                  src={g.headerUrl}
                  alt=""
                  className="aspect-[460/215] w-full object-cover"
                />
                <div className="p-3">
                  <p className="truncate text-[13px] font-semibold text-foreground">{g.name}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Top genres ───────────────────────────────────────────────────── */}
      <TopGenres library={library} games={games ?? []} />

      {/* ── Recommendations (behavior + friends) ─────────────────────────── */}
      <RecommendationsSection />

      {/* ── Recently played ──────────────────────────────────────────────── */}
      <RecentlyPlayed library={library} games={games ?? []} />

      {/* ── Friends rail ─────────────────────────────────────────────────── */}
      <FriendsRail friends={friends ?? []} />

      <AvatarCustomizer
        open={customizerOpen}
        onClose={() => setCustomizerOpen(false)}
        initialOptions={avatarOptions}
      />
    </motion.div>
  );
}

// ── Stat tile ─────────────────────────────────────────────────────────────
interface StatProps {
  label: string;
  value: string;
  trend?: string;
  tone?: "positive" | "muted";
}

function Stat({ label, value, trend, tone = "muted" }: StatProps) {
  return (
    <div className="rounded-xl border border-separator bg-card p-4">
      <p className="text-[10px] uppercase tracking-widest text-muted/50">{label}</p>
      <p className="mt-1 text-[20px] font-semibold tabular-nums text-foreground">{value}</p>
      {trend && (
        <p
          className={cn(
            "mt-1 text-[11px]",
            tone === "positive" ? "text-positive" : "text-muted/60",
          )}
        >
          {trend}
        </p>
      )}
    </div>
  );
}

// ── Pill badge ────────────────────────────────────────────────────────────
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
        "inline-flex items-center rounded-full border px-2 py-[2px] text-[10px] font-semibold tracking-wide",
        tone === "acid"
          ? "border-acid/30 bg-acid/10 text-acid"
          : "border-separator bg-card text-foreground/70",
      )}
    >
      {children}
    </span>
  );
}

// ── Top genres bar chart ─────────────────────────────────────────────────
function TopGenres({ library, games }: { library: LibraryEntry[]; games: Game[] }) {
  const rows = useMemo(() => {
    const byId = new Map(games.map((g) => [g.id, g] as const));
    const totals = new Map<string, number>();
    for (const entry of library) {
      const g = byId.get(entry.gameId);
      if (!g || entry.playMinutes <= 0) continue;
      for (const genre of g.genres) {
        totals.set(genre, (totals.get(genre) ?? 0) + entry.playMinutes);
      }
    }
    const sorted = [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
    const max = sorted[0]?.[1] ?? 1;
    return sorted.map(([genre, minutes]) => ({
      genre,
      minutes,
      pct: Math.max(4, Math.round((minutes / max) * 100)),
    }));
  }, [library, games]);

  if (rows.length === 0) return null;

  return (
    <section className="mb-8">
      <h2 className="mb-3 text-[14px] font-semibold text-foreground">Top genres</h2>
      <div className="rounded-xl border border-separator bg-card p-4">
        <div className="flex flex-col gap-2.5">
          {rows.map((row) => (
            <div key={row.genre} className="flex items-center gap-3">
              <p className="w-28 shrink-0 truncate text-[12px] font-medium text-foreground/80">
                {row.genre}
              </p>
              <div className="relative flex-1">
                <div className="h-2.5 rounded-full bg-input">
                  <div
                    className="h-2.5 rounded-full bg-gradient-to-r from-positive to-acid"
                    style={{ width: `${row.pct}%` }}
                  />
                </div>
              </div>
              <p className="w-16 shrink-0 text-right text-[11px] tabular-nums text-muted/70">
                {formatHours(row.minutes)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Recently played ──────────────────────────────────────────────────────
function RecentlyPlayed({ library, games }: { library: LibraryEntry[]; games: Game[] }) {
  const byId = useMemo(() => new Map(games.map((g) => [g.id, g] as const)), [games]);
  const recent = useMemo(() => {
    return [...library]
      .filter((e) => e.lastPlayed)
      .sort((a, b) => new Date(b.lastPlayed!).getTime() - new Date(a.lastPlayed!).getTime())
      .slice(0, 5);
  }, [library]);

  if (recent.length === 0) return null;

  return (
    <section className="mb-8">
      <h2 className="mb-3 text-[14px] font-semibold text-foreground">Recently played</h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {recent.map((entry) => {
          const game = byId.get(entry.gameId);
          if (!game) return null;
          return (
            <Link
              key={entry.gameId}
              to={ROUTES.gameDetail(game.id)}
              className="group overflow-hidden rounded-xl border border-separator bg-card transition-all hover:-translate-y-0.5 hover:bg-card-hover"
            >
              <img
                src={game.capsuleUrl}
                alt=""
                className="aspect-[460/215] w-full object-cover"
              />
              <div className="p-2.5">
                <p className="truncate text-[12px] font-semibold text-foreground">{game.name}</p>
                <p className="mt-0.5 text-[10px] text-muted/60">
                  Last played {relativeDate(entry.lastPlayed!).toLowerCase()}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

// ── Friends rail ─────────────────────────────────────────────────────────
function FriendsRail({ friends }: { friends: Friend[] }) {
  if (friends.length === 0) return null;
  const visible = friends.slice(0, 8);

  return (
    <section className="mb-8">
      <h2 className="mb-3 text-[14px] font-semibold text-foreground">Friends</h2>
      <div className="rounded-xl border border-separator bg-card p-4">
        <div className="flex flex-wrap gap-4">
          {visible.map((f) => (
            <button
              key={f.uid}
              type="button"
              onClick={() => toast.info("Profile coming soon")}
              className="group flex flex-col items-center gap-1.5"
            >
              <div className="relative">
                <img
                  src={f.avatarUrl}
                  alt=""
                  className="h-12 w-12 rounded-full border border-separator object-cover transition-transform group-hover:-translate-y-0.5"
                />
                <span
                  className={cn(
                    "absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-bg",
                    statusToColor(f.status),
                  )}
                  aria-label={f.status}
                />
              </div>
              <p className="max-w-[80px] truncate text-[11px] font-medium text-foreground/80">
                {f.displayName}
              </p>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function statusToColor(status: Friend["status"]): string {
  if (status === "in-game") return "bg-acid";
  if (status === "online") return "bg-green";
  if (status === "away") return "bg-orange";
  return "bg-muted/40";
}
