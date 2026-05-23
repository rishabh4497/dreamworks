import type { Game, LibraryEntry } from "@/lib/types";

interface ExportRow {
  gameId: string;
  name: string;
  developer: string;
  publisher: string;
  installed: boolean;
  playMinutes: number;
  lastPlayed: string | null;
  completionPct: number;
  ownedSince: string;
  sourceLauncher: string;
  achievementsUnlocked: number;
  drmType: string;
  sizeBytes: number;
}

function toExportRows(entries: LibraryEntry[], games: Game[]): ExportRow[] {
  const byId = new Map(games.map((g) => [g.id, g]));
  return entries.map((e) => {
    const g = byId.get(e.gameId);
    return {
      gameId: e.gameId,
      name: g?.name ?? e.gameId,
      developer: g?.developer ?? "",
      publisher: g?.publisher ?? "",
      installed: e.installed,
      playMinutes: e.playMinutes,
      lastPlayed: e.lastPlayed,
      completionPct: e.completionPct,
      ownedSince: e.ownedSince,
      sourceLauncher: e.sourceLauncher,
      achievementsUnlocked: e.achievementsUnlocked,
      drmType: e.drmType,
      sizeBytes: e.sizeBytes,
    };
  });
}

function triggerDownload(filename: string, mime: string, content: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Give the browser a tick before revoking, otherwise Safari sometimes nukes the download.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const today = () => new Date().toISOString().slice(0, 10);

export function exportLibraryJson(entries: LibraryEntry[], games: Game[]): void {
  const rows = toExportRows(entries, games);
  triggerDownload(
    `dreamworks-library-${today()}.json`,
    "application/json",
    JSON.stringify({ exportedAt: new Date().toISOString(), entries: rows }, null, 2),
  );
}

function csvEscape(value: unknown): string {
  if (value == null) return "";
  const s = String(value);
  if (s.includes(",") || s.includes("\n") || s.includes('"')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function exportLibraryCsv(entries: LibraryEntry[], games: Game[]): void {
  const rows = toExportRows(entries, games);
  if (rows.length === 0) {
    triggerDownload(`dreamworks-library-${today()}.csv`, "text/csv", "");
    return;
  }
  const headers = Object.keys(rows[0]) as (keyof ExportRow)[];
  const lines = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => csvEscape(r[h])).join(",")),
  ];
  triggerDownload(`dreamworks-library-${today()}.csv`, "text/csv", lines.join("\n"));
}
