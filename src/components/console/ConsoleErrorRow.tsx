import { useState } from "react";
import { ChevronDown, ChevronRight, Globe, Laptop } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import { relativeTime } from "@/lib/utils";
import type { TelemetryError } from "@/lib/types";

interface Props {
  error: TelemetryError;
}

export function ConsoleErrorRow({ error }: Props) {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();
  const Icon = error.device?.isDesktop ? Laptop : Globe;
  return (
    <div className="rounded-lg border border-separator bg-card-active/30 px-3 py-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-start gap-2 text-left"
      >
        {open ? (
          <ChevronDown className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted/60" />
        ) : (
          <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted/60" />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12.5px] text-red/90">{error.message}</p>
          <p className="mt-0.5 flex items-center gap-2 text-[11px] text-muted/55">
            <Icon className="h-3 w-3" />
            <span>{error.device?.os ?? "web"}</span>
            <span>•</span>
            <span className="truncate">{error.route}</span>
            <span className="ml-auto shrink-0">
              {relativeTime(error.ts, t)}
            </span>
          </p>
        </div>
      </button>
      {open && (
        <div className="mt-2 space-y-2 pl-5">
          {error.stack && (
            <pre
              className={cn(
                "max-h-[200px] overflow-auto rounded-md bg-bg/60 p-2 font-mono text-[11px] leading-snug text-muted/70",
              )}
            >
              {error.stack}
            </pre>
          )}
          <dl className="grid grid-cols-[80px_1fr] gap-y-1 text-[11px]">
            <dt className="text-muted/55">source</dt>
            <dd className="text-foreground/75">{error.source}</dd>
            <dt className="text-muted/55">uid</dt>
            <dd className="font-mono text-foreground/75">
              {error.uid ?? "anon"}
            </dd>
            <dt className="text-muted/55">session</dt>
            <dd className="font-mono text-foreground/75">{error.sessionId}</dd>
            {error.context && Object.keys(error.context).length > 0 && (
              <>
                <dt className="text-muted/55">context</dt>
                <dd>
                  <pre className="rounded bg-bg/60 p-1.5 font-mono text-[10.5px] text-muted/70">
                    {JSON.stringify(error.context, null, 2)}
                  </pre>
                </dd>
              </>
            )}
          </dl>
        </div>
      )}
    </div>
  );
}
