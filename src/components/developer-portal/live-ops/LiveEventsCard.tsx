import { useState } from "react";
import { Calendar, Plus, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageDropzone } from "@/components/common/ImageDropzone";
import { toast } from "@/stores/toast-store";
import {
  useDeleteLiveEvent,
  useLiveEventsByApp,
  useSaveLiveEvent,
} from "@/hooks/use-live-events";
import { isActive, isUpcoming } from "@/lib/api/live-events";
import type { LiveEvent, LiveEventKind } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const KINDS: LiveEventKind[] = [
  "free-weekend",
  "double-xp",
  "sale",
  "tournament",
  "season",
  "drop",
];

function toLocalInput(iso: string | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

interface EditState {
  id?: string;
  kind: LiveEventKind;
  title: string;
  description: string;
  startsAt: string;
  endsAt: string;
  bannerUrl: string;
}

const today = new Date();
const inAWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
const EMPTY: EditState = {
  kind: "free-weekend",
  title: "",
  description: "",
  startsAt: toLocalInput(today.toISOString()),
  endsAt: toLocalInput(inAWeek.toISOString()),
  bannerUrl: "",
};

function statusFor(e: LiveEvent): { label: string; className: string } {
  if (isActive(e)) return { label: "Live now", className: "bg-green/10 text-green" };
  if (isUpcoming(e)) return { label: "Upcoming", className: "bg-cyan/10 text-cyan" };
  return { label: "Past", className: "bg-muted/10 text-muted" };
}

export function LiveEventsCard({ appId }: { appId: string }) {
  const list = useLiveEventsByApp(appId);
  const save = useSaveLiveEvent();
  const del = useDeleteLiveEvent(appId);

  const [edit, setEdit] = useState<EditState>(EMPTY);

  const handleSave = async () => {
    try {
      await save.mutateAsync({
        id: edit.id,
        appId,
        kind: edit.kind,
        title: edit.title,
        description: edit.description,
        startsAt: new Date(edit.startsAt).toISOString(),
        endsAt: new Date(edit.endsAt).toISOString(),
        bannerUrl: edit.bannerUrl || undefined,
      });
      toast.success(edit.id ? "Event updated." : "Event scheduled.");
      setEdit(EMPTY);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Save failed.");
    }
  };

  const handleEdit = (e: LiveEvent) => {
    setEdit({
      id: e.id,
      kind: e.kind,
      title: e.title,
      description: e.description,
      startsAt: toLocalInput(e.startsAt),
      endsAt: toLocalInput(e.endsAt),
      bannerUrl: e.bannerUrl ?? "",
    });
  };

  return (
    <Card className="p-5">
      <header className="mb-4">
        <h3 className="flex items-center gap-2 text-[14px] font-semibold text-foreground">
          <Calendar className="h-4 w-4 text-cyan" /> Live events
        </h3>
        <p className="text-[12px] text-muted/60">
          Schedule free weekends, double-XP windows, sales, tournaments, seasonal drops. They
          appear on the game page automatically while live.
        </p>
      </header>

      <div className="mb-4 rounded-xl border border-separator bg-input/30 p-3">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted/55">
          {edit.id ? "Edit event" : "Schedule event"}
        </p>
        <div className="grid gap-2 md:grid-cols-3">
          <select
            value={edit.kind}
            onChange={(e) => setEdit({ ...edit, kind: e.target.value as LiveEventKind })}
            className="h-9 rounded-xl border border-separator bg-input px-3 text-[13px] text-foreground"
          >
            {KINDS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
          <Input
            value={edit.title}
            onChange={(e) => setEdit({ ...edit, title: e.target.value })}
            placeholder="Event title"
            className="md:col-span-2"
          />
          <textarea
            value={edit.description}
            onChange={(e) => setEdit({ ...edit, description: e.target.value })}
            placeholder="What's going on, who it's for, how to participate."
            className="md:col-span-3 min-h-20 w-full rounded-xl border border-separator bg-input px-3.5 py-2 text-[13px] text-foreground placeholder:text-muted/40 focus:border-acid/30 focus:outline-none focus:ring-1 focus:ring-acid/15"
          />
          <label className="text-[11px] text-muted/65">
            Starts
            <input
              type="datetime-local"
              value={edit.startsAt}
              onChange={(e) => setEdit({ ...edit, startsAt: e.target.value })}
              className="mt-1 w-full rounded-xl border border-separator bg-input px-3 py-1.5 text-[12px] text-foreground"
            />
          </label>
          <label className="text-[11px] text-muted/65">
            Ends
            <input
              type="datetime-local"
              value={edit.endsAt}
              onChange={(e) => setEdit({ ...edit, endsAt: e.target.value })}
              className="mt-1 w-full rounded-xl border border-separator bg-input px-3 py-1.5 text-[12px] text-foreground"
            />
          </label>
          <div className="md:col-span-3">
            <ImageDropzone
              label="Event banner (optional)"
              value={edit.bannerUrl}
              onChange={(v) => setEdit({ ...edit, bannerUrl: v })}
              storagePath={
                edit.id
                  ? `dw_live_events/${edit.id}/banner`
                  : `dw_live_events/draft-${appId}/banner`
              }
            />
          </div>
          <div className="md:col-span-3 flex items-center justify-end gap-2">
            {edit.id && (
              <Button variant="secondary" onClick={() => setEdit(EMPTY)}>
                Cancel
              </Button>
            )}
            <Button onClick={handleSave} disabled={save.isPending}>
              <Plus className="h-4 w-4" /> {save.isPending ? "Saving…" : edit.id ? "Update" : "Schedule"}
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {list.isLoading && <p className="text-[12px] text-muted/55">Loading…</p>}
        {!list.isLoading && (list.data ?? []).length === 0 && (
          <p className="rounded-xl border border-dashed border-separator p-4 text-center text-[12px] text-muted/55">
            No events scheduled yet.
          </p>
        )}
        {(list.data ?? []).map((e) => {
          const s = statusFor(e);
          return (
            <div
              key={e.id}
              className="flex items-start justify-between gap-3 rounded-xl border border-separator bg-input/40 p-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest ${s.className}`}
                  >
                    {s.label}
                  </span>
                  <span className="text-[10px] uppercase tracking-widest text-muted/55">
                    {e.kind}
                  </span>
                  <p className="truncate text-[13px] font-semibold text-foreground">{e.title}</p>
                </div>
                <p className="mt-0.5 line-clamp-2 text-[12px] text-muted/70">{e.description}</p>
                <p className="mt-1 text-[10px] uppercase tracking-widest text-muted/55">
                  {formatDate(e.startsAt)} → {formatDate(e.endsAt)}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => handleEdit(e)}>
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => del.mutate(e.id)}
                  aria-label="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
