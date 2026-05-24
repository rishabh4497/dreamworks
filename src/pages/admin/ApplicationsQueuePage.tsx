import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Briefcase, Building, Check, Inbox, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import {
  approveCreatorApplication,
  rejectCreatorApplication,
} from "@/lib/api/admin";
import { listPendingApplications } from "@/lib/api/creator-applications";
import { toast } from "@/stores/toast-store";
import { formatDate } from "@/lib/utils";
import type { CreatorApplication } from "@/lib/types";

export function ApplicationsQueuePage() {
  const queryClient = useQueryClient();
  const { data: apps = [], isLoading } = useQuery({
    queryKey: ["admin", "creator-applications"],
    queryFn: () => listPendingApplications(),
  });
  const [selected, setSelected] = useState<string | null>(null);
  const active = apps.find((a) => a.id === selected) ?? apps[0];

  const approve = useMutation({
    mutationFn: async (id: string) => approveCreatorApplication({ applicationId: id }),
    onSuccess: () => {
      toast.success("Application approved");
      queryClient.invalidateQueries({ queryKey: ["admin", "creator-applications"] });
      setSelected(null);
    },
    onError: (err: Error) => toast.error(err.message ?? "Failed to approve"),
  });

  const reject = useMutation({
    mutationFn: async (args: { id: string; reason: string }) =>
      rejectCreatorApplication({ applicationId: args.id, reason: args.reason }),
    onSuccess: () => {
      toast.success("Application rejected");
      queryClient.invalidateQueries({ queryKey: ["admin", "creator-applications"] });
      setSelected(null);
    },
    onError: (err: Error) => toast.error(err.message ?? "Failed to reject"),
  });

  if (isLoading) return <LoadingSpinner label="Loading applications…" />;

  return (
    <div className="space-y-6">
      <header>
        <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-muted/50">
          <Inbox className="h-3 w-3" />
          Creator queue
        </p>
        <h2 className="text-[18px] font-semibold text-foreground">
          Pending applications ({apps.length})
        </h2>
        <p className="mt-1 max-w-2xl text-[12.5px] text-muted/65">
          Users who applied to sell on Dreamworks. Approve to create the
          developer/publisher entity and flip their role.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <Card className="p-2">
          <ul className="space-y-1">
            {apps.map((a) => (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => setSelected(a.id)}
                  className={`flex w-full items-start justify-between gap-2 rounded-md px-2 py-2 text-left hover:bg-card-hover ${
                    (selected ?? apps[0]?.id) === a.id ? "bg-card-active" : ""
                  }`}
                >
                  <div className="min-w-0">
                    <p className="truncate text-[12.5px] font-medium text-foreground/85">
                      {a.brand?.name ?? "Unnamed"}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-muted/55">
                      {a.submitterEmail}
                    </p>
                  </div>
                  <Badge variant={a.kind === "developer" ? "default" : "new"}>
                    {a.kind === "developer" ? (
                      <Building className="-mt-0.5 mr-0.5 inline h-2.5 w-2.5" />
                    ) : (
                      <Briefcase className="-mt-0.5 mr-0.5 inline h-2.5 w-2.5" />
                    )}
                    {a.kind}
                  </Badge>
                </button>
              </li>
            ))}
            {apps.length === 0 && (
              <li className="py-4 text-center text-[12px] text-muted/45">
                No pending applications.
              </li>
            )}
          </ul>
        </Card>

        <Card className="p-4">
          {active ? (
            <ApplicationDetail
              app={active}
              onApprove={() => approve.mutate(active.id)}
              onReject={(reason) => reject.mutate({ id: active.id, reason })}
              busy={approve.isPending || reject.isPending}
            />
          ) : (
            <p className="py-8 text-center text-[12.5px] text-muted/55">Pick an application.</p>
          )}
        </Card>
      </div>
    </div>
  );
}

interface DetailProps {
  app: CreatorApplication;
  onApprove: () => void;
  onReject: (reason: string) => void;
  busy: boolean;
}

function ApplicationDetail({ app, onApprove, onReject, busy }: DetailProps) {
  const [rejectReason, setRejectReason] = useState("");
  const [rejectOpen, setRejectOpen] = useState(false);
  return (
    <div className="space-y-4">
      <header>
        <div className="flex items-center gap-2">
          <Badge variant={app.kind === "developer" ? "default" : "new"}>{app.kind}</Badge>
          <Badge>{app.status}</Badge>
        </div>
        <h3 className="mt-2 text-[16px] font-semibold text-foreground">
          {app.brand?.name}
        </h3>
        <p className="mt-1 text-[12px] text-muted/65">{app.brand?.tagline}</p>
        <p className="mt-1 text-[11px] text-muted/55">
          From {app.submitterEmail} · submitted {formatDate(app.submittedAt)}
        </p>
      </header>

      <section>
        <p className="mb-1 text-[10.5px] uppercase tracking-widest text-muted/55">Pitch</p>
        <p className="rounded-md bg-input p-3 text-[12.5px] text-foreground/85 whitespace-pre-line">
          {app.pitch}
        </p>
      </section>

      {app.links.length > 0 && (
        <section>
          <p className="mb-1 text-[10.5px] uppercase tracking-widest text-muted/55">Links</p>
          <ul className="space-y-1 text-[12px]">
            {app.links.map((l) => (
              <li key={l}>
                <a
                  href={l}
                  target="_blank"
                  rel="noreferrer"
                  className="text-acid hover:underline break-all"
                >
                  {l}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-md bg-input p-3 space-y-2">
        <p className="text-[10.5px] uppercase tracking-widest text-muted/55">Brand summary</p>
        <ul className="space-y-1 text-[12px] text-foreground/85">
          <li>Logo: <span className="break-all text-muted/65">{app.brand?.logoUrl}</span></li>
          <li>Color: <span style={{ color: app.brand?.brandColor }}>{app.brand?.brandColor}</span></li>
          {app.brand?.websiteUrl && (
            <li>Website: <a href={app.brand.websiteUrl} target="_blank" rel="noreferrer" className="text-acid break-all hover:underline">{app.brand.websiteUrl}</a></li>
          )}
        </ul>
      </section>

      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={() => setRejectOpen((v) => !v)}
          className="rounded-md bg-red/10 px-3 py-1.5 text-[12px] font-semibold text-red hover:bg-red/20"
        >
          <X className="-mt-0.5 mr-1 inline h-3.5 w-3.5" />
          Reject
        </button>
        <button
          type="button"
          onClick={onApprove}
          disabled={busy}
          className="rounded-md bg-green px-3 py-1.5 text-[12px] font-semibold text-background hover:bg-green/80 disabled:opacity-50"
        >
          <Check className="-mt-0.5 mr-1 inline h-3.5 w-3.5" />
          Approve & onboard
        </button>
      </div>

      {rejectOpen && (
        <div className="space-y-2 rounded-md border border-red/30 bg-red/5 p-3">
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Reason (shared with applicant)"
            rows={3}
            className="w-full rounded-md bg-input px-3 py-2 text-[12px] text-foreground outline-none"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setRejectOpen(false)}
              className="rounded-md px-3 py-1.5 text-[11.5px] text-muted/75 hover:bg-card-hover"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                if (rejectReason.length < 5) {
                  toast.error("Reason too short.");
                  return;
                }
                onReject(rejectReason);
              }}
              disabled={busy}
              className="rounded-md bg-red px-3 py-1.5 text-[11.5px] font-semibold text-background hover:bg-red/80 disabled:opacity-50"
            >
              Confirm reject
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
