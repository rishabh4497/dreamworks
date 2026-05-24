import { Send, Sparkles, UserPlus, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ConsoleKpiTile } from "@/components/console/ConsoleKpiTile";
import type { ReferralReport } from "@/lib/types";

interface Props {
  report: ReferralReport;
}

export function ConsoleReferralCard({ report }: Props) {
  const kTone = report.kFactor >= 1 ? "positive" : report.kFactor >= 0.5 ? "default" : "warn";
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <ConsoleKpiTile icon={Send} label="Invites sent" value={report.totalInvitesSent.toLocaleString()} />
        <ConsoleKpiTile
          icon={UserPlus}
          label="Accepted"
          value={report.totalInvitesAccepted.toLocaleString()}
          hint={`${report.acceptedPct.toFixed(1)}%`}
          tone="positive"
        />
        <ConsoleKpiTile
          icon={Sparkles}
          label="k-factor"
          value={report.kFactor.toFixed(2)}
          tone={kTone}
        />
        <ConsoleKpiTile
          icon={Users}
          label="Invites / inviter"
          value={report.invitesPerInviter.toFixed(1)}
        />
      </div>
      <Card className="p-4">
        <p className="mb-2 text-[11px] uppercase tracking-widest text-muted/55">Top inviters</p>
        {report.topInviters.length === 0 ? (
          <p className="py-6 text-center text-[12px] text-muted/55">No referrals yet.</p>
        ) : (
          <ul className="space-y-1.5 text-[12px]">
            {report.topInviters.map((i) => (
              <li key={i.uid} className="flex items-center justify-between">
                <span className="font-mono text-[11px] text-foreground/85">{i.displayName}</span>
                <span className="tabular-nums text-muted/70">
                  {i.invitesSent} sent · {i.invitesAccepted} accepted
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
