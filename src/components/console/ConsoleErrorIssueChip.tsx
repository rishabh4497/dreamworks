import { useEffect, useState } from "react";
import { getErrorIssue, setErrorIssueStatus } from "@/lib/api/telemetry-extra";
import type { ErrorIssueStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const ORDER: ErrorIssueStatus[] = ["open", "acknowledged", "resolved", "ignored"];
const COLOR: Record<ErrorIssueStatus, string> = {
  open: "bg-red/15 text-red",
  acknowledged: "bg-orange/15 text-orange",
  resolved: "bg-green/15 text-green",
  ignored: "bg-card-active text-muted/60",
};

interface Props {
  fingerprint: string;
}

export function ConsoleErrorIssueChip({ fingerprint }: Props) {
  const [status, setStatus] = useState<ErrorIssueStatus | "loading">("loading");
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const issue = await getErrorIssue(fingerprint).catch(() => null);
      if (cancelled) return;
      setStatus(issue?.status ?? "open");
    })();
    return () => {
      cancelled = true;
    };
  }, [fingerprint]);

  const cycle = async () => {
    if (status === "loading") return;
    const next = ORDER[(ORDER.indexOf(status) + 1) % ORDER.length];
    setStatus(next);
    await setErrorIssueStatus(fingerprint, next).catch(() => {});
  };

  if (status === "loading") {
    return <span className="rounded-md bg-card-active px-2 py-0.5 text-[10.5px] text-muted/45">…</span>;
  }
  return (
    <button
      type="button"
      onClick={cycle}
      className={cn(
        "rounded-md px-2 py-0.5 text-[10.5px] font-medium tabular-nums uppercase tracking-wider",
        COLOR[status],
      )}
      title="Click to cycle status"
    >
      {status}
    </button>
  );
}
