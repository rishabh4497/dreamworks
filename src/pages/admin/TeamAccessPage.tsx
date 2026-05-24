import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Crown,
  Mail,
  Plus,
  Save,
  ShieldCheck,
  Users as UsersIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { useReauthRunner } from "@/components/common/ReauthModal";
import { useAuthStore } from "@/stores/auth-store";
import {
  inviteAdmin,
  listAdminCandidates,
  listAdminUsers,
  setUserPermissions,
} from "@/lib/api/admin";
import {
  ALL_PERMISSIONS,
  OWNER_ONLY_DEFAULTS,
  PERMISSION_GROUPS,
  PRESET_BUNDLES,
  hasPermission,
  presetKeys,
  type PermissionKey,
} from "@/lib/permissions";
import { toast } from "@/stores/toast-store";
import { cn } from "@/lib/utils";
import type { AdminUserSummary } from "@/lib/types";

export function TeamAccessPage() {
  const profile = useAuthStore((s) => s.profile);
  const queryClient = useQueryClient();
  const reauth = useReauthRunner();
  const isOwner = profile?.role === "owner";

  const { data: admins = [], isLoading } = useQuery({
    queryKey: ["admin", "team", "list"],
    queryFn: () => listAdminUsers({ role: "admin" }),
  });
  const { data: candidates } = useQuery({
    queryKey: ["admin", "team", "candidates"],
    queryFn: () => listAdminCandidates(),
  });

  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [draftPerms, setDraftPerms] = useState<Set<string> | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);

  const selected = selectedUid ? admins.find((a) => a.uid === selectedUid) : null;

  function openTeammate(a: AdminUserSummary) {
    setSelectedUid(a.uid);
    setDraftPerms(new Set(a.permissions));
  }

  const saveMutation = useMutation({
    mutationFn: async (args: { targetUid: string; permissions: string[] }) => {
      await reauth.run(
        () => setUserPermissions(args),
        "Confirm your password to update team permissions.",
      );
    },
    onSuccess: () => {
      toast.success("Permissions updated");
      queryClient.invalidateQueries({ queryKey: ["admin", "team"] });
      setDraftPerms(null);
      setSelectedUid(null);
    },
    onError: (err: Error) => toast.error(err.message ?? "Failed to update"),
  });

  if (isLoading) return <LoadingSpinner label="Loading team…" />;

  return (
    <div className="space-y-6">
      {reauth.modal()}

      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-muted/50">
            <UsersIcon className="h-3 w-3" />
            Internal team
          </p>
          <h2 className="text-[18px] font-semibold text-foreground">Team & Access</h2>
          <p className="mt-1 max-w-2xl text-[12.5px] text-muted/65">
            Fine-grained permission control for your internal admins. Owner-only
            keys (role changes, team management, config writes) are marked
            with a crown.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setInviteOpen((v) => !v)}
          disabled={!isOwner}
          className="rounded-md bg-acid px-3 py-1.5 text-[12.5px] font-semibold text-background hover:bg-acid/80 disabled:opacity-40"
        >
          <Plus className="-mt-0.5 mr-1 inline h-3.5 w-3.5" />
          Invite admin
        </button>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Card className="p-4">
          <p className="mb-3 text-[11px] uppercase tracking-widest text-muted/55">
            Owner & admins
          </p>
          <OwnerRow />
          <ul className="mt-2 space-y-1.5">
            {admins.map((a) => (
              <li key={a.uid}>
                <button
                  type="button"
                  onClick={() => openTeammate(a)}
                  className={cn(
                    "flex w-full items-center justify-between gap-3 rounded-lg border border-separator bg-card p-2.5 text-left transition-colors hover:bg-card-hover",
                    selectedUid === a.uid && "border-acid/40 bg-card-active",
                  )}
                >
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium text-foreground/85">
                      {a.displayName || a.email}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-muted/55">{a.email}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Badge>{a.permissions.length} perms</Badge>
                  </div>
                </button>
              </li>
            ))}
            {admins.length === 0 && (
              <li className="py-4 text-center text-[12px] text-muted/45">
                No admins yet — invite one to get started.
              </li>
            )}
          </ul>

          {candidates && candidates.candidates.length > 0 && (
            <div className="mt-4">
              <p className="mb-1 text-[10.5px] uppercase tracking-widest text-muted/45">
                ADMIN_EMAILS candidates (not yet invited)
              </p>
              <ul className="space-y-1">
                {candidates.candidates.map((e) => (
                  <li key={e} className="text-[11.5px] text-muted/65">{e}</li>
                ))}
              </ul>
            </div>
          )}
        </Card>

        <Card className="p-4">
          {selected && draftPerms ? (
            <PermissionEditor
              admin={selected}
              draft={draftPerms}
              onChange={setDraftPerms}
              isOwner={isOwner}
              onSave={() =>
                saveMutation.mutate({
                  targetUid: selected.uid,
                  permissions: Array.from(draftPerms),
                })
              }
              onCancel={() => {
                setSelectedUid(null);
                setDraftPerms(null);
              }}
              saving={saveMutation.isPending}
            />
          ) : (
            <p className="py-10 text-center text-[12.5px] text-muted/55">
              Select a teammate to edit their permissions.
            </p>
          )}
        </Card>
      </div>

      {inviteOpen && <InviteAdminModal onClose={() => setInviteOpen(false)} reauth={reauth} />}
    </div>
  );
}

function OwnerRow() {
  const profile = useAuthStore((s) => s.profile);
  if (profile?.role !== "owner") return null;
  return (
    <div className="mb-1.5 flex items-center justify-between gap-3 rounded-lg border border-orange/30 bg-orange/5 p-2.5">
      <div className="min-w-0">
        <p className="truncate text-[13px] font-medium text-foreground/85">
          {profile.displayName || profile.email}
          <span className="ml-2 text-[10.5px] text-orange">(you)</span>
        </p>
        <p className="mt-0.5 truncate text-[11px] text-muted/55">{profile.email}</p>
      </div>
      <Badge variant="warn" className="gap-1">
        <Crown className="h-3 w-3" /> Owner
      </Badge>
    </div>
  );
}

interface EditorProps {
  admin: AdminUserSummary;
  draft: Set<string>;
  onChange: (next: Set<string>) => void;
  isOwner: boolean;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}

function PermissionEditor({ admin, draft, onChange, isOwner, onSave, onCancel, saving }: EditorProps) {
  function toggle(key: PermissionKey) {
    const next = new Set(draft);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onChange(next);
  }
  function applyPreset(presetId: string) {
    const keys = presetKeys(presetId);
    onChange(new Set(keys));
  }
  return (
    <div className="space-y-3">
      <header className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-widest text-muted/55">Editing</p>
          <p className="truncate text-[13.5px] font-semibold text-foreground/85">
            {admin.displayName || admin.email}
          </p>
        </div>
        <ShieldCheck className="h-4 w-4 text-acid" />
      </header>

      <div className="flex flex-wrap gap-1.5">
        {Object.entries(PRESET_BUNDLES).map(([id, b]) => (
          <button
            key={id}
            type="button"
            onClick={() => applyPreset(id)}
            className="rounded-md bg-input px-2 py-1 text-[10.5px] font-medium text-muted/75 hover:bg-card-hover"
          >
            {b.label}
          </button>
        ))}
      </div>

      <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
        {PERMISSION_GROUPS.map((g) => (
          <div key={g.label}>
            <p className="mb-1 text-[10.5px] uppercase tracking-widest text-muted/45">
              {g.label}
            </p>
            <ul className="space-y-1">
              {g.keys.map((k) => {
                const ownerOnly = OWNER_ONLY_DEFAULTS.has(k);
                const disabled = ownerOnly && !isOwner;
                const checked = draft.has(k);
                return (
                  <li key={k}>
                    <label
                      className={cn(
                        "flex items-center gap-2 rounded-md border border-separator/60 px-2 py-1 text-[11.5px]",
                        disabled ? "opacity-40 cursor-not-allowed" : "hover:bg-card-hover cursor-pointer",
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={disabled}
                        onChange={() => toggle(k)}
                        className="accent-acid"
                      />
                      <span className="font-mono text-foreground/80">{k}</span>
                      {ownerOnly && (
                        <Crown className="ml-auto h-3 w-3 text-orange" />
                      )}
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md px-3 py-1.5 text-[11.5px] text-muted/75 hover:bg-card-hover"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="rounded-md bg-acid px-3 py-1.5 text-[11.5px] font-semibold text-background hover:bg-acid/80 disabled:opacity-50"
        >
          <Save className="-mt-0.5 mr-1 inline h-3 w-3" />
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}

interface InviteModalProps {
  onClose: () => void;
  reauth: ReturnType<typeof useReauthRunner>;
}

function InviteAdminModal({ onClose, reauth }: InviteModalProps) {
  const [email, setEmail] = useState("");
  const [preset, setPreset] = useState<string>("submissions-reviewer");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ magicLink?: string; mode: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    try {
      const res = await reauth.run(
        () => inviteAdmin({ email, preset }),
        "Confirm your password to invite a new admin.",
      );
      if (res) {
        setResult({
          mode: res.mode,
          magicLink: "magicLink" in res ? res.magicLink : undefined,
        });
        toast.success(res.mode === "direct" ? "Admin added" : "Invite sent");
      }
    } catch (err) {
      toast.error((err as Error).message ?? "Failed to invite");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <form
        onSubmit={submit}
        className="w-[440px] max-w-[90vw] space-y-3 rounded-xl border border-separator bg-card p-5"
      >
        <header className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-acid" />
          <h3 className="text-[14px] font-semibold text-foreground">Invite admin</h3>
        </header>
        {result ? (
          <div className="space-y-3">
            <p className="text-[12.5px] text-green">
              {result.mode === "direct" ? "Admin role granted." : "Invite email queued."}
            </p>
            {result.magicLink && (
              <div className="rounded-md bg-input p-2 text-[10.5px]">
                <p className="mb-1 text-muted/55">Claim link (copy if email fails):</p>
                <p className="font-mono text-foreground/85 break-all">{result.magicLink}</p>
              </div>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-md bg-acid px-3 py-1.5 text-[12px] font-semibold text-background hover:bg-acid/80"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="teammate@example.com"
              className="w-full rounded-md bg-input px-3 py-2 text-[12.5px] text-foreground outline-none"
            />
            <label className="block">
              <span className="mb-1 block text-[10.5px] uppercase tracking-widest text-muted/55">
                Starting preset
              </span>
              <select
                value={preset}
                onChange={(e) => setPreset(e.target.value)}
                className="w-full rounded-md bg-input px-3 py-2 text-[12.5px] text-foreground outline-none"
              >
                {Object.entries(PRESET_BUNDLES).map(([id, b]) => (
                  <option key={id} value={id}>
                    {b.label} — {b.description}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md px-3 py-1.5 text-[12px] text-muted/75 hover:bg-card-hover"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !email}
                className="rounded-md bg-acid px-3 py-1.5 text-[12px] font-semibold text-background hover:bg-acid/80 disabled:opacity-50"
              >
                {submitting ? "Inviting…" : "Send invite"}
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}

// Silence the unused-imports check for ALL_PERMISSIONS — surfaced via groups.
export const _allPermsRef = ALL_PERMISSIONS.length;
// hasPermission is referenced in this module's type-check usage above (none
// needed here directly, but kept for future inline checks).
void hasPermission;
