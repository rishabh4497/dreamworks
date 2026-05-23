import { CheckCircle2, XCircle } from "lucide-react";
import type { App, AppBuild } from "@/lib/types";

export interface PreflightGate {
  label: string;
  ok: boolean;
  hint?: string;
}

export function computePreflightGates(app: App, builds?: AppBuild[]): PreflightGate[] {
  const defaultBranch = app.branches?.find((b) => b.name === "default");
  const liveBuild = defaultBranch?.liveBuildId
    ? (builds ?? []).find((b) => b.id === defaultBranch.liveBuildId)
    : undefined;
  return [
    { label: "Game title set", ok: app.gameTitle.trim().length > 0 },
    { label: "Short description filled", ok: app.shortDescription.trim().length > 0 },
    {
      label: "At least 3 screenshots",
      ok: (app.screenshots?.length ?? 0) >= 3,
      hint: `${app.screenshots?.length ?? 0} so far`,
    },
    { label: "At least 1 trailer", ok: (app.trailers?.length ?? 0) >= 1 },
    { label: "Capsule art attached", ok: Boolean(app.capsuleUrl) },
    { label: "Header art attached", ok: Boolean(app.headerUrl) },
    {
      label: "Default branch has a live build",
      ok: Boolean(liveBuild),
      hint: liveBuild ? `live: ${liveBuild.buildLabel}` : "set in Builds & Branches",
    },
    { label: "Base price set (or marked free)", ok: app.basePriceCents >= 0 },
  ];
}

export function PreflightChecklist({ gates }: { gates: PreflightGate[] }) {
  return (
    <ul className="space-y-1.5">
      {gates.map((g) => (
        <li
          key={g.label}
          className="flex items-center gap-2 rounded-lg bg-card-active/45 px-3 py-2 text-[13px]"
        >
          {g.ok ? (
            <CheckCircle2 className="h-4 w-4 text-green" />
          ) : (
            <XCircle className="h-4 w-4 text-red" />
          )}
          <span className={g.ok ? "text-foreground" : "text-foreground/75"}>{g.label}</span>
          {g.hint && <span className="text-[11px] text-muted/60">— {g.hint}</span>}
        </li>
      ))}
    </ul>
  );
}
