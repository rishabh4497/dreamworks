import type { Currency, GameId, RegionalPrice } from "../types";
import { getSeedById } from "./games";

/**
 * Per-region multipliers, expressed as a fraction of the canonical India
 * (INR) price. India is the storefront's primary currency post-sprint, so
 * its multiplier is 1.0; the rest are rough conversions and are mostly
 * informational — `formatPrice` renders everything as ₹ today, so the chart
 * is for shape, not strict per-currency accuracy.
 */
const REGIONS: { region: string; currency: Currency; multiplier: number; usdRate: number }[] = [
  // India must be first — it's the primary entry surfaced in the UI.
  { region: "India", currency: "INR", multiplier: 1.0, usdRate: 0.012 },
  // Other regions are approximated from the INR base using rough FX rates.
  // Values are stored in the same `paise` minor unit as the rest of the
  // catalog so the magnitudes line up on charts.
  { region: "United States", currency: "USD", multiplier: 1.0 / 80, usdRate: 1.0 },
  { region: "United Kingdom", currency: "GBP", multiplier: 1.0 / 100, usdRate: 1.27 },
  { region: "European Union", currency: "EUR", multiplier: 1.0 / 90, usdRate: 1.08 },
  { region: "Canada", currency: "CAD", multiplier: 1.0 / 60, usdRate: 0.74 },
  { region: "Australia", currency: "AUD", multiplier: 1.0 / 55, usdRate: 0.66 },
  { region: "Japan", currency: "JPY", multiplier: 110.0 / 80, usdRate: 0.0067 },
  { region: "Brazil", currency: "BRL", multiplier: 1.0 / 16, usdRate: 0.2 },
];

export function buildRegionalPrices(gameId: GameId): RegionalPrice[] {
  const seed = getSeedById(gameId);
  if (!seed) return [];
  // Canonical price is the seed's INR-paise value.
  const baseInrPaise = seed.finalCents ?? seed.baseCents;

  return REGIONS.map((r) => {
    const localPriceCents = Math.round(baseInrPaise * r.multiplier);
    const usdEquivalentCents = Math.round(localPriceCents * r.usdRate);
    return {
      region: r.region,
      currency: r.currency,
      price: localPriceCents,
      usdEquivalentCents,
    };
  });
}
