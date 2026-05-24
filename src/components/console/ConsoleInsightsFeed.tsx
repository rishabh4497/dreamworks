import { Sparkles, AlertTriangle, ArrowUp, ArrowDown } from "lucide-react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { useInsights } from "@/hooks/use-console";
import { cn } from "@/lib/utils";
import { relativeTime } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";

const KIND_STYLE = {
  anomaly: { icon: AlertTriangle, color: "text-orange bg-orange/10" },
  opportunity: { icon: Sparkles, color: "text-acid bg-acid/10" },
  regression: { icon: ArrowDown, color: "text-red bg-red/10" },
  celebration: { icon: ArrowUp, color: "text-green bg-green/10" },
} as const;

export function ConsoleInsightsFeed() {
  const insights = useInsights();
  const { t } = useTranslation();
  if (insights.length === 0) {
    return (
      <Card className="p-4 text-[12px] text-muted/55">
        Insights will appear here as anomalies are detected.
      </Card>
    );
  }
  return (
    <div className="space-y-2">
      {insights.map((i) => {
        const meta = KIND_STYLE[i.kind] ?? KIND_STYLE.anomaly;
        const Icon = meta.icon;
        const body = (
          <Card className="flex items-start gap-3 p-3">
            <div
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
                meta.color,
              )}
            >
              <Icon className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[12.5px] text-foreground/90">{i.text}</p>
              <p className="mt-0.5 text-[11px] text-muted/55">{relativeTime(i.ts, t)}</p>
            </div>
          </Card>
        );
        return i.href ? (
          <Link key={i.id} to={i.href}>
            {body}
          </Link>
        ) : (
          <div key={i.id}>{body}</div>
        );
      })}
    </div>
  );
}
