import { useState } from "react";
import { MessageCircle, Plus, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/stores/toast-store";
import {
  useDeleteSocialDraft,
  useSaveSocialDraft,
  useSocialDraftsByApp,
} from "@/hooks/use-social-drafts";
import { PLATFORM_LIMITS } from "@/lib/api/social-drafts";
import type { SocialPlatform } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const PLATFORMS: SocialPlatform[] = ["twitter", "discord", "bluesky"];

export function SocialDraftsCard({ appId }: { appId: string }) {
  const list = useSocialDraftsByApp(appId);
  const save = useSaveSocialDraft();
  const del = useDeleteSocialDraft(appId);

  const [platform, setPlatform] = useState<SocialPlatform>("twitter");
  const [body, setBody] = useState("");
  const limit = PLATFORM_LIMITS[platform];
  const over = body.length > limit;

  const handleSave = async () => {
    try {
      await save.mutateAsync({ appId, platform, body });
      toast.success("Draft saved.");
      setBody("");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Save failed.");
    }
  };

  return (
    <Card className="p-5">
      <header className="mb-4">
        <h3 className="flex items-center gap-2 text-[14px] font-semibold text-foreground">
          <MessageCircle className="h-4 w-4 text-cyan" /> Social posts
        </h3>
        <p className="text-[12px] text-muted/60">
          Draft your launch / patch / event posts here. Character limits enforced per platform.
        </p>
      </header>

      <div className="mb-4 rounded-xl border border-separator bg-input/30 p-3">
        <div className="mb-2 flex items-center gap-2">
          {PLATFORMS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPlatform(p)}
              className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-widest transition-all ${
                platform === p
                  ? "bg-card-active text-foreground"
                  : "text-muted/65 hover:bg-card-hover/50 hover:text-foreground/80"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={
            platform === "twitter"
              ? "Big day: patch 1.2 lands today with a new biome and 20+ fixes. Read the notes ↓"
              : "Write your post…"
          }
          className="min-h-24 w-full rounded-xl border border-separator bg-input px-3.5 py-2 text-[13px] text-foreground placeholder:text-muted/40 focus:border-acid/30 focus:outline-none focus:ring-1 focus:ring-acid/15"
        />
        <div className="mt-1.5 flex items-center justify-between">
          <span className={`text-[11px] ${over ? "text-red" : "text-muted/55"}`}>
            {body.length} / {limit}
          </span>
          <Button onClick={handleSave} disabled={save.isPending || over || !body.trim()}>
            <Plus className="h-4 w-4" /> Save draft
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {list.isLoading && <p className="text-[12px] text-muted/55">Loading…</p>}
        {!list.isLoading && (list.data ?? []).length === 0 && (
          <p className="rounded-xl border border-dashed border-separator p-4 text-center text-[12px] text-muted/55">
            No drafts yet.
          </p>
        )}
        {(list.data ?? []).map((d) => (
          <div
            key={d.id}
            className="flex items-start gap-3 rounded-xl border border-separator bg-input/40 p-3"
          >
            <div className="flex-1">
              <div className="mb-1 flex items-center gap-2">
                <span className="rounded-full bg-cyan/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-cyan">
                  {d.platform}
                </span>
                <span className="text-[11px] text-muted/55">{formatDate(d.createdAt)}</span>
              </div>
              <p className="whitespace-pre-wrap text-[12px] text-foreground/85">{d.body}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => del.mutate(d.id)}
              aria-label="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
}
