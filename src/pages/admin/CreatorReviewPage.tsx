import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Briefcase,
  Building,
  CheckCircle2,
  ExternalLink,
  Globe,
  Pencil,
  RotateCcw,
  Save,
  Search,
  X,
  XCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/EmptyState";
import { ImageDropzone } from "@/components/common/ImageDropzone";
import {
  useAllCreators,
  useSetCreatorVerification,
  useUpdateCreator,
} from "@/hooks/use-admin";
import { toast } from "@/stores/toast-store";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/routes";
import { openExternal } from "@/lib/platform";
import type {
  CreatorSocialLinks,
  CreatorSubmissionType,
  CreatorVerificationStatus,
} from "@/lib/types";
import type { Creator, CreatorPatch } from "@/lib/api/admin";

type VerificationFilter = CreatorVerificationStatus | "all";

const FILTER_OPTIONS: { value: VerificationFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "unverified", label: "Unverified" },
  { value: "pending", label: "Pending review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

function verificationVariant(
  status: CreatorVerificationStatus,
): "default" | "free" | "soon" | "warn" {
  switch (status) {
    case "approved":
      return "free";
    case "pending":
      return "soon";
    case "rejected":
      return "warn";
    case "unverified":
    default:
      return "default";
  }
}

function statusOf(c: Creator): CreatorVerificationStatus {
  return (c.verificationStatus ?? "unverified") as CreatorVerificationStatus;
}

interface CreatorReviewPageProps {
  type: CreatorSubmissionType;
}

export function CreatorReviewPage({ type }: CreatorReviewPageProps) {
  const [filter, setFilter] = useState<VerificationFilter>("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const { data, isLoading, error } = useAllCreators(type, { verification: filter });
  const setVerification = useSetCreatorVerification();
  const updateMutation = useUpdateCreator();
  const [selectedId, setSelectedId] = useState<string>("");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<CreatorPatch>({});

  useEffect(() => {
    const handle = setTimeout(() => setSearch(searchInput.trim().toLowerCase()), 200);
    return () => clearTimeout(handle);
  }, [searchInput]);

  const filtered = useMemo(() => {
    if (!data) return [];
    if (!search) return data;
    return data.filter(
      (c) =>
        c.name?.toLowerCase().includes(search) ||
        c.id.toLowerCase().includes(search) ||
        c.ownerUserId?.toLowerCase().includes(search),
    );
  }, [data, search]);

  useEffect(() => {
    if (filtered.length === 0) {
      setSelectedId("");
      return;
    }
    if (!filtered.find((c) => c.id === selectedId)) {
      setSelectedId(filtered[0].id);
    }
  }, [filtered, selectedId]);

  // Reset edit mode whenever the selected creator changes.
  useEffect(() => {
    setEditing(false);
    setDraft({});
  }, [selectedId, type]);

  const selected = filtered.find((c) => c.id === selectedId);

  const stats = useMemo(() => {
    const out = { unverified: 0, pending: 0, approved: 0, rejected: 0 };
    (data ?? []).forEach((c) => {
      const s = statusOf(c);
      out[s] = (out[s] ?? 0) + 1;
    });
    return out;
  }, [data]);

  const label = type === "publisher" ? "Publisher" : "Studio";
  const PageIcon = type === "publisher" ? Briefcase : Building;

  const setStatus = async (status: CreatorVerificationStatus) => {
    if (!selected) return;
    try {
      await setVerification.mutateAsync({ type, id: selected.id, status });
      toast.success(`${selected.name} → ${status}.`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Update failed.");
    }
  };

  const startEdit = () => {
    if (!selected) return;
    setDraft({
      name: selected.name ?? "",
      tagline: selected.tagline ?? "",
      about: selected.about ?? "",
      logoUrl: selected.logoUrl ?? "",
      bannerUrl: selected.bannerUrl ?? "",
      brandColor: selected.brandColor ?? "",
      websiteUrl: selected.websiteUrl ?? "",
      socialLinks: { ...(selected.socialLinks ?? {}) },
    });
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setDraft({});
  };

  const saveEdit = async () => {
    if (!selected) return;
    try {
      await updateMutation.mutateAsync({ type, id: selected.id, patch: draft });
      toast.success(`${selected.name} updated.`);
      setEditing(false);
      setDraft({});
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Save failed.");
    }
  };

  const patchSocial = (key: keyof CreatorSocialLinks, value: string) => {
    setDraft((curr) => ({
      ...curr,
      socialLinks: { ...(curr.socialLinks ?? {}), [key]: value },
    }));
  };

  return (
    <div className="space-y-4">
      <header className="space-y-1">
        <h2 className="text-[16px] font-semibold text-foreground">{label} verification</h2>
        <p className="text-[12px] text-muted/60">
          Every {label.toLowerCase()} profile in{" "}
          <code className="font-mono text-[11px] text-foreground/80">
            {type === "publisher" ? "dw_publishers" : "dw_developers"}
          </code>
          . Approve verified entities so their storefront pages display the verified badge.
        </p>
      </header>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted/55" />
          <input
            type="text"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder={`Search ${label.toLowerCase()} by name, slug, or owner uid`}
            className="h-9 w-full rounded-xl border border-separator bg-input pl-9 pr-3 text-[13px] text-foreground placeholder:text-muted/40 focus:border-acid/30 focus:outline-none focus:ring-1 focus:ring-acid/15"
          />
        </div>
        <select
          value={filter}
          onChange={(event) => setFilter(event.target.value as VerificationFilter)}
          className="h-9 rounded-xl border border-separator bg-input px-3 text-[13px] text-foreground focus:border-acid/30 focus:outline-none focus:ring-1 focus:ring-acid/15 sm:w-56"
        >
          {FILTER_OPTIONS.map((o) => {
            const count =
              o.value === "all"
                ? data?.length
                : stats[o.value as CreatorVerificationStatus];
            return (
              <option key={o.value} value={o.value}>
                {o.label}
                {count !== undefined ? ` (${count})` : ""}
              </option>
            );
          })}
        </select>
      </div>

      {isLoading ? (
        <Card className="p-6 text-[13px] text-muted/65">Loading {label.toLowerCase()}s…</Card>
      ) : error ? (
        <Card className="p-6 text-[13px] text-red">
          <p className="font-semibold">Failed to load.</p>
          <p className="mt-1 break-all text-[12px] text-red/85">{(error as Error).message}</p>
        </Card>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={PageIcon}
          title={`No ${label.toLowerCase()}s match`}
          description="Try a different filter or search query."
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-[minmax(280px,360px)_minmax(0,1fr)]">
          <div className="space-y-2">
            {filtered.map((creator) => (
              <CreatorRow
                key={creator.id}
                creator={creator}
                active={selectedId === creator.id}
                onSelect={() => setSelectedId(creator.id)}
              />
            ))}
          </div>

          {selected ? (
            <Card className="p-5">
              <div className="mb-4 flex items-start gap-3">
                {selected.logoUrl ? (
                  <img
                    src={selected.logoUrl}
                    alt=""
                    className="h-16 w-16 shrink-0 rounded-lg border border-separator bg-card-active object-cover"
                  />
                ) : (
                  <div className="h-16 w-16 shrink-0 rounded-lg bg-card-active" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex flex-wrap items-center gap-1.5">
                    <Badge variant={verificationVariant(statusOf(selected))}>
                      {statusOf(selected)}
                    </Badge>
                    {selected.appIds?.length ? (
                      <span className="text-[11px] text-muted/55">
                        {selected.appIds.length} app{selected.appIds.length === 1 ? "" : "s"}
                      </span>
                    ) : null}
                  </div>
                  <h3 className="truncate text-[18px] font-semibold text-foreground">
                    {selected.name}
                  </h3>
                  <p className="truncate text-[12px] text-muted/65">
                    {selected.tagline || <span className="italic text-muted/40">No tagline.</span>}
                  </p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 text-[11px] text-muted/55">
                    <span className="font-mono text-foreground/70">{selected.id}</span>
                    <span className="text-muted/35">·</span>
                    <span>
                      owner{" "}
                      <span className="font-mono text-foreground/75">{selected.ownerUserId}</span>
                    </span>
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  {!editing && (
                    <button
                      type="button"
                      onClick={startEdit}
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-separator bg-card px-2.5 text-[12px] font-medium text-foreground/85 hover:bg-card-active"
                      title="Edit profile fields"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </button>
                  )}
                  <Link
                    to={
                      type === "publisher"
                        ? ROUTES.publisher(selected.id)
                        : ROUTES.developer(selected.id)
                    }
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-separator bg-card px-2.5 text-[12px] font-medium text-muted hover:bg-card-active hover:text-foreground"
                    title="Open public profile"
                  >
                    Public
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </div>

              {editing ? (
                <EditForm
                  type={type}
                  creatorId={selected.id}
                  draft={draft}
                  onChange={setDraft}
                  onChangeSocial={patchSocial}
                />
              ) : (
                <>
                  {selected.about && (
                    <section className="mb-4">
                      <h4 className="mb-1 text-[12px] font-semibold uppercase tracking-widest text-muted/55">
                        About
                      </h4>
                      <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-foreground/85">
                        {selected.about}
                      </p>
                    </section>
                  )}

                  <section className="mb-4 grid gap-2 sm:grid-cols-2">
                    {selected.websiteUrl && (
                      <button
                        type="button"
                        onClick={() => openExternal(selected.websiteUrl!)}
                        className="inline-flex items-center gap-2 rounded-lg border border-separator bg-card px-3 py-2 text-[12px] text-foreground/85 hover:bg-card-active"
                      >
                        <Globe className="h-3.5 w-3.5 text-muted/65" />
                        <span className="truncate">{selected.websiteUrl}</span>
                        <ExternalLink className="ml-auto h-3 w-3 opacity-60" />
                      </button>
                    )}
                    {selected.brandColor && (
                      <div className="inline-flex items-center gap-2 rounded-lg border border-separator bg-card px-3 py-2 text-[12px] text-muted/85">
                        <span
                          className="h-3.5 w-3.5 rounded border border-separator"
                          style={{ background: selected.brandColor }}
                        />
                        <span className="font-mono">{selected.brandColor}</span>
                      </div>
                    )}
                  </section>
                </>
              )}

              {editing ? (
                <div className="flex flex-wrap items-center justify-end gap-2 border-t border-separator/50 pt-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={cancelEdit}
                    disabled={updateMutation.isPending}
                  >
                    <X className="h-3.5 w-3.5" />
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={saveEdit}
                    disabled={updateMutation.isPending}
                  >
                    <Save className="h-3.5 w-3.5" />
                    {updateMutation.isPending ? "Saving…" : "Save changes"}
                  </Button>
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-end gap-2 border-t border-separator/50 pt-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setStatus("unverified")}
                    disabled={setVerification.isPending || statusOf(selected) === "unverified"}
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Reset
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setStatus("rejected")}
                    disabled={setVerification.isPending || statusOf(selected) === "rejected"}
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Reject
                  </Button>
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => setStatus("approved")}
                    disabled={setVerification.isPending || statusOf(selected) === "approved"}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Approve
                  </Button>
                </div>
              )}
            </Card>
          ) : (
            <Card className="p-6 text-center text-[13px] text-muted/65">
              Select a {label.toLowerCase()} to review.
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function CreatorRow({
  creator,
  active,
  onSelect,
}: {
  creator: Creator;
  active: boolean;
  onSelect: () => void;
}) {
  const status = statusOf(creator);
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors",
        active
          ? "border-acid/40 bg-acid/10"
          : "border-separator bg-card hover:bg-card-hover",
      )}
    >
      {creator.logoUrl ? (
        <img
          src={creator.logoUrl}
          alt=""
          className="h-10 w-10 shrink-0 rounded-lg border border-separator bg-card-active object-cover"
        />
      ) : (
        <div className="h-10 w-10 shrink-0 rounded-lg bg-card-active" />
      )}
      <div className="min-w-0 flex-1">
        <div className="mb-0.5 flex items-center gap-1.5">
          <Badge variant={verificationVariant(status)}>{status}</Badge>
        </div>
        <p className="truncate text-[13px] font-semibold text-foreground">{creator.name}</p>
        <p className="truncate font-mono text-[11px] text-muted/55">{creator.id}</p>
      </div>
    </button>
  );
}

function EditForm({
  type,
  creatorId,
  draft,
  onChange,
  onChangeSocial,
}: {
  type: CreatorSubmissionType;
  creatorId: string;
  draft: CreatorPatch;
  onChange: (next: CreatorPatch) => void;
  onChangeSocial: (key: keyof CreatorSocialLinks, value: string) => void;
}) {
  const set = <K extends keyof CreatorPatch>(key: K, value: CreatorPatch[K]) => {
    onChange({ ...draft, [key]: value });
  };

  // Mirror the developer-portal storage convention so admin uploads land in
  // the same Firebase Storage bucket the public profile pages already read.
  const collection = type === "publisher" ? "dw_publishers" : "dw_developers";
  const logoPath = `${collection}/${creatorId}/logo`;
  const bannerPath = `${collection}/${creatorId}/banner`;

  return (
    <div className="mb-4 space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Display name">
          <input
            type="text"
            value={draft.name ?? ""}
            onChange={(e) => set("name", e.target.value)}
            className={INPUT_CLASS}
          />
        </Field>
        <Field label="Brand color">
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={draft.brandColor || "#000000"}
              onChange={(e) => set("brandColor", e.target.value)}
              className="h-9 w-12 shrink-0 cursor-pointer rounded-lg border border-separator bg-input"
            />
            <input
              type="text"
              value={draft.brandColor ?? ""}
              onChange={(e) => set("brandColor", e.target.value)}
              placeholder="#000000"
              className={cn(INPUT_CLASS, "font-mono")}
            />
          </div>
        </Field>
      </div>

      <Field label="Tagline">
        <input
          type="text"
          value={draft.tagline ?? ""}
          onChange={(e) => set("tagline", e.target.value)}
          className={INPUT_CLASS}
        />
      </Field>

      <Field label="About">
        <textarea
          value={draft.about ?? ""}
          onChange={(e) => set("about", e.target.value)}
          rows={4}
          className={cn(INPUT_CLASS, "min-h-24 resize-y leading-relaxed")}
        />
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <ImageDropzone
          label="Logo"
          value={draft.logoUrl ?? ""}
          onChange={(url) => set("logoUrl", url)}
          storagePath={logoPath}
        />
        <ImageDropzone
          label="Banner"
          value={draft.bannerUrl ?? ""}
          onChange={(url) => set("bannerUrl", url)}
          storagePath={bannerPath}
          maxDim={1600}
        />
      </div>

      <Field label="Website URL">
        <input
          type="url"
          value={draft.websiteUrl ?? ""}
          onChange={(e) => set("websiteUrl", e.target.value)}
          placeholder="https://…"
          className={INPUT_CLASS}
        />
      </Field>

      <fieldset className="space-y-2 rounded-xl border border-separator bg-card-active/30 p-3">
        <legend className="px-1 text-[11px] font-semibold uppercase tracking-widest text-muted/55">
          Social links
        </legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {(["twitter", "discord", "youtube", "twitch"] as const).map((key) => (
            <Field key={key} label={key}>
              <input
                type="url"
                value={draft.socialLinks?.[key] ?? ""}
                onChange={(e) => onChangeSocial(key, e.target.value)}
                placeholder={`https://${key}.com/…`}
                className={INPUT_CLASS}
              />
            </Field>
          ))}
        </div>
      </fieldset>
    </div>
  );
}

const INPUT_CLASS =
  "h-9 w-full rounded-lg border border-separator bg-input px-3 text-[13px] text-foreground placeholder:text-muted/40 focus:border-acid/40 focus:outline-none focus:ring-1 focus:ring-acid/15";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="block text-[11px] font-medium uppercase tracking-widest text-muted/55">
        {label}
      </span>
      {children}
    </label>
  );
}

export function PublisherReviewPage() {
  return <CreatorReviewPage type="publisher" />;
}

export function StudioReviewPage() {
  return <CreatorReviewPage type="developer" />;
}
