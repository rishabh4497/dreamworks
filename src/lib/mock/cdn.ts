import type {
  CdnNode,
  CdnRegion,
  DeltaPatch,
  DistributionStatPoint,
  DistributionStatsDoc,
  GameManifest,
  ManifestChunk,
} from "../types";

const NOW = Date.now();
const HOUR_MS = 3_600_000;

function isoMinusHours(h: number): string {
  return new Date(NOW - h * HOUR_MS).toISOString();
}

const NODE_DEFS: Array<Omit<CdnNode, "lastHeartbeatAt">> = [
  {
    id: "edge-na-east-01",
    region: "na-east",
    hostname: "cdn-iad-01.dreamworks.cdn",
    status: "online",
    throughputGbps: 12.4,
    loadPct: 72,
    activeClients: 18_420,
    cacheHitPct: 94.2,
  },
  {
    id: "edge-na-west-01",
    region: "na-west",
    hostname: "cdn-sjc-01.dreamworks.cdn",
    status: "online",
    throughputGbps: 9.1,
    loadPct: 54,
    activeClients: 11_840,
    cacheHitPct: 92.7,
  },
  {
    id: "edge-eu-west-01",
    region: "eu-west",
    hostname: "cdn-lhr-01.dreamworks.cdn",
    status: "online",
    throughputGbps: 14.6,
    loadPct: 81,
    activeClients: 22_310,
    cacheHitPct: 95.5,
  },
  {
    id: "edge-eu-central-01",
    region: "eu-central",
    hostname: "cdn-fra-01.dreamworks.cdn",
    status: "degraded",
    throughputGbps: 6.2,
    loadPct: 88,
    activeClients: 14_200,
    cacheHitPct: 88.1,
  },
  {
    id: "edge-ap-ne-01",
    region: "ap-northeast",
    hostname: "cdn-nrt-01.dreamworks.cdn",
    status: "online",
    throughputGbps: 8.3,
    loadPct: 61,
    activeClients: 9_770,
    cacheHitPct: 93.0,
  },
  {
    id: "edge-ap-se-01",
    region: "ap-southeast",
    hostname: "cdn-sin-01.dreamworks.cdn",
    status: "online",
    throughputGbps: 5.8,
    loadPct: 47,
    activeClients: 6_120,
    cacheHitPct: 91.4,
  },
  {
    id: "edge-sa-east-01",
    region: "sa-east",
    hostname: "cdn-gru-01.dreamworks.cdn",
    status: "maintenance",
    throughputGbps: 0.0,
    loadPct: 0,
    activeClients: 0,
    cacheHitPct: 0,
  },
  {
    id: "edge-oce-01",
    region: "oce",
    hostname: "cdn-syd-01.dreamworks.cdn",
    status: "online",
    throughputGbps: 3.4,
    loadPct: 39,
    activeClients: 4_510,
    cacheHitPct: 90.2,
  },
];

export const CDN_NODES: CdnNode[] = NODE_DEFS.map((n) => ({
  ...n,
  lastHeartbeatAt: isoMinusHours(0),
}));

function makeStats(region: CdnRegion, base: number): DistributionStatsDoc {
  const series: DistributionStatPoint[] = [];
  let total = 0;
  for (let h = 23; h >= 0; h--) {
    // Diurnal-ish curve: 0.5x at quiet hours, 1.5x at peak.
    const phase = ((h + 5) % 24) / 24;
    const wave = 0.8 + Math.sin(phase * Math.PI * 2) * 0.6;
    const bytes = Math.max(0, base * wave) * 1_000_000_000;
    total += bytes;
    series.push({
      bucket: isoMinusHours(h),
      region,
      bytesServed: Math.round(bytes),
      cacheHitPct: 88 + Math.random() * 8,
    });
  }
  return {
    region,
    series,
    totalBytes24h: Math.round(total),
    avgCacheHitPct: 92.4,
  };
}

export const DISTRIBUTION_STATS: DistributionStatsDoc[] = [
  makeStats("na-east", 28),
  makeStats("na-west", 21),
  makeStats("eu-west", 33),
  makeStats("eu-central", 18),
  makeStats("ap-northeast", 19),
  makeStats("ap-southeast", 11),
  makeStats("sa-east", 4),
  makeStats("oce", 7),
];

function makeChunks(count: number, sizeMin: number, sizeMax: number): ManifestChunk[] {
  const out: ManifestChunk[] = [];
  for (let i = 0; i < count; i++) {
    const sizeBytes = Math.round(sizeMin + Math.random() * (sizeMax - sizeMin));
    out.push({
      id: `chunk-${i.toString().padStart(4, "0")}`,
      hash: `sha256-${i.toString(16).padStart(8, "0")}${Math.random().toString(16).slice(2, 10)}`,
      sizeBytes,
      status: "fresh",
    });
  }
  return out;
}

const MANIFEST_GAME_IDS = [
  "black-myth-wukong",
  "cyberpunk-2077",
  "witcher-3",
  "red-dead-redemption-2",
  "gta-5",
];

export const GAME_MANIFESTS: GameManifest[] = MANIFEST_GAME_IDS.flatMap((gameId) => {
  const versions = ["1.4.0", "1.4.1", "1.5.0"];
  return versions.map((version, idx) => {
    const chunks = makeChunks(64 + idx * 4, 50_000_000, 220_000_000);
    return {
      id: `${gameId}__${version}`,
      gameId,
      version,
      releasedAt: isoMinusHours((versions.length - idx) * 24 * 14),
      totalBytes: chunks.reduce((acc, c) => acc + c.sizeBytes, 0),
      chunkCount: chunks.length,
      chunks,
    } satisfies GameManifest;
  });
});

export const DELTA_PATCHES: DeltaPatch[] = MANIFEST_GAME_IDS.flatMap((gameId) => {
  const transitions: Array<[string, string]> = [
    ["1.4.0", "1.4.1"],
    ["1.4.1", "1.5.0"],
    ["1.4.0", "1.5.0"],
  ];
  return transitions.map(([from, to], idx) => {
    const fullManifest = GAME_MANIFESTS.find((m) => m.id === `${gameId}__${to}`);
    const fullBytes = fullManifest?.totalBytes ?? 30_000_000_000;
    const changedCount = idx === 2 ? 22 : 6 + idx * 4;
    const changedChunkIds = Array.from({ length: changedCount }, (_, i) =>
      `chunk-${i.toString().padStart(4, "0")}`,
    );
    const deltaBytes = Math.round(fullBytes * (idx === 2 ? 0.28 : 0.08 + idx * 0.05));
    return {
      id: `${gameId}__${from}__${to}`,
      gameId,
      fromVersion: from,
      toVersion: to,
      releasedAt: isoMinusHours(24 * (10 - idx * 3)),
      changedChunkIds,
      deltaBytes,
      fullBytes,
      savingsPct: Math.round((1 - deltaBytes / fullBytes) * 100),
    } satisfies DeltaPatch;
  });
});
