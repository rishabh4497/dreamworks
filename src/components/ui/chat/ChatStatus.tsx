import { Check, CheckCheck, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatStatus as Status } from "./types";

interface ChatStatusProps {
  status: Status;
  className?: string;
}

/**
 * Delivery / read receipt glyph rendered under the most recent user message
 * in peer mode. Mirrors WhatsApp conventions:
 *   • single check = sent, double = delivered, double + colored = read.
 * Errors get a red exclamation; in-flight messages show a small clock.
 */
export function ChatStatus({ status, className }: ChatStatusProps) {
  const label = LABELS[status];
  const Icon = ICONS[status];
  return (
    <span
      title={label}
      aria-label={label}
      className={cn(
        "inline-flex items-center gap-1 text-[10px]",
        status === "read" ? "text-acid" : status === "failed" ? "text-red" : "text-muted/55",
        className,
      )}
    >
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

const ICONS = {
  sending: Clock,
  sent: Check,
  delivered: CheckCheck,
  read: CheckCheck,
  failed: AlertCircle,
} as const;

const LABELS: Record<Status, string> = {
  sending: "Sending",
  sent: "Sent",
  delivered: "Delivered",
  read: "Read",
  failed: "Failed",
};
