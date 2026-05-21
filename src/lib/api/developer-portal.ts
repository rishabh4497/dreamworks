import { wait } from "./_delay";

const STORAGE_KEY = "dreamworks-developer-release-drafts";

export type ReleaseStage = "draft" | "submitted";
export type ReleaseWindow = "morning" | "afternoon" | "evening" | "midnight";

export interface DeveloperReleaseDraft {
  id: string;
  gameTitle: string;
  developerName: string;
  shortDescription: string;
  genre: string;
  contentRating: string;
  buildLabel: string;
  buildNotes: string;
  releaseDate: string;
  releaseWindow: ReleaseWindow;
  basePriceCents: number;
  launchDiscountPct: number;
  regionalPricing: boolean;
  checklist: {
    achievements: boolean;
    newsPost: boolean;
    capsuleArt: boolean;
    controllerSupport: boolean;
    cloudSaves: boolean;
  };
  previewHeadline: string;
  previewBody: string;
  stage: ReleaseStage;
  updatedAt: string;
  submittedAt?: string;
}

export type DeveloperReleaseDraftInput = Omit<
  DeveloperReleaseDraft,
  "id" | "updatedAt" | "submittedAt"
> & {
  id?: string;
  submittedAt?: string;
};

const DEFAULT_DRAFT: DeveloperReleaseDraft = {
  id: "release-draft-primary",
  gameTitle: "Moonlit Express",
  developerName: "Signal Bloom Studio",
  shortDescription: "A cozy rail-builder about restoring night routes between floating cities.",
  genre: "Simulation",
  contentRating: "Everyone 10+",
  buildLabel: "0.9.4-rc1",
  buildNotes: "Release candidate placeholder. Final depot upload and branch locks pending.",
  releaseDate: "2026-06-18",
  releaseWindow: "morning",
  basePriceCents: 2499,
  launchDiscountPct: 10,
  regionalPricing: true,
  checklist: {
    achievements: true,
    newsPost: false,
    capsuleArt: true,
    controllerSupport: true,
    cloudSaves: false,
  },
  previewHeadline: "Restore the midnight line",
  previewBody:
    "Build soft-lit routes, tune timetables, and bring isolated sky towns back into the network.",
  stage: "draft",
  updatedAt: "2026-05-21T12:00:00.000Z",
};

function now() {
  return new Date().toISOString();
}

function readStored(): DeveloperReleaseDraft[] {
  if (typeof localStorage === "undefined") return [DEFAULT_DRAFT];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [DEFAULT_DRAFT];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as DeveloperReleaseDraft[]) : [DEFAULT_DRAFT];
  } catch {
    return [DEFAULT_DRAFT];
  }
}

function writeStored(drafts: DeveloperReleaseDraft[]) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
}

export async function listDeveloperReleaseDrafts(): Promise<DeveloperReleaseDraft[]> {
  await wait();
  return readStored();
}

export async function getPrimaryReleaseDraft(): Promise<DeveloperReleaseDraft> {
  await wait();
  return readStored()[0] ?? DEFAULT_DRAFT;
}

export async function saveDeveloperReleaseDraft(
  input: DeveloperReleaseDraftInput,
): Promise<DeveloperReleaseDraft> {
  await wait();
  const draft: DeveloperReleaseDraft = {
    ...input,
    id: input.id ?? DEFAULT_DRAFT.id,
    updatedAt: now(),
    submittedAt: input.submittedAt,
  };
  const existing = readStored();
  const next = [draft, ...existing.filter((item) => item.id !== draft.id)];
  writeStored(next);
  return draft;
}

export async function submitDeveloperReleaseDraft(
  input: DeveloperReleaseDraftInput,
): Promise<DeveloperReleaseDraft> {
  const submittedAt = now();
  return saveDeveloperReleaseDraft({
    ...input,
    stage: "submitted",
    submittedAt,
  });
}

export function formatPrice(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}
