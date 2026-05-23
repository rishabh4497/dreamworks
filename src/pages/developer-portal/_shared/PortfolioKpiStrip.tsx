import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: string;
  caption?: string;
  icon: LucideIcon;
  accent?: "acid" | "green" | "cyan" | "orange" | "muted";
}

const ACCENT_TEXT: Record<NonNullable<KpiCardProps["accent"]>, string> = {
  acid: "text-acid",
  green: "text-green",
  cyan: "text-cyan",
  orange: "text-orange",
  muted: "text-muted",
};

export function KpiCard({ label, value, caption, icon: Icon, accent = "muted" }: KpiCardProps) {
  return (
    <div className="rounded-xl border border-separator bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-muted/55">
          {label}
        </span>
        <Icon className={cn("h-4 w-4 opacity-80", ACCENT_TEXT[accent])} />
      </div>
      <p className="mt-2 text-[22px] font-semibold tracking-tight text-foreground">{value}</p>
      {caption && <p className="mt-0.5 text-[11px] text-muted/55">{caption}</p>}
    </div>
  );
}

export function PortfolioKpiStrip({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{children}</div>
  );
}
