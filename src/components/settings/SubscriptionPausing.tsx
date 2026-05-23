import { PauseCircle, PlayCircle, Calendar } from "lucide-react";
import { useSubscriptionStore } from "@/stores/subscription-store";
import { useTranslation } from "@/lib/i18n";
import { toast } from "@/stores/toast-store";
import { formatDate } from "@/lib/utils";

const PAUSE_DAYS = 60;

export function SubscriptionPausing() {
  const subscription = useSubscriptionStore((s) => s.subscription);
  const pause = useSubscriptionStore((s) => s.pause);
  const resume = useSubscriptionStore((s) => s.resume);
  const { t } = useTranslation();

  const paused = subscription.paused;
  const pausedUntil = subscription.pausedUntil;
  const nextBillingAt = subscription.nextBillingAt;

  const togglePause = async () => {
    if (paused) {
      await resume();
      toast.success(t("Subscription resumed"));
    } else {
      const until = new Date(Date.now() + PAUSE_DAYS * 24 * 60 * 60 * 1000).toISOString();
      await pause(until);
      toast.info(t("Subscription paused"));
    }
  };

  return (
    <div className="rounded-xl border border-separator bg-card p-6 mt-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-[16px] font-bold flex items-center gap-2 mb-1">
            <PauseCircle className="h-5 w-5 text-[#a052ff]" /> {t("Pause Dreamworks+ Subscription")}
          </h3>
          <p className="text-[13px] text-muted/80">
            {t("Going on vacation? Pause your billing for up to 2 months without losing your perks.")}
          </p>
        </div>
      </div>

      <div className="bg-card-active rounded-xl border border-separator/50 p-4 relative overflow-hidden flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-[#a052ff]/10 flex items-center justify-center border border-[#a052ff]/30">
            <PlayCircle className="h-6 w-6 text-[#a052ff]" />
          </div>
          <div>
            <p className="text-[14px] font-bold text-foreground">
              {paused ? t("Status: Paused") : t("Status: Active")}
            </p>
            <p className="text-[11px] text-muted flex items-center gap-1 mt-0.5">
              <Calendar className="h-3 w-3" />
              {paused && pausedUntil
                ? t("Paused until {date}", { date: formatDate(pausedUntil) })
                : nextBillingAt
                  ? t("Next billing date: {date}", { date: formatDate(nextBillingAt) })
                  : t("No active subscription")}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={togglePause}
          className="bg-input border border-separator text-foreground px-4 py-2 rounded-lg text-[12px] font-bold hover:bg-card-hover transition-colors"
        >
          {paused ? t("Resume Billing") : t("Pause Billing")}
        </button>
      </div>
    </div>
  );
}
