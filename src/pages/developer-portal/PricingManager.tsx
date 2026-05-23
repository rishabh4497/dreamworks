import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Plus, Save, Tag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "@/stores/toast-store";
import { useApp, useSaveApp } from "@/hooks/use-apps";
import { REGION_PRESETS, suggestRegionalPrice } from "@/lib/data/regions";
import type { Currency, RegionalPrice } from "@/lib/types";

export function PricingManager() {
  const { appId = "" } = useParams();
  const { data: app, isLoading } = useApp(appId);
  const saveApp = useSaveApp(appId);

  const [basePriceCents, setBasePriceCents] = useState(0);
  const [launchDiscountPct, setLaunchDiscountPct] = useState(0);
  const [rows, setRows] = useState<RegionalPrice[]>([]);

  useEffect(() => {
    if (!app) return;
    setBasePriceCents(app.basePriceCents);
    setLaunchDiscountPct(app.launchDiscountPct);
    setRows(app.pricesByRegion ?? []);
  }, [app]);

  if (isLoading || !app) {
    return <Card className="p-6 text-[13px] text-muted/65">Loading pricing…</Card>;
  }

  const finalCents = Math.round(basePriceCents * (1 - launchDiscountPct / 100));

  const updateRow = (i: number, patch: Partial<RegionalPrice>) =>
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const usedRegions = new Set(rows.map((r) => r.region));
  const availablePresets = REGION_PRESETS.filter((p) => !usedRegions.has(p.region));

  const addPreset = (region: string) => {
    const preset = REGION_PRESETS.find((p) => p.region === region);
    if (!preset) return;
    const price = suggestRegionalPrice(basePriceCents, preset);
    setRows((rs) => [
      ...rs,
      {
        region: preset.region,
        currency: preset.currency,
        price,
        usdEquivalentCents: basePriceCents,
      },
    ]);
  };

  const handleSave = async () => {
    try {
      await saveApp.mutateAsync({
        basePriceCents,
        launchDiscountPct,
        pricesByRegion: rows,
      });
      toast.success("Pricing saved.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Save failed.";
      toast.error(msg);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[16px] font-semibold text-foreground">Pricing</h3>
        <Button onClick={handleSave} disabled={saveApp.isPending}>
          <Save className="h-4 w-4" />
          {saveApp.isPending ? "Saving…" : "Save"}
        </Button>
      </div>

      <Card className="space-y-4 p-4">
        <SectionTitle icon={Tag} title="Base & launch" />
        <div className="grid gap-3 md:grid-cols-3">
          <Field label="Base price (USD cents)">
            <Input
              type="number"
              min={0}
              step={100}
              value={basePriceCents}
              onChange={(e) => setBasePriceCents(Number(e.target.value))}
            />
          </Field>
          <Field label="Launch discount %">
            <Input
              type="number"
              min={0}
              max={90}
              value={launchDiscountPct}
              onChange={(e) => setLaunchDiscountPct(Number(e.target.value))}
            />
          </Field>
          <Field label="Effective price after discount">
            <Input value={`$${(finalCents / 100).toFixed(2)}`} readOnly />
          </Field>
        </div>
      </Card>

      <Card className="space-y-3 p-4">
        <SectionTitle icon={Tag} title="Regional pricing" />
        <div className="overflow-hidden rounded-xl border border-separator">
          <table className="w-full text-left text-[12px]">
            <thead className="bg-card-active/30 text-[10px] uppercase tracking-widest text-muted/60">
              <tr>
                <th className="px-4 py-2">Region</th>
                <th className="px-4 py-2">Currency</th>
                <th className="px-4 py-2">Local price (minor units)</th>
                <th className="px-4 py-2">USD equivalent (cents)</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-muted/60">
                    No regional overrides — players see the base price converted at fair-value rates.
                  </td>
                </tr>
              )}
              {rows.map((row, i) => (
                <tr key={`${row.region}-${i}`} className="border-t border-separator/60">
                  <td className="px-4 py-2.5 text-foreground/85">{row.region}</td>
                  <td className="px-4 py-2.5">
                    <select
                      value={row.currency}
                      onChange={(e) => updateRow(i, { currency: e.target.value as Currency })}
                      className="h-8 rounded-lg border border-separator bg-input px-2 text-[12px] text-foreground focus:outline-none"
                    >
                      {(
                        ["USD", "EUR", "GBP", "JPY", "BRL", "INR", "CAD", "AUD"] as Currency[]
                      ).map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2.5">
                    <Input
                      type="number"
                      value={row.price}
                      onChange={(e) => updateRow(i, { price: Number(e.target.value) })}
                      className="h-8 w-32"
                    />
                  </td>
                  <td className="px-4 py-2.5">
                    <Input
                      type="number"
                      value={row.usdEquivalentCents}
                      onChange={(e) =>
                        updateRow(i, { usdEquivalentCents: Number(e.target.value) })
                      }
                      className="h-8 w-32"
                    />
                  </td>
                  <td className="px-4 py-2.5">
                    <button
                      className="text-muted/50 hover:text-red"
                      onClick={() => setRows((rs) => rs.filter((_, idx) => idx !== i))}
                      aria-label="Remove region"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {availablePresets.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] uppercase tracking-widest text-muted/55">Add region:</span>
            {availablePresets.map((p) => (
              <button
                key={p.region}
                type="button"
                onClick={() => addPreset(p.region)}
                className="inline-flex items-center gap-1 rounded-full border border-separator bg-card-active px-2.5 py-1 text-[11.5px] font-medium text-foreground/80 hover:border-acid/40 hover:text-acid"
              >
                <Plus className="h-3 w-3" /> {p.region} ({p.currency})
              </button>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-muted/50">
        {label}
      </span>
      {children}
    </label>
  );
}

function SectionTitle({
  icon: Icon,
  title,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
}) {
  return (
    <h3 className="flex items-center gap-2 text-[14px] font-semibold text-foreground">
      <Icon className="h-4 w-4 text-muted/60" />
      {title}
    </h3>
  );
}
