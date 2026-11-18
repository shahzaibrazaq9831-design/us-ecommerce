/**
 * Shipping countries — the countries the checkout will deliver to.
 *
 * The live shop promises delivery to more than 200 countries. The currency
 * selector still uses six price markets, so every country is mapped onto one
 * of those markets here. That gives the checkout a real country list and a
 * single answer to "which currency does this address pay in?"
 */

import { marketCurrency, normalizeMarketCode } from "@/lib/markets";

/** ISO 3166-1 alpha-2 codes, plus the commonly used XK for Kosovo. */
const COUNTRY_CODES = [
  "AD", "AE", "AF", "AG", "AI", "AL", "AM", "AO", "AQ", "AR", "AS", "AT", "AU", "AW", "AX", "AZ",
  "BA", "BB", "BD", "BE", "BF", "BG", "BH", "BI", "BJ", "BL", "BM", "BN", "BO", "BQ", "BR", "BS", "BT", "BV", "BW", "BY", "BZ",
  "CA", "CC", "CD", "CF", "CG", "CH", "CI", "CK", "CL", "CM", "CN", "CO", "CR", "CU", "CV", "CW", "CX", "CY", "CZ",
  "DE", "DJ", "DK", "DM", "DO", "DZ",
  "EC", "EE", "EG", "EH", "ER", "ES", "ET",
  "FI", "FJ", "FK", "FM", "FO", "FR",
  "GA", "GB", "GD", "GE", "GF", "GG", "GH", "GI", "GL", "GM", "GN", "GP", "GQ", "GR", "GS", "GT", "GU", "GW", "GY",
  "HK", "HM", "HN", "HR", "HT", "HU",
  "ID", "IE", "IL", "IM", "IN", "IO", "IQ", "IR", "IS", "IT",
  "JE", "JM", "JO", "JP",
  "KE", "KG", "KH", "KI", "KM", "KN", "KP", "KR", "KW", "KY", "KZ",
  "LA", "LB", "LC", "LI", "LK", "LR", "LS", "LT", "LU", "LV", "LY",
  "MA", "MC", "MD", "ME", "MF", "MG", "MH", "MK", "ML", "MM", "MN", "MO", "MP", "MQ", "MR", "MS", "MT", "MU", "MV", "MW", "MX", "MY", "MZ",
  "NA", "NC", "NE", "NF", "NG", "NI", "NL", "NO", "NP", "NR", "NU", "NZ",
  "OM",
  "PA", "PE", "PF", "PG", "PH", "PK", "PL", "PM", "PN", "PR", "PS", "PT", "PW", "PY",
  "QA",
  "RE", "RO", "RS", "RU", "RW",
  "SA", "SB", "SC", "SD", "SE", "SG", "SH", "SI", "SJ", "SK", "SL", "SM", "SN", "SO", "SR", "SS", "ST", "SV", "SX", "SY", "SZ",
  "TC", "TD", "TF", "TG", "TH", "TJ", "TK", "TL", "TM", "TN", "TO", "TR", "TT", "TV", "TW", "TZ",
  "UA", "UG", "UM", "US", "UY", "UZ",
  "VA", "VC", "VE", "VG", "VI", "VN", "VU",
  "WF", "WS",
  "YE", "YT",
  "ZA", "ZM", "ZW",
  "XK",
] as const;

export interface ShippingCountry {
  /** ISO alpha-2 code used in the form and on the order. */
  code: string;
  /** Name shown in the country list. */
  name: string;
  /** Price market the country belongs to (US, EU, GB, CA, AU or PK). */
  marketCode: string;
  /** Currency the customer sees and pays in. */
  currency: string;
}

let regionNames: Intl.DisplayNames | undefined;
try {
  regionNames = new Intl.DisplayNames(["en"], { type: "region" });
} catch {
  // Very old runtimes fall back to showing the code itself.
}

function countryName(code: string): string {
  try {
    return regionNames?.of(code) ?? code;
  } catch {
    return code;
  }
}

/** The countries in the checkout selector, sorted by display name. */
export const SHIPPING_COUNTRIES: ShippingCountry[] = COUNTRY_CODES.map((code) => {
  const marketCode = normalizeMarketCode(code);
  return {
    code,
    name: countryName(code),
    marketCode,
    currency: marketCurrency(marketCode),
  };
}).sort((a, b) => a.name.localeCompare(b.name));

/** Fast lookup for validation. */
export const SHIPPING_COUNTRY_CODES = new Set<string>(SHIPPING_COUNTRIES.map((country) => country.code));

/** Accept the familiar "UK" alias for the ISO code "GB". */
export function normalizeCountryCode(code?: string | null): string {
  const normalized = code?.trim().toUpperCase() ?? "";
  return normalized === "UK" ? "GB" : normalized;
}

/** Whether the code is one of the countries we deliver to. */
export function isSupportedShippingCountry(code?: string | null): boolean {
  return SHIPPING_COUNTRY_CODES.has(normalizeCountryCode(code));
}

/** The price market a country belongs to. */
export function countryMarketCode(code?: string | null): string {
  return normalizeMarketCode(normalizeCountryCode(code));
}

/** The currency used for a shipping country. */
export function countryCurrency(code?: string | null): string {
  return marketCurrency(countryMarketCode(code));
}
