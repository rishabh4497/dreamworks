import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
}

export function EmptyState({ title, description, icon: Icon = Inbox, action }: EmptyStateProps) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-card-active">
        <Icon className="h-6 w-6 text-muted/60" />
      </div>
      <div className="max-w-[420px] space-y-1.5">
        <h2 className="text-[16px] font-semibold text-foreground">{title}</h2>
        {description && <p className="text-[13px] text-muted/60">{description}</p>}
      </div>
      {action}
    </div>
  );
}
