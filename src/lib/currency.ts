/**
 * Currency helpers — single source of truth for the storefront.
 *
 * All product prices in this store are kept in PKR (the base currency) and are
 * converted to the visitor's selected currency with the rates below. Prices are
 * always handled in the base value and only rounded/format at display time.
 *
 * The rates are fetched server-side from a free exchange-rate API and cached
 * for 12 hours (`next: { revalidate: 43200 }`). If the request fails the static
 * fallback rates are used, so prices never break.
 */

/** Currency all product prices are stored in (base currency of the store). */
export const BASE_CURRENCY = "PKR";

export interface Currency {
  /** ISO currency code, e.g. "USD". Also the value persisted/selected. */
  code: string;
  /** Short display name, e.g. "US Dollar". */
  name: string;
  /** ISO 3166-1 alpha-2 flag file suffix served by flagcdn. */
  flag: string;
  /** Intl currency symbol (informational; formatting is done through Intl). */
  symbol: string;
  /** Decimal places used when formatting (0 for PKR, 2 for the others). */
  decimals: number;
  /** BCP-47 locale used for Intl.NumberFormat. */
  locale: string;
}

/**
 * The only currencies this store sells/accepts, in display order:
 * USD, EUR, GBP, CAD, AUD, PKR — matching the reference store.
 */
export const CURRENCIES: Currency[] = [
  { code: "USD", name: "US Dollar", flag: "us", symbol: "$", decimals: 2, locale: "en-US" },
  { code: "EUR", name: "Euro", flag: "eu", symbol: "€", decimals: 2, locale: "en-IE" },
  { code: "GBP", name: "British Pound", flag: "gb", symbol: "£", decimals: 2, locale: "en-GB" },
  { code: "CAD", name: "Canadian Dollar", flag: "ca", symbol: "CA$", decimals: 2, locale: "en-CA" },
  { code: "AUD", name: "Australian Dollar", flag: "au", symbol: "AU$", decimals: 2, locale: "en-AU" },
  { code: "PKR", name: "Pakistani Rupee", flag: "pk", symbol: "Rs", decimals: 0, locale: "en-PK" },
];

/** Static fallback rates (base PKR → target currency). */
export const STATIC_RATES: Record<string, number> = {
  PKR: 1,
  USD: 0.00358,
  EUR: 0.0033,
  GBP: 0.0028,
  CAD: 0.00495,
  AUD: 0.00555,
};

/** Live rates, swapped by `getExchangeRates()` when the API responds. */
export const exchangeRates: Record<string, number> = { ...STATIC_RATES };

const RATES_URL = "https://open.er-api.com/v6/latest/pkr";
const RATES_REVALIDATE_SECONDS = 60 * 60 * 24; // 12 hours

/** Fetch the latest base → target conversion rates (server-side, cached 12h). */
export async function getExchangeRates(): Promise<Record<string, number>> {
  try {
    const response = await fetch(RATES_URL, { next: { revalidate: RATES_REVALIDATE_SECONDS } });
    if (response.ok) {
      const data = (await response.json()) as { rates?: Record<string, number> };
      if (data && typeof data.rates === "object") {
        return { ...exchangeRates, ...data.rates };
      }
    }
  } catch {
    // API unreachable / failed → keep the static fallback rates.
  }
  return { ...exchangeRates };
}

/** Look up a supported currency by code (case-insensitive). */
export function getCurrencyByCode(code?: string | null): Currency | undefined {
  if (!code) return undefined;
  const normalized = code.trim().toUpperCase();
  return CURRENCIES.find((c) => c.code === normalized);
}

/** Whether a currency code belongs to the supported set. */
export function isSupportedCurrency(code?: string | null): boolean {
  const currency = getCurrencyByCode(code);
  return Boolean(currency);
}

/** Auto-detect the visitor's currency (placeholder defaults to the store base). */
export function detectCurrency(): string {
  // Auto-detection: the store is Pakistan-first today, so PKR is the default.
  return BASE_CURRENCY;
}

/**
 * Resolve the currency to use: explicit cookie value first, then the
 * auto-detected one, then a safe fallback (USD, or PKR for Pakistan).
 */
export function resolveCurrency(cookieValue?: string | null): string {
  const normalized = cookieValue?.trim().toUpperCase();
  const fromCookie = normalized ? getCurrencyByCode(normalized) : undefined;
  if (fromCookie) return fromCookie.code;

  const detected = detectCurrency();
  const detectedCurrency = getCurrencyByCode(detected);
  if (detectedCurrency) return detectedCurrency.code;

  // Detected currency is not one of the six supported → fall back to USD
  // (PKR for visitors in Pakistan).
  return detected === "PKR" ? "PKR" : "USD";
}

/** Conversion rate from the base currency to the target currency. */
export function getRate(currencyCode: string, rates: Record<string, number> = exchangeRates): number {
  const currency = getCurrencyByCode(currencyCode) ?? getCurrencyByCode(BASE_CURRENCY);
  const code = currency?.code ?? BASE_CURRENCY;
  return rates[code] ?? rates[BASE_CURRENCY] ?? 1;
}

/** Convert a base (PKR) amount into the target currency. Rounding happens at display. */
export function convertPrice(amountInBase: number, currencyCode: string, rates: Record<string, number> = exchangeRates): number {
  return amountInBase * getRate(currencyCode, rates);
}

/** Format a base (PKR) amount as a price in the target currency (Intl). */
export function formatPrice(amount: number, currencyCode: string, rates: Record<string, number> = exchangeRates): string {
  const currency = getCurrencyByCode(currencyCode) ?? getCurrencyByCode(BASE_CURRENCY);
  const converted = convertPrice(amount, currency?.code ?? BASE_CURRENCY, rates);
  const decimals = currency?.decimals ?? 2;

  try {
    return new Intl.NumberFormat(currency?.locale ?? "en-US", {
      style: "currency",
      currency: currency?.code ?? BASE_CURRENCY,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(converted);
  } catch {
    return `${currency?.code ?? BASE_CURRENCY} ${converted.toFixed(decimals)}`;
  }
}
