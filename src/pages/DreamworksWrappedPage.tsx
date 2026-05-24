import { motion } from "motion/react";
import {
  Calendar,
  Clock,
  Gift,
  Heart,
  Music,
  Sparkles,
  Trophy,
  Users as UsersIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { useAuthStore } from "@/stores/auth-store";
import { useDreamworksWrapped } from "@/hooks/use-console";
import { formatPrice } from "@/lib/utils";

export function DreamworksWrappedPage() {
  const uid = useAuthStore((s) =>
    s.authState.type === "Authenticated" ? s.authState.user.uid : undefined,
  );
  const { data, isLoading } = useDreamworksWrapped(uid);

  if (isLoading) return <LoadingSpinner label="Wrapping your year…" />;
  if (!data)
    return (
      <Card className="p-6 text-center text-muted">
        Sign in to see your Dreamworks Wrapped.
      </Card>
    );

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="rounded-2xl bg-gradient-to-br from-acid/20 via-cyan/15 to-brand-plus/15 p-8"
      >
        <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-foreground/55">
          <Sparkles className="h-3 w-3" />
          Dreamworks Wrapped {new Date(data.yearStart).getFullYear()}
        </p>
        <h1 className="mt-2 text-[36px] font-semibold tracking-tight text-foreground">
          {data.displayName}, here's your year.
        </h1>
        <p className="mt-2 text-[14px] text-foreground/75">{data.oneLineSummary}</p>
      </motion.div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <WrapStat icon={Clock} label="Hours played" value={data.totalHours.toLocaleString()} accent="--acid" />
        <WrapStat icon={Trophy} label="Achievements" value={data.achievementsUnlocked.toLocaleString()} accent="--green" />
        <WrapStat icon={Calendar} label="Longest streak" value={`${data.longestStreakDays} days`} accent="--cyan" />
        <WrapStat icon={Music} label="Top play hour" value={`${data.topPlayHour}:00`} accent="--brand-plus" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <p className="text-[10px] uppercase tracking-widest text-muted/55">Your top 5</p>
          <ol className="mt-4 space-y-3">
            {data.topGames.map((g, i) => (
              <li key={g.gameId} className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-acid/15 text-[14px] font-bold text-acid">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-medium text-foreground">{g.title}</p>
                  <p className="text-[11.5px] text-muted/55">{Math.round(g.minutes / 60)} hours</p>
                </div>
              </li>
            ))}
            {data.topGames.length === 0 && (
              <p className="text-[12px] text-muted/55">No play data yet — go play something.</p>
            )}
          </ol>
        </Card>

        <Card className="p-6">
          <p className="text-[10px] uppercase tracking-widest text-muted/55">By the numbers</p>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <NumberBlock icon={UsersIcon} label="Sessions" value={data.sessionsCount.toLocaleString()} />
            <NumberBlock icon={Trophy} label="Perfect games" value={data.perfectGames.toString()} />
            <NumberBlock icon={Heart} label="Reviews" value={data.reviewsPosted.toString()} />
            <NumberBlock icon={Gift} label="Gifts given" value={data.giftsGiven.toString()} />
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <p className="text-[10px] uppercase tracking-widest text-muted/55">Your gaming personality</p>
        <p className="mt-2 text-[28px] font-semibold text-foreground">{data.personality}</p>
        <p className="mt-1 text-[12.5px] text-muted/60">
          Based on how you played this year — taste, completion, social activity, and spend.
        </p>
      </Card>

      <Card className="flex items-start gap-3 p-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-acid/10 text-acid">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <p className="text-[13px] font-semibold text-foreground/90">Spend so far</p>
          <p className="mt-0.5 text-[12.5px] text-muted/65">
            {formatPrice(data.totalSpendCents)} across {data.sessionsCount.toLocaleString()} sessions
            — you supported {data.topGames.length} different studios this year.
          </p>
        </div>
      </Card>
    </div>
  );
}

function WrapStat({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <Card className="p-5">
      <Icon className="h-5 w-5" style={{ color: `var(${accent})` }} />
      <p className="mt-3 text-[28px] font-semibold tabular-nums text-foreground">{value}</p>
      <p className="mt-0.5 text-[11px] uppercase tracking-widest text-muted/55">{label}</p>
    </Card>
  );
}

function NumberBlock({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-card-active text-foreground/70">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div>
        <p className="text-[18px] font-semibold tabular-nums text-foreground">{value}</p>
        <p className="text-[10.5px] uppercase tracking-widest text-muted/55">{label}</p>
      </div>
    </div>
  );
}
