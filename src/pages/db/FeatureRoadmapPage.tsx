import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import {
  AlertTriangle,
  CheckCircle2,
  CircleDot,
  Filter,
  Flag,
  Layers3,
  ListTodo,
  ShieldCheck,
} from "lucide-react";
import {
  FEATURE_AREA_LABELS,
  FEATURE_PRIORITY_LABELS,
  FEATURE_STATUS_LABELS,
  listFeatureRoadmap,
  summarizeFeatureRoadmap,
} from "@/lib/api/feature-roadmap";
import type { FeatureArea, FeaturePriority, FeatureRoadmapItem, FeatureStatus } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

type AreaFilter = "all" | FeatureArea;
type StatusFilter = "all" | FeatureStatus;
type PriorityFilter = "all" | FeaturePriority;

const AREA_ORDER: FeatureArea[] = [
  "native",
  "library",
  "commerce",
  "subscription",
  "community",
  "trust",
  "polish",
  "developer",
];

const STATUS_ORDER: FeatureStatus[] = ["partial", "planned", "blocked", "done"];
const PRIORITY_ORDER: FeaturePriority[] = ["P0", "P1", "P2"];

export function FeatureRoadmapPage() {
  const { data: items = [] } = useQuery({
    queryKey: ["feature-roadmap"],
    queryFn: listFeatureRoadmap,
  });
  const [area, setArea] = useState<AreaFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [priority, setPriority] = useState<PriorityFilter>("all");

  const summary = useMemo(() => summarizeFeatureRoadmap(items), [items]);
  const filtered = useMemo(
    () =>
      items.filter((item) => {
        if (area !== "all" && item.area !== area) return false;
        if (status !== "all" && item.status !== status) return false;
        if (priority !== "all" && item.priority !== priority) return false;
        return true;
      }),
    [area, items, priority, status],
  );

  const doneCount = summary.byStatus.done ?? 0;
  const partialCount = summary.byStatus.partial ?? 0;
  const coveragePct =
    items.length === 0
      ? 0
      : Math.round(((doneCount + partialCount * 0.5) / items.length) * 100);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-muted/50">
            <ListTodo className="h-3 w-3" />
            Dreamworks DB
          </p>
          <h1 className="text-[24px] font-semibold tracking-tight text-foreground">
            Feature Roadmap
          </h1>
          <p className="mt-1 max-w-3xl text-[13px] leading-relaxed text-muted/65">
            Tracks the missing launcher capabilities that matter before Dreamworks can feel
            production-grade: native runtime, storage, offline access, cloud saves,
            commerce trust, community safety, and platform polish.
          </p>
        </div>
        <Card className="w-full p-4 lg:w-[280px]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted/55">Coverage</p>
              <p className="mt-1 text-[26px] font-semibold tabular-nums text-foreground">
                {coveragePct}%
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-acid/10 text-acid">
              <ShieldCheck className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-input">
            <div className="h-full rounded-full bg-acid" style={{ width: `${coveragePct}%` }} />
          </div>
          <p className="mt-2 text-[11px] text-muted/60">
            {summary.p0Open} open P0 item{summary.p0Open === 1 ? "" : "s"}
          </p>
        </Card>
      </header>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Partial" value={partialCount} icon={CircleDot} tone="soon" />
        <Metric label="Planned" value={summary.byStatus.planned ?? 0} icon={Flag} tone="default" />
        <Metric label="Blocked" value={summary.byStatus.blocked ?? 0} icon={AlertTriangle} tone="warn" />
        <Metric label="Done" value={doneCount} icon={CheckCircle2} tone="free" />
      </section>

      <section className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted/50">
          <Filter className="h-3 w-3" />
          Filters
        </span>
        <SelectFilter value={area} onChange={(next) => setArea(next as AreaFilter)}>
          <option value="all">All areas</option>
          {AREA_ORDER.map((key) => (
            <option key={key} value={key}>
              {FEATURE_AREA_LABELS[key]}
            </option>
          ))}
        </SelectFilter>
        <SelectFilter value={status} onChange={(next) => setStatus(next as StatusFilter)}>
          <option value="all">All statuses</option>
          {STATUS_ORDER.map((key) => (
            <option key={key} value={key}>
              {FEATURE_STATUS_LABELS[key]}
            </option>
          ))}
        </SelectFilter>
        <SelectFilter value={priority} onChange={(next) => setPriority(next as PriorityFilter)}>
          <option value="all">All priorities</option>
          {PRIORITY_ORDER.map((key) => (
            <option key={key} value={key}>
              {FEATURE_PRIORITY_LABELS[key]}
            </option>
          ))}
        </SelectFilter>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-3">
          {filtered.map((item) => (
            <RoadmapCard key={item.id} item={item} />
          ))}
          {filtered.length === 0 && (
            <Card className="p-10 text-center text-[13px] text-muted/65">
              No roadmap items match these filters.
            </Card>
          )}
        </div>
        <Card className="h-fit p-4">
          <h2 className="flex items-center gap-2 text-[14px] font-semibold text-foreground">
            <Layers3 className="h-4 w-4 text-muted/60" />
            Area Coverage
          </h2>
          <div className="mt-4 space-y-3">
            {AREA_ORDER.map((key) => {
              const count = summary.byArea[key] ?? 0;
              const pct = items.length ? Math.round((count / items.length) * 100) : 0;
              return (
                <div key={key}>
                  <div className="mb-1 flex items-center justify-between text-[11px]">
                    <span className="font-medium text-foreground/80">{FEATURE_AREA_LABELS[key]}</span>
                    <span className="tabular-nums text-muted/60">{count}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-input">
                    <div className="h-full rounded-full bg-foreground/35" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </section>
    </motion.div>
  );
}

function Metric({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: typeof CircleDot;
  tone: "default" | "free" | "soon" | "warn";
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted/55">{label}</p>
          <p className="mt-1 text-[22px] font-semibold tabular-nums text-foreground">{value}</p>
        </div>
        <Badge variant={tone} className="h-7 w-7 justify-center rounded-lg p-0">
          <Icon className="h-3.5 w-3.5" />
        </Badge>
      </div>
    </Card>
  );
}

function SelectFilter({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="rounded-lg border border-separator bg-input px-2.5 py-1.5 text-[12px] text-foreground focus:outline-none"
    >
      {children}
    </select>
  );
}

function RoadmapCard({ item }: { item: FeatureRoadmapItem }) {
  return (
    <Card className="p-4">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            <Badge variant={statusVariant(item.status)}>{FEATURE_STATUS_LABELS[item.status]}</Badge>
            <Badge variant={item.priority === "P0" ? "warn" : item.priority === "P1" ? "soon" : "default"}>
              {item.priority}
            </Badge>
            <Badge>{FEATURE_AREA_LABELS[item.area]}</Badge>
          </div>
          <h2 className="text-[15px] font-semibold text-foreground">{item.title}</h2>
          <p className="mt-1 text-[12px] leading-relaxed text-muted/70">{item.userValue}</p>
        </div>
      </header>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <RoadmapField label="Current" value={item.currentState} />
        <RoadmapField label="Next" value={item.nextStep} />
        <RoadmapField label="Acceptance" value={item.acceptance} />
      </div>
    </Card>
  );
}

function RoadmapField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-card-active/45 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted/50">{label}</p>
      <p className="mt-1 text-[11.5px] leading-relaxed text-foreground/75">{value}</p>
    </div>
  );
}

function statusVariant(status: FeatureStatus): "default" | "free" | "soon" | "warn" {
  if (status === "done") return "free";
  if (status === "partial") return "soon";
  if (status === "blocked") return "warn";
  return "default";
}
