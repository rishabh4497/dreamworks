import type { ModerationRecord } from "../types";
import { wait } from "./_delay";

const STORAGE_KEY = "dreamworks-moderation-records";

export type ModerationDecision = "dismiss" | "hide" | "warn" | "ban";

export interface ModerationHistoryEntry {
  at: string;
  actor: string;
  action: string;
  note?: string;
}

export interface ModerationQueueRecord extends ModerationRecord {
  targetTitle: string;
  targetExcerpt: string;
  authorName: string;
  authorTrust: "new" | "mixed" | "trusted" | "restricted";
  verifiedOwner?: boolean;
  accountAgeDays: number;
  priorReports: number;
  trustSignals: string[];
  notes?: string;
  history: ModerationHistoryEntry[];
}

const SEED_RECORDS: ModerationQueueRecord[] = [
  {
    id: "mod-review-helldivers-owner",
    targetType: "review",
    targetId: "review-7724",
    targetTitle: "Review: Starfall Tactics",
    targetExcerpt:
      "Fun core loop, but the post-match chat has been full of coordinated harassment all week.",
    reporterUserId: "user-mira",
    reason: "Harassment report with screenshots attached",
    status: "open",
    createdAt: "2026-05-20T10:24:00.000Z",
    authorName: "orbitalCat",
    authorTrust: "trusted",
    verifiedOwner: true,
    accountAgeDays: 1480,
    priorReports: 0,
    trustSignals: ["Verified owner", "412 hours played", "No prior actions"],
    history: [
      {
        at: "2026-05-20T10:24:00.000Z",
        actor: "Trust system",
        action: "Report opened",
        note: "Reporter is verified owner with high playtime.",
      },
    ],
  },
  {
    id: "mod-post-market-links",
    targetType: "post",
    targetId: "post-1182",
    targetTitle: "Forum post: cheap keys here",
    targetExcerpt:
      "Selling cheap keys and account bundles. Message me before moderators wake up.",
    reporterUserId: "user-sam",
    reason: "Spam and marketplace abuse",
    status: "triaged",
    createdAt: "2026-05-19T18:02:00.000Z",
    authorName: "freshDrop99",
    authorTrust: "new",
    verifiedOwner: false,
    accountAgeDays: 2,
    priorReports: 6,
    trustSignals: ["New account", "External links", "Six reports in 24h"],
    history: [
      { at: "2026-05-19T18:02:00.000Z", actor: "Trust system", action: "Report opened" },
      { at: "2026-05-19T18:08:00.000Z", actor: "Auto triage", action: "Marked high risk" },
    ],
  },
  {
    id: "mod-workshop-copyright",
    targetType: "workshop-item",
    targetId: "workshop-441",
    targetTitle: "Workshop: Neon city texture pack",
    targetExcerpt:
      "Reported as a re-upload of another creator's texture pack with names removed.",
    reporterUserId: "user-ivy",
    reason: "Creator ownership dispute",
    status: "open",
    createdAt: "2026-05-18T07:42:00.000Z",
    authorName: "blueForge",
    authorTrust: "mixed",
    verifiedOwner: true,
    accountAgeDays: 520,
    priorReports: 2,
    trustSignals: ["Verified owner", "Prior attribution warning", "Workshop item has 18k subscribers"],
    history: [
      {
        at: "2026-05-18T07:42:00.000Z",
        actor: "Trust system",
        action: "Report opened",
        note: "Original creator supplied matching source files.",
      },
    ],
  },
  {
    id: "mod-profile-impersonation",
    targetType: "profile",
    targetId: "profile-904",
    targetTitle: "Profile: support-agent",
    targetExcerpt:
      "Profile name, avatar, and bio claim to be official support while asking users for login codes.",
    reporterUserId: "user-nova",
    reason: "Impersonation and account theft risk",
    status: "open",
    createdAt: "2026-05-21T02:16:00.000Z",
    authorName: "support-agent",
    authorTrust: "restricted",
    verifiedOwner: false,
    accountAgeDays: 11,
    priorReports: 9,
    trustSignals: ["Restricted account", "Impersonation keywords", "Login-code language"],
    history: [
      { at: "2026-05-21T02:16:00.000Z", actor: "Trust system", action: "Report opened" },
    ],
  },
];

function hydrateRecord(record: ModerationRecord): ModerationQueueRecord {
  const existing = record as Partial<ModerationQueueRecord>;
  return {
    ...record,
    targetTitle: existing.targetTitle ?? `${record.targetType} ${record.targetId}`,
    targetExcerpt: existing.targetExcerpt ?? record.reason,
    authorName: existing.authorName ?? "Unknown author",
    authorTrust: existing.authorTrust ?? "mixed",
    verifiedOwner: existing.verifiedOwner ?? false,
    accountAgeDays: existing.accountAgeDays ?? 0,
    priorReports: existing.priorReports ?? 1,
    trustSignals: existing.trustSignals ?? ["Reporter supplied context"],
    notes: existing.notes,
    history:
      existing.history ??
      [
        {
          at: record.createdAt,
          actor: "Trust system",
          action: "Report opened",
          note: record.reason,
        },
      ],
  };
}

function readStored(): ModerationQueueRecord[] {
  if (typeof localStorage === "undefined") return SEED_RECORDS;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return SEED_RECORDS;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? (parsed as ModerationRecord[]).map(hydrateRecord)
      : SEED_RECORDS;
  } catch {
    return SEED_RECORDS;
  }
}

function writeStored(records: ModerationQueueRecord[]) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export async function listModerationRecords(): Promise<ModerationRecord[]> {
  await wait();
  return readStored();
}

export async function listModerationQueueRecords(): Promise<ModerationQueueRecord[]> {
  await wait();
  return readStored();
}

export async function reportContent(input: {
  targetType: ModerationRecord["targetType"];
  targetId: string;
  reporterUserId: string;
  reason: string;
}): Promise<ModerationRecord> {
  await wait();
  const record: ModerationQueueRecord = {
    id: `mod:${input.targetType}:${input.targetId}:${Date.now()}`,
    targetType: input.targetType,
    targetId: input.targetId,
    reporterUserId: input.reporterUserId,
    reason: input.reason,
    status: "open",
    createdAt: new Date().toISOString(),
    targetTitle: `${input.targetType} ${input.targetId}`,
    targetExcerpt: input.reason,
    authorName: "Reported user",
    authorTrust: "mixed",
    verifiedOwner: false,
    accountAgeDays: 0,
    priorReports: 1,
    trustSignals: ["User-submitted report"],
    history: [
      {
        at: new Date().toISOString(),
        actor: "Trust system",
        action: "Report opened",
        note: input.reason,
      },
    ],
  };
  writeStored([record, ...readStored()]);
  return record;
}

export async function decideModerationRecord(input: {
  id: string;
  moderatorId: string;
  action: ModerationRecord["action"];
  status: Extract<ModerationRecord["status"], "actioned" | "dismissed">;
}): Promise<ModerationRecord | null> {
  await wait();
  const decidedAt = new Date().toISOString();
  const next = readStored().map((record) =>
    record.id === input.id
      ? {
          ...record,
          moderatorId: input.moderatorId,
          action: input.action,
          status: input.status,
          decidedAt,
          history: [
            {
              at: decidedAt,
              actor: input.moderatorId,
              action: input.status === "dismissed" ? "Dismissed report" : `Actioned: ${input.action}`,
            },
            ...record.history,
          ],
        }
      : record,
  );
  writeStored(next);
  return next.find((record) => record.id === input.id) ?? null;
}

export async function decideModerationQueueRecord(input: {
  id: string;
  moderatorId: string;
  decision: ModerationDecision;
  notes?: string;
}): Promise<ModerationQueueRecord | null> {
  await wait();
  const decidedAt = new Date().toISOString();
  const action: ModerationRecord["action"] =
    input.decision === "dismiss" ? "none" : input.decision;
  const status: ModerationRecord["status"] =
    input.decision === "dismiss" ? "dismissed" : "actioned";
  const next = readStored().map((record) =>
    record.id === input.id
      ? {
          ...record,
          moderatorId: input.moderatorId,
          action,
          status,
          notes: input.notes,
          decidedAt,
          history: [
            {
              at: decidedAt,
              actor: input.moderatorId,
              action:
                input.decision === "dismiss"
                  ? "Dismissed report"
                  : `Actioned: ${input.decision}`,
              note: input.notes,
            },
            ...record.history,
          ],
        }
      : record,
  );
  writeStored(next);
  return next.find((record) => record.id === input.id) ?? null;
}

export async function saveModerationNotes(input: {
  id: string;
  moderatorId: string;
  notes: string;
}): Promise<ModerationQueueRecord | null> {
  await wait();
  const notedAt = new Date().toISOString();
  const next = readStored().map((record) =>
    record.id === input.id
      ? {
          ...record,
          notes: input.notes,
          history: [
            {
              at: notedAt,
              actor: input.moderatorId,
              action: "Updated notes",
              note: input.notes,
            },
            ...record.history,
          ],
        }
      : record,
  );
  writeStored(next);
  return next.find((record) => record.id === input.id) ?? null;
}
