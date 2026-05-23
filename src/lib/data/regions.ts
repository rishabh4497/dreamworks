import type { Currency } from "../types";

export interface RegionPreset {
  region: string;
  currency: Currency;
  // suggested multiplier vs. USD base (purchasing-power bands borrowed from
  // Steam's recommended regional pricing). Multiplied against the dollar base
  // price (after dividing by 100) and re-multiplied to cents.
  ppMultiplier: number;
}

export const REGION_PRESETS: RegionPreset[] = [
  { region: "United States", currency: "USD", ppMultiplier: 1.0 },
  { region: "European Union", currency: "EUR", ppMultiplier: 0.95 },
  { region: "United Kingdom", currency: "GBP", ppMultiplier: 0.85 },
  { region: "Japan", currency: "JPY", ppMultiplier: 110 },
  { region: "Brazil", currency: "BRL", ppMultiplier: 2.1 },
  { region: "India", currency: "INR", ppMultiplier: 32 },
  { region: "Canada", currency: "CAD", ppMultiplier: 1.35 },
  { region: "Australia", currency: "AUD", ppMultiplier: 1.5 },
];

export function suggestRegionalPrice(
  baseUsdCents: number,
  preset: RegionPreset,
): number {
  const baseDollars = baseUsdCents / 100;
  return Math.round(baseDollars * preset.ppMultiplier * 100);
}
