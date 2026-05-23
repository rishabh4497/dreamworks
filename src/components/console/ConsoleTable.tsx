import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Column<T> {
  key: string;
  label: string;
  align?: "left" | "right";
  /** Receives the row and returns either a primitive or a React node. */
  render: (row: T) => ReactNode;
  className?: string;
}

interface Props<T> {
  columns: Column<T>[];
  rows: T[];
  emptyLabel?: string;
  getRowKey: (row: T, index: number) => string;
}

export function ConsoleTable<T>({
  columns,
  rows,
  emptyLabel = "No data yet",
  getRowKey,
}: Props<T>) {
  if (rows.length === 0) {
    return (
      <p className="py-6 text-center text-[12px] text-muted/55">{emptyLabel}</p>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[12.5px]">
        <thead>
          <tr className="border-b border-separator/50">
            {columns.map((c) => (
              <th
                key={c.key}
                className={cn(
                  "px-2 py-2 text-[10.5px] font-medium uppercase tracking-wider text-muted/45",
                  c.align === "right" ? "text-right" : "text-left",
                  c.className,
                )}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr
              key={getRowKey(row, idx)}
              className="border-b border-separator/30 last:border-b-0"
            >
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={cn(
                    "px-2 py-2 align-middle",
                    c.align === "right" ? "text-right tabular-nums" : "",
                    c.className,
                  )}
                >
                  {c.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
