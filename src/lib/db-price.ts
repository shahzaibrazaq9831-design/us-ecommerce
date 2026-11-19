/**
 * The one translation between the `products` price columns and the price the
 * storefront shows.
 *
 * The dashboard table has two price columns:
 *
 *   price_cents      — the regular (compare-at) price
 *   sale_price_cents — the reduced price currently charged, or null
 *
 * The column names say "cents", but the admin form has always accepted whole
 * PKR rupees ("Price (PKR)"), so the values are whole rupees. Keeping the
 * conversion in this small module means the storefront, the admin, the seed
 * script and the CSV updater can never disagree about it.
 *
 * The reader also accepts the order used by the original seed script (the two
 * columns the other way round), so existing rows show the right price without
 * a migration or a reseed.
 */

/** The shape of the two price columns as they come back from Supabase. */
export interface DbPriceRow {
  price_cents: number | string | null;
  sale_price_cents: number | string | null;
}

/** A price as the storefront understands it: current + optional compare-at. */
export interface StorefrontPrice {
  /** What the customer pays, in whole PKR. */
  price: number;
  /** The struck-through compare-at price, or null when full price. */
  compareAt: number | null;
}

/** The two columns to write for a given storefront price. */
export interface DbPriceColumns {
  price_cents: number;
  sale_price_cents: number | null;
}

function rupees(value: number | string | null | undefined): number {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? Math.round(amount) : 0;
}

/**
 * Read the current and compare-at price from a database row.
 *
 * Canonical rows store the regular price in `price_cents` and the reduced
 * price in `sale_price_cents`. Older rows wrote them the other way round;
 * whichever value is lower is the price the customer pays.
 */
export function priceFromDb(row: DbPriceRow): StorefrontPrice {
  const first = rupees(row.price_cents);
  const second =
    row.sale_price_cents === null || row.sale_price_cents === undefined
      ? null
      : rupees(row.sale_price_cents);

  if (second === null || second <= 0 || second === first) {
    return { price: first, compareAt: null };
  }

  return second < first
    ? { price: second, compareAt: first }
    : { price: first, compareAt: second };
}

/**
 * Turn a storefront price into the two columns. The regular price always goes
 * in `price_cents`; a lower selling price goes in `sale_price_cents`.
 */
export function priceToDb(price: number, compareAt: number | null): DbPriceColumns {
  const current = rupees(price);
  const original = compareAt === null || compareAt === undefined ? null : rupees(compareAt);

  if (original === null || original <= current) {
    return { price_cents: current, sale_price_cents: null };
  }

  return { price_cents: original, sale_price_cents: current };
}
