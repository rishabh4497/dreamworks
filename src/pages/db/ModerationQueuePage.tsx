import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  Ban,
  CheckCircle2,
  EyeOff,
  Flag,
  History,
  MessageSquareWarning,
  ShieldAlert,
  ShieldCheck,
  UserRoundX,
} from "lucide-react";
import {
  decideModerationQueueRecord,
  listModerationQueueRecords,
  saveModerationNotes,
  type ModerationDecision,
  type ModerationQueueRecord,
} from "@/lib/api/moderation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type StatusFilter = "active" | "all" | ModerationQueueRecord["status"];

const DECISIONS: { value: ModerationDecision; label: string; icon: typeof CheckCircle2 }[] = [
  { value: "dismiss", label: "Dismiss", icon: CheckCircle2 },
  { value: "hide", label: "Hide", icon: EyeOff },
  { value: "warn", label: "Warn", icon: MessageSquareWarning },
  { value: "ban", label: "Ban", icon: Ban },
];

export function ModerationQueuePage() {
  const [records, setRecords] = useState<ModerationQueueRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let mounted = true;
    listModerationQueueRecords().then((next) => {
      if (!mounted) return;
      setRecords(next);
      setSelectedId(next[0]?.id ?? "");
      setNotes(next[0]?.notes ?? "");
    });
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(
    () =>
      records.filter((record) => {
        if (statusFilter === "all") return true;
        if (statusFilter === "active") return record.status === "open" || record.status === "triaged";
        return record.status === statusFilter;
      }),
    [records, statusFilter],
  );

  const selected = records.find((record) => record.id === selectedId) ?? filtered[0];
  const activeCount = records.filter((record) => record.status === "open" || record.status === "triaged").length;
  const actionedCount = records.filter((record) => record.status === "actioned").length;
  const highRiskCount = records.filter((record) => record.priorReports >= 5 || record.authorTrust === "restricted").length;

  useEffect(() => {
    if (selected) setNotes(selected.notes ?? "");
  }, [selected?.id]);

  const replaceRecord = (next: ModerationQueueRecord | null) => {
    if (!next) return;
    setRecords((current) => current.map((record) => (record.id === next.id ? next : record)));
  };

  const decide = async (decision: ModerationDecision) => {
    if (!selected) return;
    setBusy(true);
    const next = await decideModerationQueueRecord({
      id: selected.id,
      moderatorId: "mod-current",
      decision,
      notes,
    });
    replaceRecord(next);
    setBusy(false);
  };

  const saveNotes = async () => {
    if (!selected) return;
    setBusy(true);
    const next = await saveModerationNotes({
      id: selected.id,
      moderatorId: "mod-current",
      notes,
    });
    replaceRecord(next);
    setBusy(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-muted/50">
            <ShieldAlert className="h-3 w-3" />
            Dreamworks DB
          </p>
          <h1 className="text-[24px] font-semibold tracking-tight text-foreground">
            Moderation Queue
          </h1>
          <p className="mt-1 max-w-3xl text-[13px] leading-relaxed text-muted/65">
            Review reported reviews, posts, workshop items, and profiles with ownership and trust
            signals before taking action.
          </p>
        </div>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
          className="h-9 rounded-xl border border-separator bg-input px-3 text-[13px] text-foreground focus:outline-none"
        >
          <option value="active">Active queue</option>
          <option value="all">All reports</option>
          <option value="open">Open</option>
          <option value="triaged">Triaged</option>
          <option value="actioned">Actioned</option>
          <option value="dismissed">Dismissed</option>
        </select>
      </header>

      <section className="grid gap-3 md:grid-cols-3">
        <Metric icon={Flag} label="Active" value={activeCount.toString()} />
        <Metric icon={UserRoundX} label="High Risk" value={highRiskCount.toString()} />
        <Metric icon={ShieldCheck} label="Actioned" value={actionedCount.toString()} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(320px,420px)_minmax(0,1fr)]">
        <div className="space-y-3">
          {filtered.map((record) => (
            <button
              key={record.id}
              type="button"
              onClick={() => setSelectedId(record.id)}
              className={`w-full text-left transition-colors ${
                selected?.id === record.id ? "rounded-xl outline outline-1 outline-acid/35" : ""
              }`}
            >
              <ReportCard record={record} />
            </button>
          ))}
          {filtered.length === 0 && (
            <Card className="p-8 text-center text-[13px] text-muted/65">
              No reports match this filter.
            </Card>
          )}
        </div>

        {selected ? (
          <Card className="p-5">
            <div className="flex flex-col gap-3 border-b border-separator pb-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="mb-2 flex flex-wrap items-center gap-1.5">
                  <Badge variant={statusVariant(selected.status)}>{selected.status}</Badge>
                  <Badge variant={trustVariant(selected.authorTrust)}>{selected.authorTrust}</Badge>
                  {selected.verifiedOwner && <Badge variant="free">Verified owner</Badge>}
                </div>
                <h2 className="text-[18px] font-semibold text-foreground">{selected.targetTitle}</h2>
                <p className="mt-1 text-[12px] text-muted/60">
                  {selected.targetType} / {selected.targetId} / reported by {selected.reporterUserId}
                </p>
              </div>
              <p className="text-[11px] text-muted/55">{selected.createdAt}</p>
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
              <div className="space-y-4">
                <section>
                  <h3 className="text-[12px] font-semibold uppercase tracking-widest text-muted/50">
                    Reported Content
                  </h3>
                  <p className="mt-2 rounded-xl bg-card-active/45 p-3 text-[13px] leading-relaxed text-foreground/80">
                    {selected.targetExcerpt}
                  </p>
                </section>

                <section>
                  <h3 className="text-[12px] font-semibold uppercase tracking-widest text-muted/50">
                    Moderator Notes
                  </h3>
                  <textarea
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    className="mt-2 min-h-28 w-full rounded-xl border border-separator bg-input px-3.5 py-2 text-[13px] text-foreground placeholder:text-muted/40 focus:border-acid/30 focus:outline-none focus:ring-1 focus:ring-acid/15"
                    placeholder="Add context, policy references, or appeal notes."
                  />
                  <Button variant="secondary" size="sm" className="mt-2" onClick={saveNotes} disabled={busy}>
                    Save Notes
                  </Button>
                </section>

                <section>
                  <h3 className="mb-2 flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-widest text-muted/50">
                    <History className="h-3.5 w-3.5" />
                    History
                  </h3>
                  <div className="space-y-2">
                    {selected.history.map((entry) => (
                      <div key={`${entry.at}-${entry.action}`} className="rounded-lg bg-card-active/40 p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-[12px] font-semibold text-foreground">{entry.action}</p>
                          <p className="text-[10px] text-muted/55">{entry.at}</p>
                        </div>
                        <p className="mt-1 text-[11px] text-muted/65">{entry.actor}</p>
                        {entry.note && <p className="mt-1 text-[12px] text-foreground/70">{entry.note}</p>}
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <aside className="space-y-4">
                <div className="rounded-xl bg-card-active/45 p-3">
                  <h3 className="text-[12px] font-semibold uppercase tracking-widest text-muted/50">
                    Trust Signals
                  </h3>
                  <div className="mt-3 space-y-2">
                    <Signal label="Author" value={selected.authorName} />
                    <Signal label="Account age" value={`${selected.accountAgeDays} days`} />
                    <Signal label="Prior reports" value={selected.priorReports.toString()} />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {selected.trustSignals.map((signal) => (
                      <Badge key={signal}>{signal}</Badge>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl bg-card-active/45 p-3">
                  <h3 className="text-[12px] font-semibold uppercase tracking-widest text-muted/50">
                    Decision
                  </h3>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {DECISIONS.map((decision) => (
                      <Button
                        key={decision.value}
                        variant={decision.value === "ban" ? "danger" : "secondary"}
                        size="sm"
                        onClick={() => decide(decision.value)}
                        disabled={busy}
                      >
                        <decision.icon className="h-3.5 w-3.5" />
                        {decision.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </aside>
            </div>
          </Card>
        ) : (
          <Card className="p-8 text-center text-[13px] text-muted/65">
            Select a report to review.
          </Card>
        )}
      </section>
    </motion.div>
  );
}

function ReportCard({ record }: { record: ModerationQueueRecord }) {
  return (
    <Card className="p-4 hover:bg-card-hover">
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        <Badge variant={statusVariant(record.status)}>{record.status}</Badge>
        <Badge variant={record.priorReports >= 5 ? "warn" : "default"}>
          {record.priorReports} reports
        </Badge>
        {record.verifiedOwner && <Badge variant="free">Owner</Badge>}
      </div>
      <h2 className="text-[14px] font-semibold text-foreground">{record.targetTitle}</h2>
      <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-muted/65">{record.reason}</p>
      <div className="mt-3 flex items-center justify-between gap-2 text-[11px] text-muted/55">
        <span>{record.authorName}</span>
        <span>{record.createdAt}</span>
      </div>
    </Card>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Flag;
  label: string;
  value: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted/55">{label}</p>
          <p className="mt-1 text-[22px] font-semibold tabular-nums text-foreground">{value}</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-acid/10 text-acid">
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </Card>
  );
}

function Signal({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-[12px]">
      <span className="text-muted/60">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

function statusVariant(status: ModerationQueueRecord["status"]): "default" | "free" | "soon" | "warn" {
  if (status === "actioned") return "free";
  if (status === "triaged") return "soon";
  if (status === "dismissed") return "default";
  return "warn";
}

function trustVariant(trust: ModerationQueueRecord["authorTrust"]): "default" | "free" | "soon" | "warn" {
  if (trust === "trusted") return "free";
  if (trust === "mixed") return "soon";
  if (trust === "restricted") return "warn";
  return "default";
}
