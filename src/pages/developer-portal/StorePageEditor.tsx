import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { CalendarClock, FileText, Image as ImageIcon, Save, Settings2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ImageDropzone, ScreenshotsZone } from "@/components/common/ImageDropzone";
import { VideoDropzone } from "@/components/common/VideoDropzone";
import { toast } from "@/stores/toast-store";
import { useApp, useSaveApp } from "@/hooks/use-apps";
import { joinScreenshots, parseScreenshots } from "@/lib/utils";
import type {
  App,
  GameFeature,
  OSPlatform,
  ReleaseWindow,
  SystemRequirementsBlock,
  Trailer,
} from "@/lib/types";

const RELEASE_WINDOWS: { value: ReleaseWindow; label: string }[] = [
  { value: "morning", label: "Morning" },
  { value: "afternoon", label: "Afternoon" },
  { value: "evening", label: "Evening" },
  { value: "midnight", label: "Midnight" },
];

const PLATFORMS: OSPlatform[] = ["windows", "mac", "linux"];

const FEATURES: GameFeature[] = [
  "single-player",
  "multiplayer",
  "co-op",
  "online-pvp",
  "controller-partial",
  "controller-full",
  "achievements",
  "cloud-saves",
  "workshop",
  "vr-supported",
  "trading-cards",
  "remote-play",
];

const AGE_RATINGS = [
  "Everyone",
  "Everyone 10+",
  "Teen",
  "Mature 17+",
  "Adults Only 18+",
  "PEGI 3",
  "PEGI 7",
  "PEGI 12",
  "PEGI 16",
  "PEGI 18",
];

function youtubeIdFromUrl(url: string): string {
  const m = url.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{6,})/);
  return m ? m[1] : url;
}

export function StorePageEditor() {
  const { appId = "" } = useParams();
  const { data: app, isLoading } = useApp(appId);
  const saveApp = useSaveApp(appId);

  const [draft, setDraft] = useState<App | null>(null);

  useEffect(() => {
    if (app) setDraft(app);
  }, [app]);

  if (isLoading || !draft) {
    return <Card className="p-6 text-[13px] text-muted/65">Loading store page…</Card>;
  }

  const set = <K extends keyof App>(key: K, value: App[K]) =>
    setDraft((d) => (d ? { ...d, [key]: value } : d));

  const toggleArrayValue = <K extends keyof App>(
    key: K,
    value: string,
    on: boolean,
  ) => {
    const arr = (draft[key] as unknown as string[]) ?? [];
    const next = on ? Array.from(new Set([...arr, value])) : arr.filter((v) => v !== value);
    set(key, next as App[K]);
  };

  const updateSysReq = (
    target: keyof App["systemRequirements"],
    field: keyof SystemRequirementsBlock,
    value: string,
  ) => {
    const existing = draft.systemRequirements?.[target] ?? {
      os: "",
      cpu: "",
      memory: "",
      gpu: "",
      storage: "",
    };
    set("systemRequirements", {
      ...draft.systemRequirements,
      [target]: { ...existing, [field]: value },
    });
  };

  const screenshotsRaw = joinScreenshots(draft.screenshots ?? []);

  const handleSave = async () => {
    try {
      await saveApp.mutateAsync({
        gameTitle: draft.gameTitle,
        shortDescription: draft.shortDescription,
        longDescription: draft.longDescription,
        genres: draft.genres,
        tags: draft.tags,
        languages: draft.languages,
        ageRating: draft.ageRating,
        platforms: draft.platforms,
        features: draft.features,
        systemRequirements: draft.systemRequirements,
        coverUrl: draft.coverUrl,
        capsuleUrl: draft.capsuleUrl,
        headerUrl: draft.headerUrl,
        screenshots: draft.screenshots,
        trailers: draft.trailers,
        releaseDate: draft.releaseDate,
        releaseWindow: draft.releaseWindow,
        checklist: {
          ...draft.checklist,
          capsuleArt: Boolean(draft.capsuleUrl),
          achievements: draft.features.includes("achievements"),
          controllerSupport:
            draft.features.includes("controller-full") ||
            draft.features.includes("controller-partial"),
          cloudSaves: draft.features.includes("cloud-saves"),
        },
      });
      toast.success("Store page saved.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Save failed.";
      toast.error(msg);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[16px] font-semibold text-foreground">Store page</h3>
        <Button onClick={handleSave} disabled={saveApp.isPending}>
          <Save className="h-4 w-4" />
          {saveApp.isPending ? "Saving…" : "Save"}
        </Button>
      </div>

      {/* Basic info */}
      <Card className="space-y-4 p-4">
        <SectionTitle icon={FileText} title="Basic info" />
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Game title">
            <Input value={draft.gameTitle} onChange={(e) => set("gameTitle", e.target.value)} />
          </Field>
          <Field label="Age rating">
            <select
              value={draft.ageRating}
              onChange={(e) => set("ageRating", e.target.value)}
              className="h-10 w-full rounded-xl border border-separator bg-input px-3.5 text-[13px] text-foreground focus:outline-none"
            >
              {AGE_RATINGS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Short description (one line)" className="md:col-span-2">
            <Input
              value={draft.shortDescription}
              onChange={(e) => set("shortDescription", e.target.value)}
              placeholder="A cozy rail-builder about restoring night routes between floating cities."
            />
          </Field>
          <Field label="About this game (long description)" className="md:col-span-2">
            <textarea
              value={draft.longDescription}
              onChange={(e) => set("longDescription", e.target.value)}
              className="min-h-32 w-full rounded-xl border border-separator bg-input px-3.5 py-2 text-[13px] text-foreground placeholder:text-muted/40 focus:border-acid/30 focus:outline-none focus:ring-1 focus:ring-acid/15"
            />
          </Field>
        </div>
      </Card>

      {/* Tags + languages */}
      <Card className="space-y-4 p-4">
        <SectionTitle icon={Settings2} title="Tags, genres, languages, platforms, features" />
        <Field label="Genres (comma-separated)">
          <Input
            value={draft.genres.join(", ")}
            onChange={(e) =>
              set(
                "genres",
                e.target.value
                  .split(",")
                  .map((g) => g.trim())
                  .filter(Boolean),
              )
            }
            placeholder="Simulation, Indie, Strategy"
          />
        </Field>
        <ChipEditor
          label="Tags"
          values={draft.tags}
          onChange={(next) => set("tags", next)}
          placeholder="cozy, train, building"
        />
        <ChipEditor
          label="Languages"
          values={draft.languages}
          onChange={(next) => set("languages", next)}
          placeholder="English, Japanese"
        />
        <div>
          <Label>Platforms</Label>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {PLATFORMS.map((p) => {
              const on = draft.platforms.includes(p);
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => toggleArrayValue("platforms", p, !on)}
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
        </div>
        <div>
          <Label>Features</Label>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {FEATURES.map((f) => {
              const on = draft.features.includes(f);
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => toggleArrayValue("features", f, !on)}
                  className={`rounded-full border px-3 py-1 text-[11.5px] font-medium transition-colors ${
                    on
                      ? "border-acid/40 bg-acid/15 text-acid"
                      : "border-separator bg-card-active text-foreground/70 hover:border-acid/30"
                  }`}
                >
                  {f}
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Media */}
      <Card className="space-y-4 p-4">
        <SectionTitle icon={ImageIcon} title="Media" />
        <div className="grid gap-3 md:grid-cols-2">
          <ImageDropzone
            label="Cover"
            value={draft.coverUrl || ""}
            onChange={(v) => set("coverUrl", v)}
            storagePath={`dw_apps/${appId}/cover`}
          />
          <ImageDropzone
            label="Capsule"
            value={draft.capsuleUrl || ""}
            onChange={(v) => set("capsuleUrl", v)}
            storagePath={`dw_apps/${appId}/capsule`}
          />
          <ImageDropzone
            label="Header"
            value={draft.headerUrl || ""}
            onChange={(v) => set("headerUrl", v)}
            storagePath={`dw_apps/${appId}/header`}
            className="md:col-span-2"
          />
          <ScreenshotsZone
            value={screenshotsRaw}
            onChange={(value) => set("screenshots", parseScreenshots(value))}
            storagePath={`dw_apps/${appId}/screenshots`}
            className="md:col-span-2"
          />
        </div>
        <TrailersEditor
          appId={appId}
          trailers={draft.trailers ?? []}
          onChange={(next) => set("trailers", next)}
          posterFallback={draft.headerUrl || ""}
        />
      </Card>

      {/* System requirements */}
      <Card className="space-y-4 p-4">
        <SectionTitle icon={Settings2} title="System requirements" />
        {(["windows", "mac", "linux"] as const).map((p) => {
          const on = draft.platforms.includes(p);
          const block = draft.systemRequirements?.[p];
          return (
            <details key={p} open={on} className="rounded-xl border border-separator bg-card-active/35 p-3">
              <summary className="cursor-pointer text-[13px] font-semibold capitalize text-foreground">
                {p} {!on && <Badge className="ml-2">platform off</Badge>}
              </summary>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {(
                  [
                    ["os", "OS"],
                    ["cpu", "CPU"],
                    ["memory", "Memory"],
                    ["gpu", "GPU"],
                    ["storage", "Storage"],
                  ] as const
                ).map(([field, label]) => (
                  <Field key={field} label={label}>
                    <Input
                      value={block?.[field] ?? ""}
                      onChange={(e) => updateSysReq(p, field, e.target.value)}
                      placeholder={label}
                    />
                  </Field>
                ))}
                <Field label="Notes" className="md:col-span-2">
                  <Input
                    value={block?.notes ?? ""}
                    onChange={(e) => updateSysReq(p, "notes", e.target.value)}
                  />
                </Field>
              </div>
            </details>
          );
        })}
      </Card>

      {/* Release timing */}
      <Card className="space-y-4 p-4">
        <SectionTitle icon={CalendarClock} title="Release window" />
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Release date">
            <Input
              type="date"
              value={draft.releaseDate ?? ""}
              onChange={(e) => set("releaseDate", e.target.value)}
            />
          </Field>
          <Field label="Time of day">
            <select
              value={draft.releaseWindow}
              onChange={(e) => set("releaseWindow", e.target.value as ReleaseWindow)}
              className="h-10 w-full rounded-xl border border-separator bg-input px-3.5 text-[13px] text-foreground focus:outline-none"
            >
              {RELEASE_WINDOWS.map((w) => (
                <option key={w.value} value={w.value}>
                  {w.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </Card>
    </div>
  );
}

function ChipEditor({
  label,
  values,
  onChange,
  placeholder,
}: {
  label: string;
  values: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}) {
  const [pending, setPending] = useState("");
  const commit = () => {
    const parts = pending
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length === 0) return;
    onChange(Array.from(new Set([...values, ...parts])));
    setPending("");
  };
  return (
    <div>
      <Label>{label}</Label>
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        {values.map((v) => (
          <span
            key={v}
            className="inline-flex items-center gap-1 rounded-full border border-separator bg-card-active px-2.5 py-1 text-[11.5px] font-medium text-foreground/80"
          >
            {v}
            <button
              type="button"
              onClick={() => onChange(values.filter((x) => x !== v))}
              className="text-muted/50 hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <Input
          value={pending}
          onChange={(e) => setPending(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            }
          }}
          onBlur={commit}
          placeholder={placeholder}
          className="h-8 w-44"
        />
      </div>
    </div>
  );
}

function TrailersEditor({
  appId,
  trailers,
  onChange,
  posterFallback,
}: {
  appId: string;
  trailers: Trailer[];
  onChange: (next: Trailer[]) => void;
  posterFallback: string;
}) {
  const [url, setUrl] = useState("");
  const [uploadKey, setUploadKey] = useState(0); // remounts VideoDropzone after each upload

  const addUploadedVideo = (videoUrl: string) => {
    if (!videoUrl) return;
    const id = "trailer-" + crypto.randomUUID();
    const next: Trailer = {
      url: videoUrl,
      posterUrl: posterFallback,
      provider: "self",
      id,
    };
    onChange([...trailers, next]);
    setUploadKey((k) => k + 1); // reset the dropzone so the user can upload another
  };

  return (
    <div className="space-y-3">
      <Label>Trailers</Label>

      {/* Existing trailers — show video preview for self-hosted, link for embeds */}
      {trailers.length > 0 && (
        <div className="space-y-2">
          {trailers.map((t) => (
            <div
              key={t.id}
              className="flex items-stretch gap-3 rounded-xl border border-separator bg-card-active/40 p-3 text-[12px]"
            >
              {t.provider === "self" ? (
                <video
                  src={t.url}
                  controls
                  playsInline
                  preload="metadata"
                  className="h-20 w-36 shrink-0 rounded-md bg-black object-cover"
                />
              ) : (
                <div className="flex h-20 w-36 shrink-0 items-center justify-center rounded-md bg-black text-[10px] uppercase tracking-widest text-muted/55">
                  {t.provider}
                </div>
              )}
              <div className="flex min-w-0 flex-1 flex-col justify-center">
                <p className="truncate text-foreground/80">{t.url}</p>
                <p className="mt-0.5 text-[10px] uppercase tracking-widest text-muted/55">
                  {t.provider === "self" ? "Self-hosted (Firebase Storage)" : t.provider}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onChange(trailers.filter((x) => x.id !== t.id))}
                className="self-start text-muted/55 hover:text-red"
                aria-label="Remove trailer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload a video file → goes to dw_apps/{appId}/trailers/{uuid} */}
      <div className="rounded-xl border border-separator bg-card-active/25 p-3">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted/55">
          Upload your own video
        </p>
        <VideoDropzone
          key={uploadKey}
          label=""
          value=""
          onChange={addUploadedVideo}
          storagePath={
            appId
              ? `dw_apps/${appId}/trailers/trailer-${crypto.randomUUID()}.mp4`
              : undefined
          }
        />
      </div>

      {/* Or paste a YouTube URL */}
      <div className="rounded-xl border border-separator bg-card-active/25 p-3">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted/55">
          …or paste a YouTube URL
        </p>
        <div className="flex gap-2">
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
          />
          <Button
            variant="secondary"
            onClick={() => {
              if (!url.trim()) return;
              const id = youtubeIdFromUrl(url.trim());
              const next: Trailer = {
                url: url.trim(),
                posterUrl: posterFallback,
                provider: "youtube",
                id,
              };
              onChange([...trailers, next]);
              setUrl("");
            }}
          >
            Add
          </Button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={className}>
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-muted/50">
        {label}
      </span>
      {children}
    </label>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-muted/50">
      {children}
    </span>
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
