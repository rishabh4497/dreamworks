import type { SaveHistoryEntry } from "../types";

// Per-game cloud-save Time Machine slots. Index 0 is treated as "current" in
// the UI; the rest are older snapshots available for rollback.
export const SAVE_HISTORY: SaveHistoryEntry[] = [
  { id: "s1", date: "Today at 10:42 PM", size: "14.2 MB", desc: "Autosave - The Forgotten Forest" },
  { id: "s2", date: "Yesterday at 6:15 PM", size: "13.8 MB", desc: "Manual Save - Boss Fight Preparation" },
  { id: "s3", date: "Oct 12 at 2:00 AM", size: "10.1 MB", desc: "Autosave - Early Game" },
];
