import { useMemo } from "react";
import { motion } from "motion/react";
import { Flame, Sparkles } from "lucide-react";
import { UserAvatar } from "@/components/avatar/UserAvatar";
import { useAuthStore } from "@/stores/auth-store";
import { useLibraryStore } from "@/stores/library-store";
import { useWishlistStore } from "@/stores/wishlist-store";
import { useFriends } from "@/hooks/use-friends";
import { formatHours } from "@/lib/utils";

function greetingFor(now: Date, name: string): string {
  const hour = now.getHours();
  if (hour < 12) return `Good morning, ${name}`;
  if (hour < 17) return `Good afternoon, ${name}`;
  if (hour < 22) return `Good evening, ${name}`;
  return `Welcome back, ${name}`;
}

interface Stat {
  label: string;
  value: string;
  tone: "acid" | "positive" | "cyan" | "orange";
}

/**
 * Glass strip at the top of the store home. Avatar + time-of-day greeting
 * plus three pulse-stats that swap based on whatever signals are loud right
 * now (week's playtime → wishlist size → friends online → discovery hint).
 */
export function GreetingStrip() {
  const profile = useAuthStore((s) => s.profile);
  const entries = useLibraryStore((s) => s.entries);
  const wishlistCount = useWishlistStore((s) => s.entries.length);
  const { data: friends } = useFriends();

  const displayName = profile?.displayName ?? "friend";

  const greeting = useMemo(() => greetingFor(new Date(), displayName), [displayName]);

  const friendsOnline = useMemo(() => {
    if (!friends) return 0;
    return friends.filter((f) => f.status === "online" || f.status === "in-game").length;
  }, [friends]);

  const stats = useMemo<Stat[]>(() => {
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    const cutoff = Date.now() - weekMs;
    const weekMinutes = entries.reduce((acc, e) => {
      if (!e.lastPlayed) return acc;
      if (new Date(e.lastPlayed).getTime() < cutoff) return acc;
      return acc + e.playMinutes;
    }, 0);

    const out: Stat[] = [];

    if (weekMinutes > 0) {
      out.push({
        label: "Played this week",
        value: formatHours(weekMinutes),
        tone: "acid",
      });
    }
    out.push({
      label: weekMinutes > 0 ? "In library" : "Games owned",
      value: `${entries.length}`,
      tone: "positive",
    });
    if (wishlistCount > 0) {
      out.push({
        label: "On wishlist",
        value: `${wishlistCount}`,
        tone: "cyan",
      });
    }
    if (friendsOnline > 0) {
      out.push({
        label: "Friends online",
        value: `${friendsOnline}`,
        tone: "orange",
      });
    }

    // If we ended up with nothing meaningful, surface the discover hint.
    if (out.length < 2) {
      out.push({ label: "Today's mood", value: "Discover", tone: "acid" });
    }

    return out.slice(0, 4);
  }, [entries, wishlistCount, friendsOnline]);

  const toneClass: Record<Stat["tone"], string> = {
    acid: "text-acid",
    positive: "text-positive",
    cyan: "text-cyan",
    orange: "text-orange",
  };

  const dotBg: Record<Stat["tone"], string> = {
    acid: "bg-acid",
    positive: "bg-positive",
    cyan: "bg-cyan",
    orange: "bg-orange",
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative mb-6 overflow-hidden rounded-2xl border border-separator bg-card/70 p-4 backdrop-blur-sm md:p-5"
    >
      <div
        className="pointer-events-none absolute inset-0 -z-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 0% 0%, color-mix(in srgb, var(--color-acid) 12%, transparent), transparent 50%), radial-gradient(circle at 100% 100%, color-mix(in srgb, var(--color-positive) 10%, transparent), transparent 55%)",
        }}
      />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          {profile?.avatarOptions ? (
            <UserAvatar options={profile.avatarOptions} size={44} />
          ) : (
            <div className="h-11 w-11 shrink-0 rounded-2xl bg-card-active" />
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-acid">
              <Sparkles className="h-3 w-3" />
              <span className="text-[10px] font-bold uppercase tracking-widest">
                Dreamworks
              </span>
            </div>
            <h1 className="text-[20px] font-bold leading-tight tracking-tight text-foreground sm:text-[22px]">
              {greeting}
            </h1>
            {friendsOnline > 0 ? (
              <p className="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-muted/70">
                <motion.span
                  aria-hidden
                  animate={{ opacity: [1, 0.35, 1] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                  className="block h-1.5 w-1.5 rounded-full bg-green"
                />
                {friendsOnline} {friendsOnline === 1 ? "friend" : "friends"} online now
              </p>
            ) : (
              <p className="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-muted/70">
                <Flame className="h-3 w-3 text-orange" />
                Fresh picks waiting for you
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center sm:gap-5">
          {stats.map((s) => (
            <div key={s.label} className="flex items-center gap-2">
              <span className={`block h-1.5 w-1.5 shrink-0 rounded-full ${dotBg[s.tone]}`} />
              <div className="min-w-0">
                <p
                  className={`font-mono text-[16px] font-bold leading-none tabular-nums ${toneClass[s.tone]}`}
                >
                  {s.value}
                </p>
                <p className="mt-0.5 truncate text-[10px] uppercase tracking-widest text-muted/60">
                  {s.label}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
