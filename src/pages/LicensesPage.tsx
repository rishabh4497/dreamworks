import { useMemo } from "react";
import { Cpu, KeyRound, ShieldCheck, ShieldX, XCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/EmptyState";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import {
  useDeactivateLicense,
  useUserLicenses,
} from "@/hooks/use-drm";
import { useAuthStore } from "@/stores/auth-store";
import { cn, formatDate } from "@/lib/utils";
import type { DrmLicense, DrmLicenseStatus } from "@/lib/types";

const STATUS_STYLES: Record<DrmLicenseStatus, string> = {
  active: "bg-green/15 text-green",
  revoked: "bg-red/15 text-red",
  expired: "bg-orange/15 text-orange",
  pending: "bg-muted/15 text-muted",
};

const STATUS_LABELS: Record<DrmLicenseStatus, string> = {
  active: "Active",
  revoked: "Revoked",
  expired: "Expired",
  pending: "Pending activation",
};

function maskKey(key: string): string {
  if (key.length < 8) return key;
  const tail = key.slice(-4);
  return `••••-••••-••••-${tail}`;
}

function LicenseRow({ license }: { license: DrmLicense }) {
  const uid = useAuthStore((s) => s.profile?.uid);
  const deactivate = useDeactivateLicense(uid);

  return (
    <Card className="space-y-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-[14px] font-semibold text-foreground">{license.gameId}</p>
          <p className="font-mono text-[12px] text-muted/80">{maskKey(license.key)}</p>
        </div>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[11px] font-semibold",
            STATUS_STYLES[license.status],
          )}
        >
          {STATUS_LABELS[license.status]}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-[12px] text-muted/80 sm:grid-cols-4">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted/55">Issued</p>
          <p className="mt-0.5 text-foreground/85">{formatDate(license.issuedAt)}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted/55">Expires</p>
          <p className="mt-0.5 text-foreground/85">
            {license.expiresAt ? formatDate(license.expiresAt) : "Perpetual"}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted/55">Activations</p>
          <p className="mt-0.5 text-foreground/85">
            {license.activations.length} / {license.maxActivations}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted/55">Last seen</p>
          <p className="mt-0.5 text-foreground/85">
            {license.activations.length
              ? formatDate(
                  license.activations
                    .map((a) => a.lastSeenAt)
                    .sort()
                    .at(-1)!,
                )
              : "—"}
          </p>
        </div>
      </div>

      {license.activations.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted/55">
            Activated devices
          </p>
          <div className="space-y-1.5">
            {license.activations.map((fp) => (
              <div
                key={fp.hash}
                className="flex items-center justify-between rounded-lg border border-separator/60 bg-card-active/40 px-3 py-2"
              >
                <div className="flex items-center gap-2.5">
                  <Cpu className="h-3.5 w-3.5 text-muted/70" />
                  <div>
                    <p className="text-[12px] font-semibold text-foreground/85">{fp.hostname}</p>
                    <p className="font-mono text-[10px] text-muted/60">
                      {fp.os} · {fp.hash.slice(0, 12)}…
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={deactivate.isPending}
                  onClick={() => deactivate.mutate({ licenseId: license.id, hash: fp.hash })}
                >
                  <XCircle className="h-3.5 w-3.5" />
                  Deactivate
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

export function LicensesPage() {
  const uid = useAuthStore((s) => s.profile?.uid);
  const { data: licenses, isLoading } = useUserLicenses(uid);

  const summary = useMemo(() => {
    const list = licenses ?? [];
    return {
      total: list.length,
      active: list.filter((l) => l.status === "active").length,
      activatedDevices: list.reduce((acc, l) => acc + l.activations.length, 0),
    };
  }, [licenses]);

  if (isLoading) return <LoadingSpinner />;

  if (!licenses || licenses.length === 0) {
    return (
      <div className="space-y-6">
        <header className="space-y-1">
          <h1 className="text-[20px] font-semibold text-foreground">Licenses</h1>
          <p className="text-[13px] text-muted/80">
            DRM licenses for games you own, with per-device activation tracking.
          </p>
        </header>
        <EmptyState
          icon={KeyRound}
          title="No licenses yet"
          description="Licenses are issued when you purchase or redeem a game key."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-[20px] font-semibold text-foreground">Licenses</h1>
        <p className="text-[13px] text-muted/80">
          DRM licenses for games you own, with per-device activation tracking.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="flex items-center gap-3 p-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-acid/10 text-acid">
            <KeyRound className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted/55">Total licenses</p>
            <p className="mt-0.5 text-[18px] font-semibold tabular-nums text-foreground">{summary.total}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3 p-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green/10 text-green">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted/55">Active</p>
            <p className="mt-0.5 text-[18px] font-semibold tabular-nums text-foreground">{summary.active}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3 p-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-positive/10 text-positive">
            <Cpu className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted/55">Activated devices</p>
            <p className="mt-0.5 text-[18px] font-semibold tabular-nums text-foreground">
              {summary.activatedDevices}
            </p>
          </div>
        </Card>
      </div>

      <section className="space-y-3">
        {licenses.map((license) => (
          <LicenseRow key={license.id} license={license} />
        ))}
      </section>

      <Card className="flex items-start gap-3 border-orange/40 bg-orange/5 p-4 text-[12px] text-foreground/85">
        <ShieldX className="mt-0.5 h-4 w-4 shrink-0 text-orange" />
        <div>
          <p className="font-semibold">License verification on launch</p>
          <p className="mt-1 text-muted/80">
            On desktop, each launch verifies the device fingerprint against the license&apos;s
            activation list before starting the game. Web does not verify locally — it relies on
            the cloud-stored activations as the source of truth.
          </p>
        </div>
      </Card>
    </div>
  );
}
