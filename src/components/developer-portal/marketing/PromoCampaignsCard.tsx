import { useState } from "react";
import { Plus, Tag, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/stores/toast-store";
import {
  useDeletePromoCampaign,
  usePromoCampaignsByApp,
  useSavePromoCampaign,
} from "@/hooks/use-promo-campaigns";
import type { PromoCampaign } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const STATUS_STYLES: Record<PromoCampaign["status"], string> = {
  scheduled: "bg-cyan/10 text-cyan",
  active: "bg-green/10 text-green",
  ended: "bg-muted/10 text-muted",
};

function toLocalInput(iso: string | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function PromoCampaignsCard({ appId }: { appId: string }) {
  const list = usePromoCampaignsByApp(appId);
  const save = useSavePromoCampaign();
  const del = useDeletePromoCampaign(appId);

  const [name, setName] = useState("");
  const [discountPct, setDiscountPct] = useState(20);
  const today = new Date();
  const inTwoWeeks = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
  const [startsAt, setStartsAt] = useState(toLocalInput(today.toISOString()));
  const [endsAt, setEndsAt] = useState(toLocalInput(inTwoWeeks.toISOString()));

  const handleCreate = async () => {
    try {
      await save.mutateAsync({
        appId,
        name,
        discountPct,
        startsAt: new Date(startsAt).toISOString(),
        endsAt: new Date(endsAt).toISOString(),
      });
      setName("");
      toast.success("Campaign saved.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Save failed.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await del.mutateAsync(id);
      toast.success("Campaign deleted.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Delete failed.");
    }
  };

  return (
    <Card className="p-5">
      <header className="mb-4">
        <h3 className="flex items-center gap-2 text-[14px] font-semibold text-foreground">
          <Tag className="h-4 w-4 text-acid" /> Promo campaigns
        </h3>
        <p className="text-[12px] text-muted/60">
          Time-boxed discounts. Status is derived from the dates each render — no manual flip needed.
        </p>
      </header>

      <div className="space-y-2">
        {list.isLoading && <p className="text-[12px] text-muted/55">Loading…</p>}
        {!list.isLoading && (list.data ?? []).length === 0 && (
          <p className="rounded-xl border border-dashed border-separator p-4 text-center text-[12px] text-muted/55">
            No campaigns yet. Use the form below to create one.
          </p>
        )}
        {(list.data ?? []).map((c) => (
          <div
            key={c.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-separator bg-input/40 p-3"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-[13px] font-semibold text-foreground">{c.name}</p>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest ${STATUS_STYLES[c.status]}`}
                >
                  {c.status}
                </span>
              </div>
              <p className="text-[11px] text-muted/65">
                {c.discountPct}% off · {formatDate(c.startsAt)} → {formatDate(c.endsAt)}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDelete(c.id)}
              aria-label="Delete campaign"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-xl border border-separator bg-input/30 p-3">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted/55">
          New campaign
        </p>
        <div className="grid gap-2 md:grid-cols-4">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Halloween Sale"
            className="md:col-span-2"
          />
          <Input
            type="number"
            min={0}
            max={90}
            value={discountPct}
            onChange={(e) => setDiscountPct(Number(e.target.value))}
            placeholder="Discount %"
          />
          <div />
          <label className="text-[11px] text-muted/65">
            Starts
            <input
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              className="mt-1 w-full rounded-xl border border-separator bg-input px-3 py-1.5 text-[12px] text-foreground"
            />
          </label>
          <label className="text-[11px] text-muted/65">
            Ends
            <input
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              className="mt-1 w-full rounded-xl border border-separator bg-input px-3 py-1.5 text-[12px] text-foreground"
            />
          </label>
          <div className="md:col-span-2 flex items-end justify-end">
            <Button onClick={handleCreate} disabled={save.isPending}>
              <Plus className="h-4 w-4" /> {save.isPending ? "Saving…" : "Create campaign"}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
