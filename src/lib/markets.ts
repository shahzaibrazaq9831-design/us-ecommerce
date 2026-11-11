/**
 * Price markets (regions) — the country/currency model of the storefront,
 * matching the live site: a fixed set of markets, each with one currency.
 *
 * A market is what the visitor picks ("United States", "Europe", …) and the
 * currency follows from it. The list is the rungebahar.com converter list —
 * the same six currencies, in the same order. Any country code can be mapped
 * onto a market: a supported market code maps to itself, other western
 * countries resolve to the Europe market, and everything else resolves to
 * the United States.
 */

export interface Market {
  /** Market code — "PK", "US", … or the pseudo-market "EU". */
  code: string;
  /** Display name including the currency, e.g. "United States (USD)". */
  name: string;
  /** ISO currency code used by this market. */
  currency: string;
  /** ISO 3166-1 alpha-2 flag suffix served by flagcdn ("eu" for Europe). */
  flag: string;
}

/** The markets this store sells to, in selector order (rungebahar.com order). */
export const MARKETS: Market[] = [
  { code: "US", name: "United States (USD)", currency: "USD", flag: "us" },
  { code: "EU", name: "Europe (EUR)", currency: "EUR", flag: "eu" },
  { code: "GB", name: "United Kingdom (GBP)", currency: "GBP", flag: "gb" },
  { code: "CA", name: "Canada (CAD)", currency: "CAD", flag: "ca" },
  { code: "AU", name: "Australia (AUD)", currency: "AUD", flag: "au" },
  { code: "PK", name: "Pakistan (PKR)", currency: "PKR", flag: "pk" },
];

/** Market used when auto-detection cannot resolve anything (live-site default). */
export const FALLBACK_MARKET: Market = MARKETS.find((m) => m.code === "US") ?? MARKETS[0];

/** Look up a market by its code (case-insensitive). */
export function getMarketByCode(code?: string | null): Market | undefined {
  if (!code) return undefined;
  const normalized = code.trim().toUpperCase();
  return MARKETS.find((m) => m.code === normalized);
}

/** Whether a code belongs to the supported market set. */
export function isSupportedMarketCode(code?: string | null): boolean {
  return Boolean(getMarketByCode(code));
}

/** Look up the market that uses a currency code (case-insensitive). */
export function getMarketByCurrency(currency?: string | null): Market | undefined {
  if (!currency) return undefined;
  const normalized = currency.trim().toUpperCase();
  return MARKETS.find((m) => m.currency === normalized);
}

/**
 * Country codes the store treats as "western" — every one of these resolves
 * to the Europe market unless it is one of the four markets with their own
 * currency (US, CA, GB, AU).
 */
const WESTERN_COUNTRY_CODES = new Set([
  "AD", "AL", "AT", "AU", "AX", "BA", "BE", "BG", "BY", "CA",
  "CH", "CY", "CZ", "DE", "DK", "EE", "ES", "EU", "FI", "FO",
  "FR", "GB", "GG", "GI", "GR", "HR", "HU", "IE", "IM", "IS",
  "IT", "JE", "LI", "LT", "LU", "LV", "MC", "MD", "ME", "MK",
  "MT", "NL", "NO", "NZ", "PL", "PT", "RO", "RS", "SE", "SI",
  "SJ", "SK", "SM", "UA", "US", "VA", "XK",
]);

/**
 * Map any country code onto a market: supported market codes map to
 * themselves, other western countries map to Europe, everything else
 * maps to the United States.
 */
export function normalizeMarketCode(countryCode?: string | null): string {
  const code = countryCode?.trim().toUpperCase() ?? "";
  if (isSupportedMarketCode(code)) return code;
  if (WESTERN_COUNTRY_CODES.has(code)) return "EU";
  return "US";
}
