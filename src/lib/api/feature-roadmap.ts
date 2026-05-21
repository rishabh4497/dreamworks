import type { FeatureArea, FeaturePriority, FeatureRoadmapItem, FeatureStatus } from "../types";
import { wait } from "./_delay";

const ITEMS: FeatureRoadmapItem[] = [
  {
    id: "native-launch-core",
    title: "Native launch/install core",
    area: "native",
    status: "partial",
    priority: "P0",
    userValue: "Users can launch, install, verify, move, and inspect games from one client.",
    currentState: "Typed Tauri command bridge exists; install/download behavior is still simulated.",
    nextStep: "Back commands with a real manifest writer, installer jobs, and process lifecycle tracking.",
    acceptance: "A game can install, launch, verify, move, and uninstall without mock-only state.",
  },
  {
    id: "storage-manager",
    title: "Storage manager",
    area: "library",
    status: "planned",
    priority: "P0",
    userValue: "Users can see disk usage, move installs, clean shader caches, and avoid disk-full failures.",
    currentState: "Install paths and sizes are represented, but there is no storage dashboard.",
    nextStep: "Add per-drive usage, install folders, move queue, and safe cleanup actions.",
    acceptance: "The app shows total installed size by drive and can move one install with progress.",
  },
  {
    id: "cloud-save-conflicts",
    title: "Cloud-save conflict resolver",
    area: "subscription",
    status: "done",
    priority: "P0",
    userValue: "Players do not lose saves when switching devices or playing offline.",
    currentState: "Seeded cloud-save slots, query hooks, and a library-page conflict resolver are implemented.",
    nextStep: "Back the resolver with native save scanning and server sync once the account backend is live.",
    acceptance: "A conflict can be reviewed and resolved from the game library page.",
  },
  {
    id: "offline-mode",
    title: "Offline mode",
    area: "trust",
    status: "planned",
    priority: "P0",
    userValue: "Owned DRM-free or cached-entitlement games remain playable without internet.",
    currentState: "Library entries expose offline eligibility, but startup/auth does not model offline mode.",
    nextStep: "Cache entitlements, add offline startup state, and gate launch buttons by cached access.",
    acceptance: "The launcher boots offline and clearly shows which games can launch.",
  },
  {
    id: "gifting-family-purchases",
    title: "Gifting and family purchase controls",
    area: "commerce",
    status: "planned",
    priority: "P1",
    userValue: "Families can approve purchases and users can buy games for friends.",
    currentState: "Cart items already carry an `asGift` flag, but checkout has no gift recipient flow.",
    nextStep: "Add recipient picker, scheduled gift delivery, family approval queue, and receipt metadata.",
    acceptance: "A cart item can be purchased as a gift and appears as a pending entitlement for the recipient.",
  },
  {
    id: "developer-publisher-portal",
    title: "Developer/publisher portal",
    area: "developer",
    status: "planned",
    priority: "P1",
    userValue: "Studios can manage builds, pricing, achievements, news, and community presence.",
    currentState: "Storefront pages exist, but there is no creator/admin workflow.",
    nextStep: "Add draft game metadata, build upload placeholders, release calendar, and price controls.",
    acceptance: "A developer can stage a mock release, preview store copy, and submit it for review.",
  },
  {
    id: "review-moderation-integrity",
    title: "Review integrity and moderation queue",
    area: "community",
    status: "partial",
    priority: "P1",
    userValue: "Reviews and social content feel useful, trusted, and safer to participate in.",
    currentState: "Review integrity and moderation record types exist, but no moderator surface is routed.",
    nextStep: "Expose reports, queues, decisions, verified-owner labels, and hidden-content states.",
    acceptance: "A reported review enters a queue and can be dismissed or actioned by a moderator.",
  },
  {
    id: "controller-handheld-mode",
    title: "Controller and handheld mode",
    area: "polish",
    status: "planned",
    priority: "P1",
    userValue: "The launcher works from a couch, handheld PC, or TV without mouse/keyboard friction.",
    currentState: "Settings mention overlay/FPS, but no ten-foot layout or focus model exists.",
    nextStep: "Add focus-visible navigation, large touch targets, gamepad shortcuts, and compact library mode.",
    acceptance: "Core browse/library/launch flows work with keyboard/controller focus only.",
  },
  {
    id: "privacy-telemetry-controls",
    title: "Privacy and telemetry controls",
    area: "trust",
    status: "planned",
    priority: "P1",
    userValue: "Users know what is scanned, stored, synced, or sent.",
    currentState: "Scanner consent and audit paths exist; broader telemetry preferences are not modeled.",
    nextStep: "Add privacy settings for crash reports, usage diagnostics, scan history, and data export/delete.",
    acceptance: "A user can disable telemetry and view/export/delete local launcher metadata.",
  },
  {
    id: "guides-and-lfg",
    title: "Guides, parties, and LFG",
    area: "community",
    status: "planned",
    priority: "P2",
    userValue: "Players can find help, teammates, builds, and sessions without leaving the launcher.",
    currentState: "Feed, forums, friends, and LFG-like components exist, but guides/party workflows are not complete.",
    nextStep: "Add guide posts, party invites, voice-room placeholders, and game-specific LFG filters.",
    acceptance: "A user can create an LFG post tied to a game and invite a friend from the launcher.",
  },
  {
    id: "linux-proton-compat",
    title: "Linux/Proton compatibility metadata",
    area: "native",
    status: "planned",
    priority: "P2",
    userValue: "Linux and handheld users know whether games run, need tweaks, or require another runtime.",
    currentState: "Game platforms exist, but no compatibility badges or runtime settings exist.",
    nextStep: "Add compatibility metadata, runtime selector, launch options, and warning states.",
    acceptance: "A game detail page can show compatibility and store per-game launch/runtime options.",
  },
  {
    id: "backup-restore",
    title: "Backup and restore",
    area: "library",
    status: "planned",
    priority: "P2",
    userValue: "Users can move to a new PC without redownloading everything.",
    currentState: "Install metadata exists, but no backup manifest/export/import flow exists.",
    nextStep: "Add backup manifest creation, restore validation, and library relink tools.",
    acceptance: "A backed-up install can be relinked and verified on another folder.",
  },
];

export async function listFeatureRoadmap(): Promise<FeatureRoadmapItem[]> {
  await wait();
  return ITEMS;
}

export function summarizeFeatureRoadmap(items: FeatureRoadmapItem[]) {
  const byStatus = countBy(items, (item) => item.status);
  const byArea = countBy(items, (item) => item.area);
  const p0Open = items.filter((item) => item.priority === "P0" && item.status !== "done").length;
  return { byStatus, byArea, p0Open };
}

function countBy<T extends string>(
  items: FeatureRoadmapItem[],
  getKey: (item: FeatureRoadmapItem) => T,
): Record<T, number> {
  return items.reduce(
    (acc, item) => {
      const key = getKey(item);
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    },
    {} as Record<T, number>,
  );
}

export const FEATURE_AREA_LABELS: Record<FeatureArea, string> = {
  native: "Native",
  library: "Library",
  commerce: "Commerce",
  subscription: "Cloud & Plus",
  community: "Community",
  trust: "Trust",
  polish: "Polish",
  developer: "Developer",
};

export const FEATURE_STATUS_LABELS: Record<FeatureStatus, string> = {
  done: "Done",
  partial: "Partial",
  planned: "Planned",
  blocked: "Blocked",
};

export const FEATURE_PRIORITY_LABELS: Record<FeaturePriority, string> = {
  P0: "P0",
  P1: "P1",
  P2: "P2",
};
