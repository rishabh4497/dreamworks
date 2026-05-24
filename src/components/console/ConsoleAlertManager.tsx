import { useState } from "react";
import { AlertCircle, Bell, Check, Plus, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/stores/auth-store";
import {
  useAckAlert,
  useAlertRules,
  useCreateAlertRule,
  useDeleteAlertRule,
  useEvaluateAlerts,
  useLiveAlertEvents,
  useResolveAlert,
  useUpdateAlertRule,
} from "@/hooks/use-console-advanced";
import type { AlertMetric, AlertOp, AlertRule, AlertSeverity } from "@/lib/types";

const METRICS: AlertMetric[] = [
  "dau",
  "errors",
  "errorRate",
  "p95Lcp",
  "p95Inp",
  "p95Ttfb",
  "checkoutCompletes",
  "rageClicks",
  "deadClicks",
  "activeSessions",
];
const OPS: AlertOp[] = ["gt", "gte", "lt", "lte", "spike", "drop"];
const SEVERITIES: AlertSeverity[] = ["info", "warn", "critical"];

export function ConsoleAlertManager() {
  const { data: rules = [] } = useAlertRules();
  const create = useCreateAlertRule();
  const update = useUpdateAlertRule();
  const del = useDeleteAlertRule();
  const evaluate = useEvaluateAlerts();
  const ack = useAckAlert();
  const resolve = useResolveAlert();
  const events = useLiveAlertEvents("firing");
  const auth = useAuthStore((s) => s.authState);
  const uid = auth.type === "Authenticated" ? auth.user.uid : "anon";
  const [building, setBuilding] = useState(false);
  const [draft, setDraft] = useState<Omit<AlertRule, "id" | "createdAt" | "updatedAt">>({
    name: "",
    metric: "errors",
    op: "gt",
    threshold: 10,
    windowMinutes: 60,
    severity: "warn",
    channels: ["in_app"],
    enabled: true,
    ownerUid: uid,
  });

  function severityBadge(s: AlertSeverity) {
    if (s === "critical") return "warn" as const;
    if (s === "warn") return "soon" as const;
    return "default" as const;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-muted/55">
            <Bell className="h-3 w-3" />
            Rules
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => evaluate.mutate()}
              className="rounded-md bg-input px-2 py-1 text-[10.5px] text-muted/75 hover:bg-card-hover"
            >
              Evaluate now
            </button>
            <button
              type="button"
              onClick={() => setBuilding((v) => !v)}
              className="rounded-md bg-acid px-2 py-1 text-[10.5px] font-semibold text-background hover:bg-acid/80"
            >
              <Plus className="-mt-0.5 mr-0.5 inline h-3 w-3" /> New
            </button>
          </div>
        </div>

        {building && (
          <div className="mb-3 space-y-2 rounded-lg border border-separator bg-input p-3">
            <input
              placeholder="Rule name"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              className="w-full rounded-md bg-card px-2 py-1.5 text-[12px] text-foreground outline-none"
            />
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={draft.metric}
                onChange={(e) => setDraft({ ...draft, metric: e.target.value as AlertMetric })}
                className="rounded-md bg-card px-2 py-1.5 text-[11.5px] text-foreground outline-none"
              >
                {METRICS.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
              <select
                value={draft.op}
                onChange={(e) => setDraft({ ...draft, op: e.target.value as AlertOp })}
                className="rounded-md bg-card px-2 py-1.5 text-[11.5px] text-foreground outline-none"
              >
                {OPS.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
              <input
                type="number"
                value={draft.threshold}
                onChange={(e) => setDraft({ ...draft, threshold: Number(e.target.value) })}
                className="w-24 rounded-md bg-card px-2 py-1.5 text-[11.5px] text-foreground outline-none"
              />
              <label className="text-[11px] text-muted/55">
                window
                <input
                  type="number"
                  value={draft.windowMinutes}
                  onChange={(e) =>
                    setDraft({ ...draft, windowMinutes: Number(e.target.value) })
                  }
                  className="ml-1 w-16 rounded-md bg-card px-2 py-1.5 text-[11.5px] text-foreground outline-none"
                />
                m
              </label>
              <select
                value={draft.severity}
                onChange={(e) => setDraft({ ...draft, severity: e.target.value as AlertSeverity })}
                className="rounded-md bg-card px-2 py-1.5 text-[11.5px] text-foreground outline-none"
              >
                {SEVERITIES.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={async () => {
                  if (!draft.name) return;
                  await create.mutateAsync(draft);
                  setBuilding(false);
                  setDraft({ ...draft, name: "" });
                }}
                className="rounded-md bg-acid px-3 py-1.5 text-[11.5px] font-semibold text-background hover:bg-acid/80"
              >
                Save rule
              </button>
            </div>
          </div>
        )}

        <ul className="space-y-2">
          {rules.map((r) => (
            <li
              key={r.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-separator bg-card p-2.5"
            >
              <div className="min-w-0">
                <p className="truncate text-[12.5px] font-medium text-foreground/85">{r.name}</p>
                <p className="mt-0.5 text-[11px] text-muted/55">
                  {r.metric} {r.op} {r.threshold} · {r.windowMinutes}m
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={severityBadge(r.severity)}>{r.severity}</Badge>
                <button
                  type="button"
                  onClick={() => update.mutate({ id: r.id, patch: { enabled: !r.enabled } })}
                  className={`rounded-md px-2 py-1 text-[10.5px] font-semibold ${
                    r.enabled
                      ? "bg-green/15 text-green hover:bg-green/25"
                      : "bg-muted/15 text-muted/65 hover:bg-card-hover"
                  }`}
                >
                  {r.enabled ? "on" : "off"}
                </button>
                <button
                  type="button"
                  onClick={() => del.mutate(r.id)}
                  className="rounded-md p-1.5 text-red hover:bg-red/10"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </li>
          ))}
          {rules.length === 0 && (
            <li className="py-4 text-center text-[11.5px] text-muted/45">No rules configured.</li>
          )}
        </ul>
      </Card>

      <Card className="p-4">
        <p className="mb-3 flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-muted/55">
          <AlertCircle className="h-3 w-3" />
          Firing now
        </p>
        <ul className="space-y-2">
          {events.map((ev) => (
            <li
              key={ev.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-red/40 bg-red/5 p-2.5"
            >
              <div className="min-w-0">
                <p className="truncate text-[12.5px] font-medium text-foreground/85">{ev.ruleName}</p>
                <p className="mt-0.5 text-[11px] text-muted/60">
                  {ev.metric} = {ev.observedValue} (threshold {ev.threshold})
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => ack.mutate({ id: ev.id, uid })}
                  className="rounded-md bg-input px-2 py-1 text-[10.5px] text-muted/75 hover:bg-card-hover"
                >
                  Ack
                </button>
                <button
                  type="button"
                  onClick={() => resolve.mutate(ev.id)}
                  className="rounded-md bg-green/15 px-2 py-1 text-[10.5px] font-semibold text-green hover:bg-green/25"
                >
                  <Check className="-mt-0.5 mr-0.5 inline h-3 w-3" />
                  Resolve
                </button>
              </div>
            </li>
          ))}
          {events.length === 0 && (
            <li className="py-4 text-center text-[11.5px] text-muted/45">All quiet 🌿</li>
          )}
        </ul>
      </Card>
    </div>
  );
}
