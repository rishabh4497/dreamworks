import { AlertTriangle, Cloud, HardDrive, Laptop, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { CloudSaveResolution, CloudSaveSlot } from "@/lib/types";
import { cn, formatBytes, formatDateTime } from "@/lib/utils";

interface CloudSaveConflictResolverProps {
  gameName: string;
  slots: CloudSaveSlot[];
  resolving: boolean;
  onResolve: (slot: CloudSaveSlot, resolution: CloudSaveResolution) => void;
}

export function CloudSaveConflictResolver({
  gameName,
  slots,
  resolving,
  onResolve,
}: CloudSaveConflictResolverProps) {
  const conflictSlots = slots.filter((slot) => slot.status === "conflict");

  if (conflictSlots.length === 0) return null;

  return (
    <Card className="p-4">
      <header className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-red" />
            <h2 className="truncate text-[14px] font-semibold text-foreground">
              Cloud save conflict
            </h2>
          </div>
          <p className="mt-1 text-[12px] text-muted/65">
            Choose which save to keep for {gameName}.
          </p>
        </div>
        {resolving && (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted/70">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Resolving
          </span>
        )}
      </header>

      <ul className="mt-4 space-y-3">
        {conflictSlots.map((slot) => (
          <li
            key={slot.id}
            className="rounded-lg border border-separator/70 bg-card-active/45 p-3"
          >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-center gap-2">
                  <Laptop className="h-3.5 w-3.5 shrink-0 text-muted/65" />
                  <p className="truncate text-[13px] font-semibold text-foreground">
                    {slot.deviceName}
                  </p>
                  <span className="shrink-0 rounded-full bg-red/15 px-2 py-0.5 text-[10px] font-medium text-red">
                    Conflict
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-[11px] text-muted/65">
                  {slot.conflictReason ?? "Local and cloud saves changed separately."}
                </p>
              </div>

              <div className="grid gap-2 sm:grid-cols-3 lg:w-[420px]">
                <SaveMeta label="Local timestamp" value={formatSlotDate(slot.localUpdatedAt)} />
                <SaveMeta label="Remote timestamp" value={formatSlotDate(slot.remoteUpdatedAt)} />
                <SaveMeta label="Save size" value={formatBytes(slot.sizeBytes)} />
              </div>
            </div>

            <div
              className={cn(
                "mt-3 grid gap-2",
                "sm:grid-cols-2 lg:ml-auto lg:w-[420px]",
              )}
            >
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={resolving}
                onClick={() => onResolve(slot, "local")}
                aria-label={`Use local save for ${slot.deviceName}`}
              >
                <HardDrive className="h-3.5 w-3.5" />
                Use local save
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={resolving}
                onClick={() => onResolve(slot, "remote")}
                aria-label={`Use cloud save for ${slot.deviceName}`}
              >
                <Cloud className="h-3.5 w-3.5" />
                Use cloud save
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function SaveMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-background/35 px-2.5 py-2">
      <p className="text-[10px] uppercase tracking-wider text-muted/55">{label}</p>
      <p className="mt-0.5 truncate text-[11px] font-medium tabular-nums text-foreground/85">
        {value}
      </p>
    </div>
  );
}

function formatSlotDate(value: string | null) {
  return value ? formatDateTime(value) : "Not available";
}
