import { listScanRuns } from "./scan-history";
import { useUiStore } from "@/stores/ui-store";
import { useAuthStore } from "@/stores/auth-store";
import { useLibraryStore } from "@/stores/library-store";
import { useWishlistStore } from "@/stores/wishlist-store";
import { usePaymentMethodsStore } from "@/stores/payment-methods-store";
import { useFamilyStore } from "@/stores/family-store";
import { useFollowingStore } from "@/stores/following-store";

function triggerDownload(filename: string, content: string): void {
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Builds and downloads a JSON bundle of the user's personal data. Reads from
 * the already-hydrated client stores plus the scan_history subcollection.
 * Payment-method entries are exported by brand + last4 only (no PAN).
 */
export async function exportUserBundle(uid: string): Promise<void> {
  const profile = useAuthStore.getState().profile;
  const ui = useUiStore.getState();
  const library = useLibraryStore.getState().entries;
  const wishlist = useWishlistStore.getState().entries;
  const payment = usePaymentMethodsStore.getState().cards.map((m) => ({
    brand: m.brand,
    last4: m.last4,
    expiryMonth: m.expiryMonth,
    expiryYear: m.expiryYear,
  }));
  const family = useFamilyStore.getState().members;
  const following = Object.keys(useFollowingStore.getState().handles);

  let scanHistory: Awaited<ReturnType<typeof listScanRuns>> = [];
  try {
    scanHistory = await listScanRuns(uid);
  } catch {
    scanHistory = [];
  }

  const bundle = {
    exportedAt: new Date().toISOString(),
    uid,
    profile,
    settings: ui.settings,
    notificationPrefs: ui.notificationPrefs,
    library,
    wishlist,
    paymentMethods: payment,
    family,
    following,
    scanHistory,
  };

  const stamp = new Date().toISOString().slice(0, 10);
  triggerDownload(`dreamworks-data-${stamp}.json`, JSON.stringify(bundle, null, 2));
}
