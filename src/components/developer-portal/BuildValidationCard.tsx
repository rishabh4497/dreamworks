import {
  AlertTriangle,
  CheckCircle2,
  CircleSlash,
  Loader2,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { BuildValidation, BuildValidationCheck, ValidationStatus } from "@/lib/types";

interface Props {
  validation: BuildValidation | null;
  isRunning?: boolean;
  error?: string | null;
}

export function BuildValidationCard({ validation, isRunning, error }: Props) {
  if (isRunning) {
    return (
      <Card className="flex items-center gap-3 p-4 text-[12.5px] text-muted/75">
        <Loader2 className="h-4 w-4 animate-spin text-muted/60" />
        Validating build…
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="flex items-center gap-3 p-4 text-[12.5px] text-red">
        <XCircle className="h-4 w-4" />
        {error}
      </Card>
    );
  }

  if (!validation) {
    return (
      <Card className="flex items-center gap-3 p-4 text-[12.5px] text-muted/70">
        <ShieldCheck className="h-4 w-4 text-muted/50" />
        Attach a build archive to run SDK validation.
      </Card>
    );
  }

  return (
    <Card className="space-y-2 p-4">
      <Row label="Manifest" check={validation.manifest} />
      <Row label="Binary" check={validation.binary} />
      <Row label="Runtime handshake" check={validation.handshake} />
      <p className="pt-1 text-[11px] text-muted/55">
        Checked {new Date(validation.checkedAt).toLocaleTimeString()} via{" "}
        {validation.source === "tauri"
          ? "desktop agent"
          : validation.source === "cloud"
            ? "cloud function"
            : "browser"}
        .
      </p>
    </Card>
  );
}

function Row({ label, check }: { label: string; check: BuildValidationCheck }) {
  const { icon, tone } = statusVisuals(check.status);
  return (
    <div className="rounded-lg bg-card-active/45 px-3 py-2">
      <div className="flex items-start gap-2 text-[12.5px]">
        <span className={cn("mt-0.5 flex h-4 w-4 items-center justify-center", tone)}>
          {icon}
        </span>
        <div className="flex-1">
          <div className="flex items-center gap-2 font-semibold text-foreground">
            {label}
          </div>
          <div className="text-[11.5px] text-foreground/75">{check.message}</div>
          {check.details?.map((d) => (
            <div key={d} className="text-[11px] text-muted/55">
              · {d}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function statusVisuals(status: ValidationStatus) {
  switch (status) {
    case "pass":
      return { icon: <CheckCircle2 className="h-4 w-4" />, tone: "text-green" };
    case "fail":
      return { icon: <XCircle className="h-4 w-4" />, tone: "text-red" };
    case "warn":
      return { icon: <AlertTriangle className="h-4 w-4" />, tone: "text-acid" };
    case "pending":
      return { icon: <Loader2 className="h-4 w-4 animate-spin" />, tone: "text-muted/60" };
    case "skipped":
      return { icon: <CircleSlash className="h-4 w-4" />, tone: "text-muted/40" };
  }
}
