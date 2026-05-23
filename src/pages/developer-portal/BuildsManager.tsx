import { useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { CheckCircle2, GitBranch, Package, Trash2, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { toast } from "@/stores/toast-store";
import { useApp } from "@/hooks/use-apps";
import {
  useAppBuilds,
  useCreateBuild,
  useDeleteBuild,
  useSetBranchLive,
} from "@/hooks/use-app-builds";
import { formatBytes, formatDate } from "@/lib/utils";
import type { OSPlatform } from "@/lib/types";

const PLATFORMS: OSPlatform[] = ["windows", "mac", "linux"];

export function BuildsManager() {
  const { appId = "" } = useParams();
  const { data: app } = useApp(appId);
  const { data: builds, isLoading } = useAppBuilds(appId);
  const createBuild = useCreateBuild(appId);
  const deleteBuild = useDeleteBuild(appId);
  const setBranchLive = useSetBranchLive(appId);

  const [showUpload, setShowUpload] = useState(false);
  const [label, setLabel] = useState("");
  const [notes, setNotes] = useState("");
  const [platforms, setPlatforms] = useState<OSPlatform[]>(["windows"]);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const togglePlatform = (p: OSPlatform) =>
    setPlatforms((cur) => (cur.includes(p) ? cur.filter((x) => x !== p) : [...cur, p]));

  const reset = () => {
    setLabel("");
    setNotes("");
    setPlatforms(["windows"]);
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUpload = async () => {
    if (!label.trim()) {
      toast.error("Build label is required.");
      return;
    }
    if (platforms.length === 0) {
      toast.error("Pick at least one platform.");
      return;
    }
    try {
      await createBuild.mutateAsync({
        buildLabel: label.trim(),
        notes: notes.trim(),
        platforms,
        file: file ?? undefined,
      });
      toast.success(`Build ${label.trim()} uploaded.`);
      setShowUpload(false);
      reset();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload failed.";
      toast.error(msg);
    }
  };

  if (isLoading) {
    return <Card className="p-6 text-[13px] text-muted/65">Loading builds…</Card>;
  }

  const branches = app?.branches ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[16px] font-semibold text-foreground">Builds</h3>
        <Button onClick={() => setShowUpload(true)}>
          <Upload className="h-4 w-4" />
          Upload build
        </Button>
      </div>

      <Card className="overflow-hidden">
        {(builds ?? []).length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 p-8 text-center">
            <Package className="h-8 w-8 text-muted/40" />
            <p className="text-[13px] text-muted/70">No builds uploaded yet.</p>
          </div>
        ) : (
          <table className="w-full text-left text-[12px]">
            <thead className="bg-card-active/30 text-[10px] uppercase tracking-widest text-muted/60">
              <tr>
                <th className="px-4 py-2">Label</th>
                <th className="px-4 py-2">Platforms</th>
                <th className="px-4 py-2">Size</th>
                <th className="px-4 py-2">Uploaded</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {(builds ?? []).map((b) => (
                <tr key={b.id} className="border-t border-separator/60 hover:bg-card-active/30">
                  <td className="px-4 py-2.5">
                    <div className="font-semibold text-foreground">{b.buildLabel}</div>
                    {b.notes && <div className="text-[11px] text-muted/60">{b.notes}</div>}
                  </td>
                  <td className="px-4 py-2.5 text-foreground/80">{b.platforms.join(", ")}</td>
                  <td className="px-4 py-2.5 text-foreground/80">{formatBytes(b.sizeBytes)}</td>
                  <td className="px-4 py-2.5 text-foreground/80">{formatDate(b.uploadedAt)}</td>
                  <td className="px-4 py-2.5">
                    <Badge variant={b.status === "ready" ? "free" : "soon"}>{b.status}</Badge>
                  </td>
                  <td className="px-4 py-2.5">
                    <button
                      className="text-muted/50 hover:text-red"
                      onClick={async () => {
                        if (!confirm(`Delete build ${b.buildLabel}?`)) return;
                        try {
                          await deleteBuild.mutateAsync(b.id);
                          toast.success("Build deleted.");
                        } catch (err: unknown) {
                          const msg = err instanceof Error ? err.message : "Delete failed.";
                          toast.error(msg);
                        }
                      }}
                      aria-label="Delete build"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <div>
        <h3 className="mb-2 mt-6 flex items-center gap-2 text-[16px] font-semibold text-foreground">
          <GitBranch className="h-4 w-4 text-muted/60" /> Branches
        </h3>
        <p className="mb-3 text-[12px] text-muted/65">
          Pick which build is live on each branch. The default branch is what players see in the
          store; beta and internal are opt-in channels.
        </p>
        <Card className="overflow-hidden">
          <table className="w-full text-left text-[12px]">
            <thead className="bg-card-active/30 text-[10px] uppercase tracking-widest text-muted/60">
              <tr>
                <th className="px-4 py-2">Branch</th>
                <th className="px-4 py-2">Live build</th>
                <th className="px-4 py-2">Last set</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {branches.map((branch) => (
                <tr key={branch.name} className="border-t border-separator/60">
                  <td className="px-4 py-2.5 font-semibold text-foreground">
                    {branch.name}
                    {branch.name === "default" && (
                      <Badge variant="new" className="ml-2">
                        public
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <select
                      value={branch.liveBuildId ?? ""}
                      onChange={async (e) => {
                        try {
                          await setBranchLive.mutateAsync({
                            branch: branch.name,
                            buildId: e.target.value || undefined,
                          });
                          toast.success(`${branch.name} updated.`);
                        } catch (err: unknown) {
                          const msg = err instanceof Error ? err.message : "Could not update branch.";
                          toast.error(msg);
                        }
                      }}
                      className="h-8 rounded-lg border border-separator bg-input px-2 text-[12px] text-foreground focus:outline-none"
                    >
                      <option value="">— none —</option>
                      {(builds ?? []).map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.buildLabel}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2.5 text-foreground/70">{formatDate(branch.updatedAt)}</td>
                  <td className="px-4 py-2.5">
                    {branch.liveBuildId && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-green">
                        <CheckCircle2 className="h-3.5 w-3.5" /> live
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      <Modal open={showUpload} onClose={() => setShowUpload(false)} title="Upload build">
        <div className="space-y-3">
          <Field label="Build label">
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="0.4.2-rc1"
            />
          </Field>
          <Field label="Notes">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-20 w-full rounded-xl border border-separator bg-input px-3.5 py-2 text-[13px] text-foreground placeholder:text-muted/40 focus:border-acid/30 focus:outline-none focus:ring-1 focus:ring-acid/15"
              placeholder="What changed?"
            />
          </Field>
          <Field label="Platforms">
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map((p) => {
                const on = platforms.includes(p);
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => togglePlatform(p)}
                    className={`rounded-full border px-3 py-1 text-[11.5px] font-medium transition-colors ${
                      on
                        ? "border-acid/40 bg-acid/15 text-acid"
                        : "border-separator bg-card-active text-foreground/70 hover:border-acid/30"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </Field>
          <Field label="Build artifact (optional)">
            <input
              ref={fileInputRef}
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="w-full text-[12px] text-foreground/80 file:mr-3 file:rounded-md file:border file:border-separator file:bg-card-active file:px-3 file:py-1.5 file:text-foreground/80 file:transition-colors file:hover:bg-card-hover"
            />
            <p className="mt-1 text-[11px] text-muted/55">
              Stored to Firebase Storage when configured, otherwise inlined as a data URL for preview.
            </p>
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setShowUpload(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={createBuild.isPending}>
              <Upload className="h-4 w-4" />
              {createBuild.isPending ? "Uploading…" : "Upload"}
            </Button>
          </div>
        </div>
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
