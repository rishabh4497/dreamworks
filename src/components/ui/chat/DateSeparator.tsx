interface DateSeparatorProps {
  /** ISO timestamp the separator stamps. */
  iso: string;
}

/**
 * Day divider rendered between bubbles when the conversation crosses midnight.
 * Matches the iMessage / WhatsApp convention — small pill, centered, very
 * lightweight so it never competes with the bubbles themselves.
 */
export function DateSeparator({ iso }: DateSeparatorProps) {
  const label = formatDayLabel(iso);
  if (!label) return null;
  return (
    <div className="my-3 flex items-center justify-center" role="separator">
      <span className="rounded-full bg-card-active/60 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-muted/70">
        {label}
      </span>
    </div>
  );
}

function formatDayLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";

  const now = new Date();
  const startOfDay = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const diff = startOfDay(now) - startOfDay(d);
  const day = 24 * 60 * 60 * 1000;

  if (diff === 0) return "Today";
  if (diff === day) return "Yesterday";
  if (diff > 0 && diff < 7 * day) {
    return d.toLocaleDateString(undefined, { weekday: "long" });
  }
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: d.getFullYear() === now.getFullYear() ? undefined : "numeric",
  });
}
