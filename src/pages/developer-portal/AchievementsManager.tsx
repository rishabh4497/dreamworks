import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, Pencil, Plus, Trash2, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { ImageDropzone } from "@/components/common/ImageDropzone";
import { toast } from "@/stores/toast-store";
import {
  useAchievements,
  useDeleteAchievement,
  useUpsertAchievement,
} from "@/hooks/use-app-achievements";
import { ROUTES } from "@/lib/routes";
import type { Achievement } from "@/lib/types";

type Draft = Omit<Achievement, "id"> & { id?: string };

const EMPTY: Draft = {
  name: "",
  description: "",
  iconUrl: "",
  globalUnlockPct: 0,
  hidden: false,
};

export function AchievementsManager() {
  const { appId = "" } = useParams();
  const { data, isLoading } = useAchievements(appId);
  const upsert = useUpsertAchievement(appId);
  const del = useDeleteAchievement(appId);

  const [editing, setEditing] = useState<Draft | null>(null);

  if (isLoading) {
    return <Card className="p-6 text-[13px] text-muted/65">Loading achievements…</Card>;
  }

  const achievements = data ?? [];

  const handleSave = async () => {
    if (!editing) return;
    if (!editing.name.trim()) {
      toast.error("Name is required.");
      return;
    }
    try {
      await upsert.mutateAsync(editing);
      toast.success(editing.id ? "Achievement updated." : "Achievement added.");
      setEditing(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Save failed.";
      toast.error(msg);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[16px] font-semibold text-foreground">Achievements</h3>
        <Button onClick={() => setEditing({ ...EMPTY, id: "ach-" + crypto.randomUUID() })}>
          <Plus className="h-4 w-4" />
          Add achievement
        </Button>
      </div>

      <Link
        to={ROUTES.devAppSdk(appId)}
        className="flex items-center justify-between rounded-xl border border-separator bg-card px-3.5 py-2.5 text-[12.5px] text-foreground/80 transition-colors hover:border-acid/30 hover:text-foreground"
      >
        <span>
          Defined achievements only count once you wire them up in code —{" "}
          <span className="text-acid">see SDK Integration</span> for the snippet.
        </span>
        <ArrowRight className="h-3.5 w-3.5 text-muted/60" />
      </Link>

      <Card className="overflow-hidden">
        {achievements.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 p-8 text-center">
            <Trophy className="h-8 w-8 text-muted/40" />
            <p className="text-[13px] text-muted/70">No achievements yet.</p>
          </div>
        ) : (
          <table className="w-full text-left text-[12px]">
            <thead className="bg-card-active/30 text-[10px] uppercase tracking-widest text-muted/60">
              <tr>
                <th className="w-12 px-4 py-2"></th>
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Description</th>
                <th className="px-4 py-2">Unlock %</th>
                <th className="px-4 py-2">Visibility</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {achievements.map((a) => (
                <tr key={a.id} className="border-t border-separator/60 hover:bg-card-active/30">
                  <td className="px-4 py-2.5">
                    <div className="h-9 w-9 overflow-hidden rounded-md border border-separator bg-card-active">
                      {a.iconUrl ? (
                        <img src={a.iconUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <Trophy className="m-2 h-5 w-5 text-muted/40" />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2.5 font-semibold text-foreground">{a.name}</td>
                  <td className="px-4 py-2.5 text-foreground/80">{a.description}</td>
                  <td className="px-4 py-2.5 text-foreground/80">{a.globalUnlockPct}%</td>
                  <td className="px-4 py-2.5">
                    {a.hidden ? (
                      <Badge>
                        <EyeOff className="mr-1 h-3 w-3" /> hidden
                      </Badge>
                    ) : (
                      <Badge variant="free">
                        <Eye className="mr-1 h-3 w-3" /> visible
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <button
                        className="text-muted/50 hover:text-foreground"
                        onClick={() => setEditing({ ...a })}
                        aria-label="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        className="text-muted/50 hover:text-red"
                        onClick={async () => {
                          if (!confirm(`Delete achievement "${a.name}"?`)) return;
                          try {
                            await del.mutateAsync(a.id);
                            toast.success("Deleted.");
                          } catch (err: unknown) {
                            const msg = err instanceof Error ? err.message : "Delete failed.";
                            toast.error(msg);
                          }
                        }}
                        aria-label="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing?.id ? "Edit achievement" : "New achievement"}
      >
        {editing && (
          <div className="space-y-3">
            <Field label="Name">
              <Input
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              />
            </Field>
            <Field label="Description">
              <textarea
                value={editing.description}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                className="min-h-20 w-full rounded-xl border border-separator bg-input px-3.5 py-2 text-[13px] text-foreground placeholder:text-muted/40 focus:border-acid/30 focus:outline-none focus:ring-1 focus:ring-acid/15"
              />
            </Field>
            <ImageDropzone
              label="Icon"
              value={editing.iconUrl}
              onChange={(value) => setEditing({ ...editing, iconUrl: value })}
              storagePath={
                editing.id ? `dw_apps/${appId}/achievements/${editing.id}/icon` : undefined
              }
              maxDim={256}
            />
            <Field label="Estimated global unlock %">
              <Input
                type="number"
                min={0}
                max={100}
                value={editing.globalUnlockPct}
                onChange={(e) =>
                  setEditing({ ...editing, globalUnlockPct: Number(e.target.value) })
                }
              />
            </Field>
            <label className="flex items-center gap-2 rounded-xl bg-card-active/45 p-3 text-[13px] text-foreground">
              <input
                type="checkbox"
                checked={editing.hidden}
                onChange={(e) => setEditing({ ...editing, hidden: e.target.checked })}
                className="h-4 w-4 accent-acid"
              />
              Hidden — only revealed once unlocked
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={upsert.isPending}>
                {upsert.isPending ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
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
