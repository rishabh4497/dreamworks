import { useMemo } from "react";
import { motion } from "motion/react";
import { Sparkles } from "lucide-react";
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
  tone: "acid" | "positive" | "cyan" | "orange" | "green";
}

/**
 * Slim, vibrant welcome chip. Avatar + time-of-day greeting + three pulse
 * stats on a single line — sits flush above the cinematic hero so the page
 * opens warm without eating vertical space.
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
      out.push({ label: "This week", value: formatHours(weekMinutes), tone: "cyan" });
    }
    out.push({ label: "Library", value: `${entries.length}`, tone: "positive" });
    if (wishlistCount > 0) {
      out.push({ label: "Wishlist", value: `${wishlistCount}`, tone: "orange" });
    }
    if (friendsOnline > 0) {
      out.push({ label: "Online", value: `${friendsOnline}`, tone: "green" });
    }
    return out.slice(0, 4);
  }, [entries, wishlistCount, friendsOnline]);

  const toneClass: Record<Stat["tone"], string> = {
    acid: "text-acid",
    positive: "text-positive",
    cyan: "text-cyan",
    orange: "text-orange",
    green: "text-green",
  };
  const dotBg: Record<Stat["tone"], string> = {
    acid: "bg-acid",
    positive: "bg-positive",
    cyan: "bg-cyan",
    orange: "bg-orange",
    green: "bg-green",
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="relative mb-3 flex flex-wrap items-center justify-between gap-3"
    >
      <div className="flex items-center gap-2.5">
        {profile?.avatarOptions ? (
          <UserAvatar options={profile.avatarOptions} size={32} />
        ) : (
          <div className="h-8 w-8 rounded-xl bg-card-active" />
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-1 text-acid">
            <Sparkles className="h-2.5 w-2.5" />
            <span className="text-[9px] font-bold uppercase tracking-[0.2em]">Dreamworks</span>
          </div>
          <h1 className="truncate text-[15px] font-bold leading-tight tracking-tight text-foreground">
            {greeting}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-4 text-[12px]">
        {stats.map((s) => (
          <div key={s.label} className="flex items-center gap-1.5">
            <span className={`block h-1.5 w-1.5 rounded-full ${dotBg[s.tone]}`} />
            <span className={`font-mono text-[13px] font-bold tabular-nums leading-none ${toneClass[s.tone]}`}>
              {s.value}
            </span>
            <span className="text-[10px] uppercase tracking-widest text-muted/60">{s.label}</span>
          </div>
        ))}
      </div>
    </motion.section>
  );
}
