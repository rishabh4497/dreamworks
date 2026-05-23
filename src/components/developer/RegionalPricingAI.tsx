import { ArrowRight, Globe2, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAIAction } from "@/hooks/use-ai";
import type { RegionalPricingPayload } from "@/lib/ai/payload-types";

interface Props {
  gameName?: string;
  basePriceCents?: number;
  baseCurrency?: string;
  currentRegional?: { countryCode: string; currency: string; cents: number }[];
}

const DEMO_REGIONS = [
  { countryCode: "AR", currency: "ARS", cents: 14_99 * 100 },
  { countryCode: "TR", currency: "TRY", cents: 12_99 * 100 },
  { countryCode: "JP", currency: "JPY", cents: 240_000 },
];

function formatCents(cents: number, currency: string): string {
  const isYen = currency === "JPY";
  const amount = isYen ? cents : cents / 100;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: isYen ? 0 : 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(isYen ? 0 : 2)} ${currency}`;
  }
}

export function RegionalPricingAI({
  gameName = "Sample Title",
  basePriceCents = 5999,
  baseCurrency = "USD",
  currentRegional = DEMO_REGIONS,
}: Props) {
  const mutation = useAIAction<"regional-pricing", RegionalPricingPayload>("regional-pricing");
  const result = mutation.data;

  const rows =
    result?.regions ??
    [
      {
        countryCode: "AR",
        countryName: "Argentina",
        currency: "ARS",
        currentCents: 14_99 * 100,
        suggestedCents: 8_99 * 100,
        reason: "Hyperinflation adjustment",
        direction: "decrease" as const,
      },
      {
        countryCode: "TR",
        countryName: "Turkey",
        currency: "TRY",
        currentCents: 12_99 * 100,
        suggestedCents: 9_50 * 100,
        reason: "Purchasing-power parity shift",
        direction: "decrease" as const,
      },
      {
        countryCode: "JP",
        countryName: "Japan",
        currency: "JPY",
        currentCents: 240_000,
        suggestedCents: 280_000,
        reason: "Yen stabilization",
        direction: "increase" as const,
      },
    ];

  const onRun = () =>
    mutation.mutate({
      gameName,
      basePriceCents,
      baseCurrency,
      currentRegional,
    });

  return (
    <Card className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-[18px] font-semibold text-foreground flex items-center gap-2">
            <Globe2 className="h-5 w-5 text-blue" /> Dynamic Regional Pricing
          </h2>
          <p className="text-[13px] text-muted/70 mt-1">
            AI-suggested adjustments based on real-time currency parity.
          </p>
        </div>
        <button
          onClick={onRun}
          disabled={mutation.isPending}
          className="flex items-center gap-2 rounded-lg border border-separator bg-card-active px-3 py-1.5 text-[12px] font-medium hover:bg-card-hover disabled:opacity-50"
        >
          {mutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {mutation.isPending ? "Calculating…" : result ? "Refresh" : "Run AI"}
        </button>
      </div>

      <div className="space-y-3">
        {rows.map((r, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-3 rounded-lg border border-separator bg-card-active"
          >
            <div className="w-1/3">
              <p className="text-[13px] font-semibold text-foreground">
                {r.countryName} ({r.currency})
              </p>
              <p className="text-[11px] text-muted/60">{r.reason}</p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[13px] font-medium text-muted/80 line-through">
                {formatCents(r.currentCents, r.currency)}
              </span>
              <ArrowRight className="h-4 w-4 text-muted/40" />
              <span
                className={`text-[14px] font-bold ${
                  r.direction === "decrease"
                    ? "text-green"
                    : r.direction === "hold"
                      ? "text-muted"
                      : "text-acid"
                }`}
              >
                {formatCents(r.suggestedCents, r.currency)}
              </span>
            </div>

            <Button size="sm" variant={r.direction === "decrease" ? "secondary" : "primary"}>
              Apply
            </Button>
          </div>
        ))}
      </div>
      {mutation.error && (
        <p className="mt-2 text-[11px] text-red">{mutation.error.message}</p>
      )}
    </Card>
  );
}
