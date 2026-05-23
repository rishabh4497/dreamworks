import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Props {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function ConsoleSection({ title, description, action, children, className }: Props) {
  return (
    <section className={cn("space-y-3", className)}>
      <header className="flex items-baseline justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[12px] font-semibold uppercase tracking-widest text-muted/55">
            {title}
          </h2>
          {description && (
            <p className="mt-0.5 text-[11.5px] text-muted/45">{description}</p>
          )}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}
