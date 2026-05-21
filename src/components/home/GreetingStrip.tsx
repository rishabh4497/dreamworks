import { useMemo } from "react";
import { motion } from "motion/react";
import { UserAvatar } from "@/components/avatar/UserAvatar";
import { useAuthStore } from "@/stores/auth-store";
import { useLibraryStore } from "@/stores/library-store";
import { useWishlistStore } from "@/stores/wishlist-store";
import { formatHours } from "@/lib/utils";

function greetingFor(now: Date, name: string): string {
  const hour = now.getHours();
  if (hour < 12) return `Good morning, ${name}`;
  if (hour < 17) return `Good afternoon, ${name}`;
  if (hour < 22) return `Good evening, ${name}`;
  return `Welcome back, ${name}`;
}

/**
 * Glass strip at the top of the store home. Shows the user's avatar, a
 * time-of-day greeting, and one chatty stat picked from the most interesting
 * signal available (recent playtime → wishlist size → discover hint).
 */
export function GreetingStrip() {
  const profile = useAuthStore((s) => s.profile);
  const entries = useLibraryStore((s) => s.entries);
  const wishlistCount = useWishlistStore((s) => s.entries.length);

  const displayName = profile?.displayName ?? "friend";

  const greeting = useMemo(() => greetingFor(new Date(), displayName), [displayName]);

  const stat = useMemo(() => {
    // 1. Playtime in last 7 days. lastPlayed is the only date we have — treat
    //    playMinutes as "this-week" when the entry was touched in the window.
    const weekMs = 7 * 24 * 60 * 60 * 1000;
    const cutoff = Date.now() - weekMs;
    const weekMinutes = entries.reduce((acc, e) => {
      if (!e.lastPlayed) return acc;
      if (new Date(e.lastPlayed).getTime() < cutoff) return acc;
      return acc + e.playMinutes;
    }, 0);
    if (weekMinutes > 0) {
      const library = entries.length;
      return `You've played ${formatHours(weekMinutes)} this week · ${library} game${library === 1 ? "" : "s"} in your library`;
    }
    if (wishlistCount > 0) {
      return `You're watching ${wishlistCount} game${wishlistCount === 1 ? "" : "s"} on your wishlist`;
    }
    return "Discover something new today";
  }, [entries, wishlistCount]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mb-6 flex items-center gap-4 rounded-xl border border-separator border-l-2 border-l-acid bg-card p-4"
    >
      {profile?.avatarOptions ? (
        <UserAvatar options={profile.avatarOptions} size={32} />
      ) : (
        <div className="h-8 w-8 shrink-0 rounded-2xl bg-card-active" />
      )}
      <div className="min-w-0">
        <h1 className="text-[16px] font-semibold leading-tight text-foreground">
          {greeting}
        </h1>
        <p className="mt-0.5 truncate text-[12px] text-muted/70">{stat}</p>
      </div>
    </motion.section>
  );
}
