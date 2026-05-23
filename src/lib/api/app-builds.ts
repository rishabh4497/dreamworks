import { doc, getDoc, setDoc, deleteDoc, collection, getDocs } from "firebase/firestore";
import { getDb, COLLECTIONS, SUBCOLLECTIONS, getFirebaseAuth } from "../firebase";
import type { AppBuild, AppBranch, OSPlatform } from "../types";
import { uploadAsset } from "../platform";
import { getApp, saveApp } from "./apps";

function now() {
  return new Date().toISOString();
}

function requireUserId(): string {
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error("Sign in to use the developer portal.");
  return user.uid;
}

function stripUndefined<T extends Record<string, unknown>>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T;
}

export async function listBuilds(appId: string): Promise<AppBuild[]> {
  if (!appId) return [];
  const snap = await getDocs(collection(getDb(), COLLECTIONS.apps, appId, SUBCOLLECTIONS.appBuilds));
  const out: AppBuild[] = [];
  snap.forEach((d) => out.push(d.data() as AppBuild));
  return out.sort((a, b) => (a.uploadedAt < b.uploadedAt ? 1 : -1));
}

export interface CreateBuildInput {
  appId: string;
  buildLabel: string;
  notes: string;
  platforms: OSPlatform[];
  file?: File | Blob;
}

export async function createBuild(input: CreateBuildInput): Promise<AppBuild> {
  const userId = requireUserId();
  const id = "build-" + crypto.randomUUID();

  let assetUrl: string | undefined;
  let sizeBytes = 0;
  if (input.file) {
    const ext = input.file instanceof File ? input.file.name.split(".").pop() : "bin";
    const path = `apps/${input.appId}/builds/${id}.${ext || "bin"}`;
    const result = await uploadAsset(input.file, path);
    assetUrl = result.url;
    sizeBytes = result.sizeBytes;
  }

  const build: AppBuild = stripUndefined({
    id,
    appId: input.appId,
    buildLabel: input.buildLabel,
    notes: input.notes,
    sizeBytes,
    uploadedAt: now(),
    uploaderUserId: userId,
    platforms: input.platforms,
    assetUrl,
    status: "ready",
  }) as AppBuild;

  const ref = doc(getDb(), COLLECTIONS.apps, input.appId, SUBCOLLECTIONS.appBuilds, id);
  await setDoc(ref, build);
  await saveApp(input.appId, { latestBuildId: id });
  return build;
}

export async function setBranchLive(
  appId: string,
  branchName: string,
  buildId: string | undefined,
): Promise<void> {
  const app = await getApp(appId);
  if (!app) throw new Error(`App "${appId}" not found.`);
  const branches = app.branches ?? [];
  let found = false;
  const next: AppBranch[] = branches.map((b) => {
    if (b.name !== branchName) return b;
    found = true;
    return { ...b, liveBuildId: buildId, updatedAt: now() };
  });
  if (!found) {
    next.push({ name: branchName, liveBuildId: buildId, updatedAt: now() });
  }
  await saveApp(appId, { branches: next });
}

export async function deleteBuild(appId: string, buildId: string): Promise<void> {
  const ref = doc(getDb(), COLLECTIONS.apps, appId, SUBCOLLECTIONS.appBuilds, buildId);
  await deleteDoc(ref);
  const app = await getApp(appId);
  if (!app) return;
  const branches = (app.branches ?? []).map((b) =>
    b.liveBuildId === buildId ? { ...b, liveBuildId: undefined, updatedAt: now() } : b,
  );
  await saveApp(appId, {
    branches,
    latestBuildId: app.latestBuildId === buildId ? undefined : app.latestBuildId,
  });
}

export async function getBuild(appId: string, buildId: string): Promise<AppBuild | null> {
  const ref = doc(getDb(), COLLECTIONS.apps, appId, SUBCOLLECTIONS.appBuilds, buildId);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as AppBuild) : null;
}
