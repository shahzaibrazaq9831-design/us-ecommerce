/**
 * Currency helpers.
 *
 * All product prices in this store are kept in PKR (base currency) and are
 * converted to the visitor's selected currency with the rates below.
 *
 * The rates are placeholders — they are shaped so they can later be replaced
 * by a live API (e.g. an exchange-rate endpoint refreshed on an interval)
 * without touching anything else.
 */

export const exchangeRates: Record<string, number> = {
  PKR: 1,
  USD: 0.00358, // placeholder
  GBP: 0.0028,
  CAD: 0.00495,
  AUD: 0.00555,
  EUR: 0.0033,
  AED: 0.01316,
  SAR: 0.01343,
  QAR: 0.01304,
  BHD: 0.00135,
  NZD: 0.00605,
  MYR: 0.0168,
  SGD: 0.0048,
  ZAR: 0.0665,
  MUR: 0.166,
  JPY: 0.53,
  INR: 0.298,
  TRY: 0.122,
};

/** Currencies that are shown without decimals. */
const ZERO_DECIMAL_CURRENCIES = ["PKR", "JPY"];

/** Locale used to format each currency (en-PK renders "Rs 8,500"). */
const CURRENCY_LOCALES: Record<string, string> = {
  PKR: "en-PK",
};

export const DEFAULT_CURRENCY = "PKR";

/** Convert a base (PKR) amount into the target currency. */
export function convertAmount(amountInPKR: number, currency: string): number {
  const rate = exchangeRates[currency] ?? 1;
  return amountInPKR * rate;
}

/** Format a base (PKR) amount as a price in the target currency. */
export function formatCurrency(amountInPKR: number, currency: string): string {
  const converted = convertAmount(amountInPKR, currency);
  const zeroDecimals = ZERO_DECIMAL_CURRENCIES.includes(currency);
  const locale = CURRENCY_LOCALES[currency] ?? "en-US";

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: zeroDecimals ? 0 : 2,
      maximumFractionDigits: zeroDecimals ? 0 : 2,
    }).format(converted);
  } catch {
    return `${currency} ${converted.toFixed(zeroDecimals ? 0 : 2)}`;
  }
}
