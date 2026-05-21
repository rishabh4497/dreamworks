import type { DetectedGame } from "./types";

// Stub scanners for the v2/v3 launchers. Each one keeps a stable signature so
// the orchestrator and UI can render a row per launcher today, and we just
// fill in the body when we implement each format.

export async function scanGog(): Promise<DetectedGame[]> {
  // TODO: implement gog detection — see plan §B.1
  return [];
}

export async function scanEa(): Promise<DetectedGame[]> {
  // TODO: implement ea-app detection — see plan §B.1
  return [];
}

export async function scanUbisoft(): Promise<DetectedGame[]> {
  // TODO: implement ubisoft detection — see plan §B.1
  return [];
}

export async function scanXbox(): Promise<DetectedGame[]> {
  // TODO: implement xbox-pc detection — see plan §B.1
  return [];
}

export async function scanRockstar(): Promise<DetectedGame[]> {
  // TODO: implement rockstar detection — see plan §B.1
  return [];
}

export async function scanBattleNet(): Promise<DetectedGame[]> {
  // TODO: implement battlenet detection — see plan §B.1
  return [];
}

export async function scanAmazon(): Promise<DetectedGame[]> {
  // TODO: implement amazon detection — see plan §B.1
  return [];
}
