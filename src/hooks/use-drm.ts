import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  activateLicense,
  deactivateLicense,
  listUserLicenses,
  verifyLicense,
} from "@/lib/api/drm";
import type { HardwareFingerprint } from "@/lib/types";

export const drmKeys = {
  userLicenses: (uid: string) => ["drm", "licenses", uid] as const,
};

export function useUserLicenses(userId: string | undefined) {
  return useQuery({
    queryKey: drmKeys.userLicenses(userId ?? ""),
    queryFn: () => listUserLicenses(userId ?? ""),
    enabled: Boolean(userId),
  });
}

export function useActivateLicense(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { licenseId: string; fingerprint: HardwareFingerprint }) =>
      activateLicense(input),
    onSuccess: () => {
      if (userId) qc.invalidateQueries({ queryKey: drmKeys.userLicenses(userId) });
    },
  });
}

export function useDeactivateLicense(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { licenseId: string; hash: string }) => deactivateLicense(input),
    onSuccess: () => {
      if (userId) qc.invalidateQueries({ queryKey: drmKeys.userLicenses(userId) });
    },
  });
}

export function useVerifyLicense() {
  return useMutation({
    mutationFn: (input: { licenseId: string; hash: string }) => verifyLicense(input),
  });
}
