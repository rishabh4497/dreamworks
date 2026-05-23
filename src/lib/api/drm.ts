import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { COLLECTIONS, getDb } from "../firebase";
import type {
  DrmLicense,
  HardwareFingerprint,
  LicenseVerifyResult,
} from "../types";

export async function listUserLicenses(userId: string): Promise<DrmLicense[]> {
  if (!userId) return [];
  const q = query(
    collection(getDb(), COLLECTIONS.drmLicenses),
    where("userId", "==", userId),
  );
  const snap = await getDocs(q);
  const out: DrmLicense[] = [];
  snap.forEach((d) => out.push(d.data() as DrmLicense));
  return out.sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
}

export async function getLicense(licenseId: string): Promise<DrmLicense | null> {
  const ref = doc(getDb(), COLLECTIONS.drmLicenses, licenseId);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as DrmLicense) : null;
}

export async function activateLicense(input: {
  licenseId: string;
  fingerprint: HardwareFingerprint;
}): Promise<LicenseVerifyResult> {
  const { licenseId, fingerprint } = input;
  const license = await getLicense(licenseId);
  if (!license) return { ok: false, reason: "not-found" };
  if (license.status === "revoked") return { ok: false, reason: "revoked", license };
  if (license.expiresAt && new Date(license.expiresAt).getTime() < Date.now()) {
    return { ok: false, reason: "expired", license };
  }

  const existing = license.activations.find((a) => a.hash === fingerprint.hash);
  let activations = license.activations;
  if (existing) {
    activations = license.activations.map((a) =>
      a.hash === fingerprint.hash ? { ...a, lastSeenAt: fingerprint.lastSeenAt } : a,
    );
  } else {
    if (license.activations.length >= license.maxActivations) {
      return { ok: false, reason: "activation-limit", license };
    }
    activations = [...license.activations, fingerprint];
  }

  const updated: DrmLicense = {
    ...license,
    status: license.status === "pending" ? "active" : license.status,
    activations,
  };
  await setDoc(doc(getDb(), COLLECTIONS.drmLicenses, licenseId), updated);
  return { ok: true, license: updated };
}

export async function deactivateLicense(input: {
  licenseId: string;
  hash: string;
}): Promise<void> {
  const license = await getLicense(input.licenseId);
  if (!license) return;
  const updated: DrmLicense = {
    ...license,
    activations: license.activations.filter((a) => a.hash !== input.hash),
  };
  await setDoc(doc(getDb(), COLLECTIONS.drmLicenses, input.licenseId), updated);
}

export async function verifyLicense(input: {
  licenseId: string;
  hash: string;
}): Promise<LicenseVerifyResult> {
  const license = await getLicense(input.licenseId);
  if (!license) return { ok: false, reason: "not-found" };
  if (license.status === "revoked") return { ok: false, reason: "revoked", license };
  if (license.expiresAt && new Date(license.expiresAt).getTime() < Date.now()) {
    return { ok: false, reason: "expired", license };
  }
  const found = license.activations.some((a) => a.hash === input.hash);
  if (!found) return { ok: false, reason: "hardware-mismatch", license };
  return { ok: true, license };
}
