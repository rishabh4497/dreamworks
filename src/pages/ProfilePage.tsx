import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Link } from "react-router-dom";
import {
  Award,
  Crown,
  Flame,
  Gamepad2,
  Heart,
  Pencil,
  Share2,
  Sparkles,
  Trophy,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
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
import { DreamworksWrapped } from "@/components/profile/DreamworksWrapped";
import { QuestsPanel } from "@/components/profile/QuestsPanel";
import { PlaytimeHeatmap } from "@/components/profile/PlaytimeHeatmap";
import { AvatarWardrobe } from "@/components/profile/AvatarWardrobe";
import { SpendHoursDashboard } from "@/components/profile/SpendHoursDashboard";
import { FamilyTimeProfiles } from "@/components/profile/FamilyTimeProfiles";
import { PostMatchCoach } from "@/components/profile/PostMatchCoach";
import { RecommendationsSection } from "@/components/profile/RecommendationsSection";
import { toast } from "@/stores/toast-store";
import type { Friend, Game, LibraryEntry } from "@/lib/types";
import { InteractiveAchievementRooms } from "@/components/features/UserFeatures";
import { AiHighlightReel } from "@/components/features/AiFeatures";

const EASE: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];

export function ProfilePage() {
  const profile = useAuthStore((s) => s.profile);
  const library = useLibraryStore((s) => s.entries);
  const { data: games } = useGames();
  const { data: value } = useLibraryValue();
  const { data: stats } = useCompletionStats();
  const { data: friends } = useFriends();
  const [customizerOpen, setCustomizerOpen] = useState(false);
  const [wrappedOpen, setWrappedOpen] = useState(false);

  if (!profile) return null;

  const avatarOptions = profile.avatarOptions ?? DEFAULT_AVATAR_OPTIONS;
  const totalMinutes = library.reduce((acc, e) => acc + e.playMinutes, 0);
  const showcase = (games ?? []).filter((g) => profile.showcaseGameIds.includes(g.id));
  const onlineFriends = (friends ?? []).filter((f) => f.status === "online" || f.status === "in-game").length;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="space-y-10">
      <ProfileHero
        profile={profile}
        avatarOptions={avatarOptions}
        onEditAvatar={() => setCustomizerOpen(true)}
        stats={{
          games: library.length,
          hours: totalMinutes,
          achievements: stats?.achievementsUnlocked ?? 0,
          friends: onlineFriends,
        }}
      />

      <WrappedBanner onLaunch={() => setWrappedOpen(true)} />

      <VitalsRow
        gamesOwned={library.length}
        totalMinutes={totalMinutes}
        libraryValueCents={value?.currentRetailCents}
        spentCents={value?.totalSpentCents}
        achievements={stats?.achievementsUnlocked ?? 0}
        perfectGames={stats?.perfectGames ?? 0}
        onlineFriends={onlineFriends}
      />

      <section>
        <SectionHeader
          icon={Zap}
          kicker="Engagement"
          title="Where you've spent your time"
          accent="var(--color-orange)"
        />
        <div className="mt-4 space-y-6">
          <QuestsPanel />
          <SpendHoursDashboard />
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <PlaytimeHeatmap />
        <RecentlyPlayedCard library={library} games={games ?? []} />
      </section>

      {showcase.length > 0 && (
        <section>
          <SectionHeader
            icon={Trophy}
            kicker="Showcase"
            title="On your shelf"
            accent="var(--color-acid)"
          />
          <ShowcaseGrid showcase={showcase} />
        </section>
      )}

      <section>
        <SectionHeader
          icon={Flame}
          kicker="Patterns"
          title="Your taste, at a glance"
          accent="var(--color-red)"
        />
        <TopGenres library={library} games={games ?? []} />
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <InteractiveAchievementRooms />
        <AiHighlightReel />
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <AvatarWardrobe />
        <FamilyTimeProfiles />
      </section>

      <PostMatchCoach />

      <RecommendationsSection />

      <FriendsRail friends={friends ?? []} />

      <AvatarCustomizer
        open={customizerOpen}
        onClose={() => setCustomizerOpen(false)}
        initialOptions={avatarOptions}
      />
      <DreamworksWrapped open={wrappedOpen} onClose={() => setWrappedOpen(false)} />
    </motion.div>
  );
}

// ── Hero ────────────────────────────────────────────────────────────────────

interface ProfileHeroProps {
  profile: NonNullable<ReturnType<typeof useAuthStore.getState>["profile"]>;
  avatarOptions: typeof DEFAULT_AVATAR_OPTIONS;
  onEditAvatar: () => void;
  stats: {
    games: number;
    hours: number;
    achievements: number;
    friends: number;
  };
}

function ProfileHero({ profile, avatarOptions, onEditAvatar, stats }: ProfileHeroProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE }}
      className="relative overflow-hidden rounded-3xl border border-separator bg-card/40 backdrop-blur-sm"
      style={{ boxShadow: "0 24px 60px -22px rgba(0,0,0,0.6), 0 0 0 1px color-mix(in srgb, var(--color-acid) 12%, transparent)" }}
    >
      {/* Animated festival orbs. */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -left-32 -top-32 h-[440px] w-[440px] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, color-mix(in srgb, var(--color-acid) 22%, transparent) 0%, transparent 70%)" }}
        animate={{ x: [0, 50, 0], y: [0, 28, 0], opacity: [0.55, 0.9, 0.55] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -right-24 top-1/4 h-[380px] w-[380px] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, color-mix(in srgb, var(--color-positive) 30%, transparent) 0%, transparent 70%)" }}
        animate={{ x: [0, -40, 0], y: [0, -22, 0], opacity: [0.45, 0.75, 0.45] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 left-1/3 h-[320px] w-[320px] rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, color-mix(in srgb, var(--color-cyan) 28%, transparent) 0%, transparent 70%)" }}
        animate={{ x: [0, 36, 0], y: [0, -18, 0], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 13, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Banner strip. */}
      <div className="relative h-36 sm:h-40">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-acid/20 via-positive/15 to-cyan/15" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
      </div>

      <div className="relative -mt-16 flex flex-col gap-6 px-6 pb-7 sm:flex-row sm:items-end sm:justify-between sm:px-8 sm:pb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="relative shrink-0">
            <UserAvatar
              options={avatarOptions}
              size={128}
              className="rounded-3xl border-4 border-background bg-card shadow-2xl shadow-black/50"
            />
            <button
              onClick={onEditAvatar}
              aria-label="Edit avatar"
              className="absolute -bottom-1 -right-1 inline-flex h-8 w-8 items-center justify-center rounded-full border border-separator bg-card-active text-foreground/80 shadow-md transition-all hover:bg-acid hover:text-background"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <motion.span
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -bottom-2 -left-2 inline-flex items-center gap-1 rounded-full bg-acid px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-background shadow-lg"
            >
              <Crown className="h-2.5 w-2.5" />
              Lvl {profile.level}
            </motion.span>
          </div>

          <div className="min-w-0 flex-1 sm:pb-2">
            <div className="flex items-center gap-1.5 text-acid">
              <Sparkles className="h-2.5 w-2.5" />
              <span className="text-[9.5px] font-bold uppercase tracking-[0.25em]">Player profile</span>
            </div>
            <h1 className="mt-1 text-[28px] font-extrabold leading-tight tracking-tight text-foreground sm:text-[32px]">
              {profile.displayName}
            </h1>
            <p className="mt-0.5 text-[12px] text-muted/65">@{profile.uid}</p>
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <Pill tone="acid">{profile.country}</Pill>
              <Pill>Member since {formatDate(profile.memberSince)}</Pill>
              {profile.isSubscribed && <Pill tone="plus">Plus member</Pill>}
            </div>
            {profile.bio && (
              <p className="mt-3 max-w-prose text-[13px] leading-relaxed text-foreground/75">{profile.bio}</p>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-3 sm:pb-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => toast.info("Share link copied")}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-separator bg-card-active text-muted/80 transition-all hover:bg-card-hover hover:text-foreground"
              aria-label="Share profile"
            >
              <Share2 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => toast.info("Profile editor coming soon")}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-acid px-4 text-[12px] font-bold text-background transition-all hover:brightness-110"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit profile
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-5">
            <HeroStat icon={Gamepad2} value={`${stats.games}`} label="Owned" accent="var(--color-acid)" />
            <HeroStat icon={Zap} value={formatHours(stats.hours)} label="Played" accent="var(--color-cyan)" />
            <HeroStat icon={Award} value={compactNumber(stats.achievements)} label="Trophies" accent="var(--color-orange)" />
            <HeroStat
              icon={Users}
              value={stats.friends > 0 ? `${stats.friends}` : "—"}
              label="Online"
              accent="var(--color-green)"
            />
          </div>
        </div>
      </div>
    </motion.section>
  );
}

function HeroStat({
  icon: Icon,
  value,
  label,
  accent,
}: {
  icon: typeof Gamepad2;
  value: string;
  label: string;
  accent: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="inline-flex h-8 w-8 items-center justify-center rounded-xl border"
        style={{
          borderColor: `color-mix(in srgb, ${accent} 28%, transparent)`,
          background: `color-mix(in srgb, ${accent} 12%, transparent)`,
        }}
      >
        <Icon className="h-3.5 w-3.5" style={{ color: accent }} />
      </span>
      <div>
        <p className="font-mono text-[15px] font-bold leading-none tabular-nums" style={{ color: accent }}>
          {value}
        </p>
        <p className="mt-1 text-[9.5px] uppercase tracking-widest text-muted/60">{label}</p>
      </div>
    </div>
  );
}

// ── Wrapped banner ──────────────────────────────────────────────────────────

function WrappedBanner({ onLaunch }: { onLaunch: () => void }) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE, delay: 0.05 }}
      whileHover={{ y: -2 }}
      onClick={onLaunch}
      className="group relative block w-full overflow-hidden rounded-3xl border p-6 text-left transition-shadow sm:p-7"
      style={{
        borderColor: "color-mix(in srgb, var(--color-acid) 28%, transparent)",
        boxShadow:
          "0 20px 50px -20px color-mix(in srgb, var(--color-acid) 35%, transparent), 0 8px 24px -8px rgba(0,0,0,0.5)",
      }}
    >
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, color-mix(in srgb, var(--color-acid) 35%, transparent) 0%, transparent 70%)" }}
        animate={{ scale: [1, 1.25, 1], opacity: [0.55, 0.9, 0.55] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -left-16 -bottom-20 h-60 w-60 rounded-full blur-3xl"
        style={{ background: "radial-gradient(circle, color-mix(in srgb, var(--color-positive) 38%, transparent) 0%, transparent 70%)" }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.45, 0.75, 0.45] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-acid/15 via-cyan/10 to-positive/15" />

      <div className="relative flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <motion.span
            animate={{ rotate: [0, -8, 8, -4, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-acid text-background shadow-[0_8px_24px_-6px_color-mix(in_srgb,var(--color-acid)_55%,transparent)]"
          >
            <Sparkles className="h-5 w-5" />
          </motion.span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-acid">Dreamworks Wrapped</p>
            <h2 className="mt-0.5 text-[22px] font-extrabold leading-tight text-foreground">
              Your year in gaming is here
            </h2>
            <p className="mt-1 text-[12.5px] text-muted/75">
              Stories, stats, and the games that defined your year. Tap to open.
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-xl bg-acid px-4 py-2.5 text-[12px] font-bold text-background transition-all group-hover:translate-x-0.5">
          Open Wrapped →
        </span>
      </div>
    </motion.button>
  );
}

// ── Vitals row ──────────────────────────────────────────────────────────────

interface VitalsRowProps {
  gamesOwned: number;
  totalMinutes: number;
  libraryValueCents: number | undefined;
  spentCents: number | undefined;
  achievements: number;
  perfectGames: number;
  onlineFriends: number;
}

function VitalsRow({
  gamesOwned,
  totalMinutes,
  libraryValueCents,
  spentCents,
  achievements,
  perfectGames,
  onlineFriends,
}: VitalsRowProps) {
  const cards = [
    {
      icon: Gamepad2,
      label: "Games owned",
      value: `${gamesOwned}`,
      sub: gamesOwned > 0 ? "+3 this month" : "Start your library",
      accent: "var(--color-acid)",
    },
    {
      icon: Zap,
      label: "Time played",
      value: formatHours(totalMinutes),
      sub: totalMinutes > 0 ? "+12 hrs this week" : "No sessions yet",
      accent: "var(--color-cyan)",
    },
    {
      icon: Wallet,
      label: "Library value",
      value: libraryValueCents ? formatPrice(libraryValueCents) : "—",
      sub: spentCents !== undefined ? `${formatPrice(spentCents)} spent` : "",
      accent: "var(--color-positive)",
    },
    {
      icon: Trophy,
      label: "Achievements",
      value: achievements > 0 ? compactNumber(achievements) : "—",
      sub: perfectGames > 0 ? `${perfectGames} perfect runs` : "Chase a 100%",
      accent: "var(--color-orange)",
    },
    {
      icon: Heart,
      label: "Friends online",
      value: onlineFriends > 0 ? `${onlineFriends}` : "—",
      sub: onlineFriends > 0 ? "Drop in and say hi" : "All quiet tonight",
      accent: "var(--color-green)",
    },
  ];

  return (
    <section>
      <SectionHeader icon={Award} kicker="Vitals" title="Quick stats" accent="var(--color-cyan)" />
      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        {cards.map((c, idx) => {
          const Icon = c.icon;
          return (
            <motion.div
              key={c.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.04, ease: EASE }}
              whileHover={{ y: -3 }}
              className="relative overflow-hidden rounded-2xl border border-separator bg-card/60 p-4 backdrop-blur-sm"
              style={{
                boxShadow: `0 0 0 1px color-mix(in srgb, ${c.accent} 14%, transparent)`,
              }}
            >
              <div
                aria-hidden
                className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full blur-2xl"
                style={{ background: `radial-gradient(circle, color-mix(in srgb, ${c.accent} 45%, transparent) 0%, transparent 70%)` }}
              />
              <div className="relative flex items-center gap-3">
                <span
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border"
                  style={{
                    borderColor: `color-mix(in srgb, ${c.accent} 30%, transparent)`,
                    background: `color-mix(in srgb, ${c.accent} 12%, transparent)`,
                  }}
                >
                  <Icon className="h-4 w-4" style={{ color: c.accent }} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-[20px] font-extrabold leading-none tabular-nums" style={{ color: c.accent }}>
                    {c.value}
                  </p>
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-foreground/85">
                    {c.label}
                  </p>
                  {c.sub && <p className="mt-0.5 truncate text-[10.5px] text-muted/65">{c.sub}</p>}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

// ── Recently played card (paired with heatmap) ──────────────────────────────

function RecentlyPlayedCard({ library, games }: { library: LibraryEntry[]; games: Game[] }) {
  const byId = useMemo(() => new Map(games.map((g) => [g.id, g] as const)), [games]);
  const recent = useMemo(
    () =>
      [...library]
        .filter((e) => e.lastPlayed)
        .sort((a, b) => new Date(b.lastPlayed!).getTime() - new Date(a.lastPlayed!).getTime())
        .slice(0, 5),
    [library],
  );

  if (recent.length === 0) {
    return (
      <div className="flex h-full min-h-[280px] items-center justify-center rounded-2xl border border-separator bg-card/40 p-6 text-center backdrop-blur-sm">
        <p className="text-[12.5px] text-muted/70">Nothing here yet. Start a game and it'll show up.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-separator bg-card/40 backdrop-blur-sm">
      <div className="flex items-center gap-2 border-b border-separator px-4 py-3">
        <Zap className="h-3 w-3 text-orange" />
        <h3 className="text-[12px] font-bold uppercase tracking-[0.2em] text-muted/75">Recently played</h3>
      </div>
      <ul className="flex-1 divide-y divide-separator/60">
        {recent.map((entry) => {
          const game = byId.get(entry.gameId);
          if (!game) return null;
          return (
            <li key={entry.gameId}>
              <Link
                to={ROUTES.gameDetail(game.id)}
                className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-card-hover"
              >
                <div className="h-12 w-20 shrink-0 overflow-hidden rounded-md bg-card-active">
                  <img
                    src={game.capsuleUrl}
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12.5px] font-semibold text-foreground">{game.name}</p>
                  <p className="mt-0.5 text-[10.5px] text-muted/65">
                    {formatHours(entry.playMinutes)} · {relativeDate(entry.lastPlayed!).toLowerCase()}
                  </p>
                </div>
                <span className="text-[11px] font-semibold text-acid opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100">
                  →
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ── Showcase ────────────────────────────────────────────────────────────────

function ShowcaseGrid({ showcase }: { showcase: Game[] }) {
  return (
    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
      {showcase.slice(0, 3).map((g, idx) => (
        <motion.div
          key={g.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: idx * 0.05, ease: EASE }}
          whileHover={{ y: -4 }}
        >
          <Link
            to={ROUTES.gameDetail(g.id)}
            className="group relative block h-[220px] overflow-hidden rounded-2xl border border-separator"
          >
            <img
              src={g.headerUrl}
              alt={g.name}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-acid">
                Showcase pick #{idx + 1}
              </p>
              <p className="mt-1 truncate text-[16px] font-extrabold text-foreground drop-shadow">
                {g.name}
              </p>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}

// ── Top genres ──────────────────────────────────────────────────────────────

const GENRE_TONES: string[] = [
  "var(--color-acid)",
  "var(--color-cyan)",
  "var(--color-orange)",
  "var(--color-green)",
  "var(--color-red)",
];

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
    return sorted.map(([genre, minutes], idx) => ({
      genre,
      minutes,
      pct: Math.max(6, Math.round((minutes / max) * 100)),
      tone: GENRE_TONES[idx % GENRE_TONES.length],
    }));
  }, [library, games]);

  if (rows.length === 0) {
    return (
      <div className="mt-4 rounded-2xl border border-separator bg-card/40 p-6 text-center text-[12.5px] text-muted/70 backdrop-blur-sm">
        Play a few games and your genre signature shows up here.
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-2xl border border-separator bg-card/40 p-5 backdrop-blur-sm">
      <div className="flex flex-col gap-3">
        {rows.map((row, idx) => (
          <motion.div
            key={row.genre}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: idx * 0.05, ease: EASE }}
            className="flex items-center gap-3"
          >
            <div className="flex w-32 shrink-0 items-center gap-2">
              <span className="block h-2 w-2 rounded-full" style={{ background: row.tone, boxShadow: `0 0 8px ${row.tone}` }} />
              <p className="truncate text-[12.5px] font-semibold capitalize text-foreground">
                {row.genre}
              </p>
            </div>
            <div className="relative flex-1">
              <div className="h-2.5 rounded-full bg-input/70">
                <motion.div
                  className="h-2.5 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${row.pct}%` }}
                  transition={{ duration: 0.8, delay: 0.1 + idx * 0.05, ease: EASE }}
                  style={{
                    background: `linear-gradient(90deg, ${row.tone} 0%, color-mix(in srgb, ${row.tone} 55%, transparent) 100%)`,
                    boxShadow: `0 0 12px color-mix(in srgb, ${row.tone} 40%, transparent)`,
                  }}
                />
              </div>
            </div>
            <p className="w-20 shrink-0 text-right font-mono text-[11.5px] tabular-nums text-muted/75">
              {formatHours(row.minutes)}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ── Friends rail ────────────────────────────────────────────────────────────

function FriendsRail({ friends }: { friends: Friend[] }) {
  if (friends.length === 0) return null;
  const visible = friends.slice(0, 10);

  return (
    <section>
      <SectionHeader
        icon={Users}
        kicker="Crew"
        title="Friends"
        accent="var(--color-green)"
        action={{ label: "See all", to: ROUTES.friends }}
      />
      <div className="mt-4 rounded-2xl border border-separator bg-card/40 p-5 backdrop-blur-sm">
        <div className="flex flex-wrap gap-5">
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
                  className="h-14 w-14 rounded-2xl border border-separator object-cover transition-all group-hover:-translate-y-1 group-hover:border-acid/40"
                />
                <span
                  className={cn(
                    "absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-background",
                    statusToColor(f.status),
                  )}
                  aria-label={f.status}
                />
              </div>
              <p className="max-w-[88px] truncate text-[11px] font-semibold text-foreground/85">
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

// ── Section header ──────────────────────────────────────────────────────────

interface SectionHeaderProps {
  icon: typeof Zap;
  kicker: string;
  title: string;
  accent: string;
  action?: { label: string; to: string };
}

function SectionHeader({ icon: Icon, kicker, title, accent, action }: SectionHeaderProps) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div>
        <div className="flex items-center gap-1.5" style={{ color: accent }}>
          <Icon className="h-3 w-3" />
          <span className="text-[10px] font-bold uppercase tracking-[0.25em]">{kicker}</span>
        </div>
        <h2 className="mt-1 text-[18px] font-bold leading-tight text-foreground">{title}</h2>
      </div>
      {action && (
        <Link
          to={action.to}
          className="text-[11.5px] font-semibold hover:underline"
          style={{ color: accent }}
        >
          {action.label} →
        </Link>
      )}
    </div>
  );
}

// ── Pill badge ──────────────────────────────────────────────────────────────

function Pill({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "acid" | "plus";
}) {
  if (tone === "plus") {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full border px-2 py-[2px] text-[10px] font-bold tracking-wide text-background"
        style={{ background: "#a052ff", borderColor: "#a052ff" }}
      >
        <Crown className="h-2.5 w-2.5" />
        {children}
      </span>
    );
  }
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
