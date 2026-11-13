/**
 * Pricing — the one place an order's money is worked out.
 *
 * The rule this module exists to enforce: **a price never comes from the
 * browser**. The checkout sends a list of pieces (slug, quantity and the
 * choices made for each one) and this module turns that list into money by
 * asking the catalogue what each piece costs. A tampered request that
 * claims a dress costs 100 instead of 91,600 gets the real price, not the
 * one it asked for.
 *
 * The same module runs in the browser (to draw the summary) and on the
 * server (to decide what is actually charged). That is deliberate: the
 * customer sees the same numbers the server will use, and there is only
 * one set of rules to keep them in step.
 *
 * Everything here is in the store's base currency (PKR). The currency
 * layer converts for display; the money in an order is always kept in the
 * base currency so a later change of display currency never rewrites
 * history.
 */

import { getProductBySlug, type Measurements, type StitchingOption } from "@/lib/products";
import { discountAmount, validateDiscountCode } from "@/lib/discounts";

/** The currency the catalogue keeps every price in. */
export const BASE_CURRENCY = "PKR";

/**
 * What delivery costs.
 *
 * The shipping page promises free standard delivery, so this is 0. It is
 * a named constant rather than a magic number so that changing the
 * policy later is a one-line change and every total follows.
 */
export const SHIPPING_FLAT_RATE = 0;

/** The most pieces of one design a customer may order in one go. */
export const MAX_QUANTITY_PER_LINE = 10;

/** The most different pieces one order may hold. */
export const MAX_LINES_PER_ORDER = 20;

/* ------------------------------------------------------------------ *
 * Types
 * ------------------------------------------------------------------ */

/**
 * One line as the browser describes it.
 *
 * Notice what is *not* here: no price. The browser may ask for a piece,
 * but it may not say what it costs.
 */
export interface CartLineInput {
  /** The piece that was ordered. */
  slug: string;
  /** How many of it. */
  quantity: number;
  /** How it is to be made. */
  stitching?: StitchingOption;
  /** The ready-made size, for standard stitching. */
  size?: string;
  /** The sleeve lining, for standard stitching. */
  lining?: string;
  /** The customer's own measurements, for custom stitching. */
  measurements?: Measurements;
  /** What the customer asked us to add to this piece. */
  notes?: string;
}

/** One line, priced. */
export interface PricedLine {
  /** The piece that was ordered. */
  slug: string;
  /** The name of the piece at the time of the order. */
  name: string;
  /** The main picture of the piece. */
  image: string;
  /** The shelf the piece is on. */
  categoryLabel: string;
  /** The price of one piece, in the base currency. */
  unitPrice: number;
  /** How many of it. */
  quantity: number;
  /** The price of this line, in the base currency. */
  lineTotal: number;
  /** How it is to be made. */
  stitching: StitchingOption;
  /** The ready-made size, for standard stitching. */
  size?: string;
  /** The sleeve lining, for standard stitching. */
  lining?: string;
  /** The customer's own measurements, for custom stitching. */
  measurements?: Measurements;
  /** What the customer asked us to add to this piece. */
  notes?: string;
}

/** The money on an order, worked out. */
export interface PriceBreakdown {
  /** Every line, priced. */
  lines: PricedLine[];
  /** The sum of the lines, before the discount and the delivery. */
  subtotal: number;
  /** What delivery costs. */
  shipping: number;
  /** What the discount code takes off. */
  discount: number;
  /** The code that was applied, or "" when none was. */
  discountCode: string;
  /** The percentage that was taken off, or 0. */
  discountPercent: number;
  /** What the customer pays. */
  total: number;
  /** The currency all of it is in. */
  currency: string;
}

/** What `priceCart` tells the caller. */
export type PriceResult =
  | { ok: true; order: PriceBreakdown }
  | { ok: false; error: string };

/* ------------------------------------------------------------------ *
 * Pricing
 * ------------------------------------------------------------------ */

/**
 * Work out what an order costs.
 *
 * Every price comes from the catalogue. The only thing the browser is
 * believed about is *which* pieces were wanted and how many — and even
 * that is checked against the catalogue before it counts.
 */
export function priceCart(lines: CartLineInput[], discountCode: string): PriceResult {
  if (!Array.isArray(lines) || lines.length === 0) {
    return { ok: false, error: "Your cart is empty." };
  }

  if (lines.length > MAX_LINES_PER_ORDER) {
    return {
      ok: false,
      error: `An order can hold ${MAX_LINES_PER_ORDER} different pieces at once.`,
    };
  }

  const priced: PricedLine[] = [];

  for (const line of lines) {
    const slug = (line?.slug ?? "").trim();
    const product = getProductBySlug(slug);

    if (!product) {
      return {
        ok: false,
        error: "One of the pieces in your cart is no longer in our collection.",
      };
    }

    if (product.availability === "out_of_stock") {
      return {
        ok: false,
        error: `${product.name} has sold out. Please remove it to place your order.`,
      };
    }

    const quantity = Number(line?.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY_PER_LINE) {
      return {
        ok: false,
        error: `The quantity for ${product.name} is not valid.`,
      };
    }

    const stitching = line?.stitching ?? "standard";
    if (!product.stitching.includes(stitching)) {
      return {
        ok: false,
        error: `${product.name} is not available with that stitching.`,
      };
    }

    const unitPrice = product.price;
    const pricedLine: PricedLine = {
      slug: product.slug,
      name: product.name,
      image: product.image,
      categoryLabel: product.categoryLabel,
      unitPrice,
      quantity,
      lineTotal: unitPrice * quantity,
      stitching,
    };

    if (line?.size) pricedLine.size = line.size;
    if (line?.lining) pricedLine.lining = line.lining;
    if (line?.measurements) pricedLine.measurements = line.measurements;
    if (line?.notes) pricedLine.notes = line.notes;

    priced.push(pricedLine);
  }

  const subtotal = priced.reduce((sum, line) => sum + line.lineTotal, 0);

  // The code is checked against the one list of codes we accept. A code
  // we do not know simply takes nothing off — it is never an error, so a
  // stale code in the cart cannot block an order.
  const validation = validateDiscountCode(discountCode ?? "");
  const discount = validation.valid ? discountAmount(subtotal, validation.code) : 0;
  const shipping = SHIPPING_FLAT_RATE;
  const total = Math.max(0, subtotal - discount + shipping);

  return {
    ok: true,
    order: {
      lines: priced,
      subtotal,
      shipping,
      discount,
      discountCode: validation.valid ? validation.code : "",
      discountPercent: validation.valid ? validation.percent : 0,
      total,
      currency: BASE_CURRENCY,
    },
  };
}

/**
 * The same totals, worked out from lines that are already priced.
 *
 * The order summary on the checkout page draws the numbers the browser
 * has while the cart is still loading. It reads the catalogue the same
 * way `priceCart` does, so the screen and the invoice agree.
 */
export function summariseLines(lines: CartLineInput[]): PriceBreakdown {
  const result = priceCart(lines, "");
  return result.ok
    ? result.order
    : {
        lines: [],
        subtotal: 0,
        shipping: SHIPPING_FLAT_RATE,
        discount: 0,
        discountCode: "",
        discountPercent: 0,
        total: 0,
        currency: BASE_CURRENCY,
      };
}
