import { Download } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props<T extends Record<string, unknown>> {
  rows: T[];
  filename: string;
  className?: string;
  label?: string;
}

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "object") return JSON.stringify(value).replace(/"/g, '""');
  const s = String(value);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function toCsv<T extends Record<string, unknown>>(rows: T[]): string {
  if (rows.length === 0) return "";
  const cols = Object.keys(rows[0]);
  const head = cols.join(",");
  const body = rows
    .map((r) => cols.map((c) => csvCell((r as Record<string, unknown>)[c])).join(","))
    .join("\n");
  return `${head}\n${body}`;
}

export function ConsoleExportCsv<T extends Record<string, unknown>>({
  rows,
  filename,
  className,
  label = "CSV",
}: Props<T>) {
  const handleDownload = () => {
    const csv = toCsv(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={rows.length === 0}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md bg-card-active px-2 py-1 text-[11px] font-medium text-foreground/80 hover:bg-card-hover disabled:opacity-40 disabled:cursor-not-allowed",
        className,
      )}
      title={`Export ${rows.length} rows as CSV`}
    >
      <Download className="h-3 w-3" />
      {label}
    </button>
  );
}
