import { useState } from "react";
import { Megaphone, Pin, Plus, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageDropzone } from "@/components/common/ImageDropzone";
import { toast } from "@/stores/toast-store";
import {
  useAnnouncementsByApp,
  useDeleteAnnouncement,
  useSaveAnnouncement,
} from "@/hooks/use-announcements";
import type { Announcement, AnnouncementCategory } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const CATEGORIES: AnnouncementCategory[] = ["patch", "event", "news", "maintenance"];

const CAT_STYLES: Record<AnnouncementCategory, string> = {
  patch: "bg-cyan/10 text-cyan",
  event: "bg-acid/10 text-acid",
  news: "bg-green/10 text-green",
  maintenance: "bg-orange/10 text-orange",
};

function toLocalInput(iso: string | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

interface EditState {
  id?: string;
  category: AnnouncementCategory;
  title: string;
  body: string;
  heroImageUrl: string;
  pinnedUntil: string;
}

const EMPTY: EditState = {
  category: "news",
  title: "",
  body: "",
  heroImageUrl: "",
  pinnedUntil: "",
};

export function AnnouncementsCard({ appId }: { appId: string }) {
  const list = useAnnouncementsByApp(appId);
  const save = useSaveAnnouncement();
  const del = useDeleteAnnouncement(appId);

  const [filter, setFilter] = useState<"all" | AnnouncementCategory>("all");
  const [edit, setEdit] = useState<EditState>(EMPTY);

  const filtered = (list.data ?? []).filter((a) => filter === "all" || a.category === filter);

  const handleSave = async () => {
    try {
      await save.mutateAsync({
        id: edit.id,
        appId,
        category: edit.category,
        title: edit.title,
        body: edit.body,
        heroImageUrl: edit.heroImageUrl || undefined,
        pinnedUntil: edit.pinnedUntil ? new Date(edit.pinnedUntil).toISOString() : undefined,
      });
      toast.success(edit.id ? "Announcement updated." : "Announcement published.");
      setEdit(EMPTY);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Save failed.");
    }
  };

  const handleEdit = (a: Announcement) => {
    setEdit({
      id: a.id,
      category: a.category,
      title: a.title,
      body: a.body,
      heroImageUrl: a.heroImageUrl ?? "",
      pinnedUntil: a.pinnedUntil ? toLocalInput(a.pinnedUntil) : "",
    });
  };

  return (
    <Card className="p-5">
      <header className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-[14px] font-semibold text-foreground">
            <Megaphone className="h-4 w-4 text-acid" /> Announcements
          </h3>
          <p className="text-[12px] text-muted/60">
            Patches, events, and news. Pinned posts appear at the top of your game page.
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <FilterChip current={filter} value="all" onClick={() => setFilter("all")}>
            All
          </FilterChip>
          {CATEGORIES.map((c) => (
            <FilterChip key={c} current={filter} value={c} onClick={() => setFilter(c)}>
              {c}
            </FilterChip>
          ))}
        </div>
      </header>

      <div className="mb-4 rounded-xl border border-separator bg-input/30 p-3">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted/55">
          {edit.id ? "Edit announcement" : "New announcement"}
        </p>
        <div className="grid gap-2 md:grid-cols-3">
          <select
            value={edit.category}
            onChange={(e) =>
              setEdit({ ...edit, category: e.target.value as AnnouncementCategory })
            }
            className="h-9 rounded-xl border border-separator bg-input px-3 text-[13px] text-foreground"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <Input
            value={edit.title}
            onChange={(e) => setEdit({ ...edit, title: e.target.value })}
            placeholder="Patch 1.2 — Spring update"
            className="md:col-span-2"
          />
          <textarea
            value={edit.body}
            onChange={(e) => setEdit({ ...edit, body: e.target.value })}
            placeholder="Markdown supported. Add patch notes, link to a video, anything."
            className="md:col-span-3 min-h-28 w-full rounded-xl border border-separator bg-input px-3.5 py-2 text-[13px] text-foreground placeholder:text-muted/40 focus:border-acid/30 focus:outline-none focus:ring-1 focus:ring-acid/15"
          />
          <div className="md:col-span-2">
            <ImageDropzone
              label="Hero image (optional)"
              value={edit.heroImageUrl}
              onChange={(v) => setEdit({ ...edit, heroImageUrl: v })}
              storagePath={
                edit.id
                  ? `dw_announcements/${edit.id}/hero`
                  : `dw_announcements/draft-${appId}/hero`
              }
            />
          </div>
          <label className="text-[11px] text-muted/65">
            Pin until (optional)
            <input
              type="datetime-local"
              value={edit.pinnedUntil}
              onChange={(e) => setEdit({ ...edit, pinnedUntil: e.target.value })}
              className="mt-1 w-full rounded-xl border border-separator bg-input px-3 py-1.5 text-[12px] text-foreground"
            />
          </label>
          <div className="md:col-span-3 flex items-center justify-end gap-2">
            {edit.id && (
              <Button variant="secondary" onClick={() => setEdit(EMPTY)}>
                Cancel
              </Button>
            )}
            <Button onClick={handleSave} disabled={save.isPending}>
              <Plus className="h-4 w-4" /> {save.isPending ? "Saving…" : edit.id ? "Update" : "Publish"}
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {list.isLoading && <p className="text-[12px] text-muted/55">Loading…</p>}
        {!list.isLoading && filtered.length === 0 && (
          <p className="rounded-xl border border-dashed border-separator p-4 text-center text-[12px] text-muted/55">
            No announcements yet.
          </p>
        )}
        {filtered.map((a) => {
          const isPinned = a.pinnedUntil && new Date(a.pinnedUntil).getTime() > Date.now();
          return (
            <div
              key={a.id}
              className="flex items-start justify-between gap-3 rounded-xl border border-separator bg-input/40 p-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest ${CAT_STYLES[a.category]}`}
                  >
                    {a.category}
                  </span>
                  {isPinned && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-acid">
                      <Pin className="h-3 w-3" /> Pinned
                    </span>
                  )}
                  <p className="truncate text-[13px] font-semibold text-foreground">{a.title}</p>
                </div>
                <p className="mt-0.5 line-clamp-2 text-[12px] text-muted/70">{a.body}</p>
                <p className="mt-1 text-[10px] uppercase tracking-widest text-muted/55">
                  Published {formatDate(a.publishedAt)}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => handleEdit(a)}>
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => del.mutate(a.id)}
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

function FilterChip({
  current,
  value,
  onClick,
  children,
}: {
  current: "all" | AnnouncementCategory;
  value: "all" | AnnouncementCategory;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const active = current === value;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest transition-all ${
        active
          ? "bg-card-active text-foreground"
          : "text-muted/65 hover:bg-card-hover/50 hover:text-foreground/80"
      }`}
    >
      {children}
    </button>
  );
}
