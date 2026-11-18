/**
 * The offers the shop really runs — one source for every mention of them.
 *
 * The announcement bar, the product-page badges, the cart, the checkout and
 * the server-side pricing all read from this file, so a promise made on the
 * storefront cannot drift away from the amount actually charged.
 *
 * Two rules keep this file honest:
 *
 *   1. There is no code to type. The multi-buy discount is applied
 *      automatically once the cart holds enough dresses.
 *   2. Anything added here must be true on the server as well. The pricing
 *      module reads `multiBuy` directly; it never trusts a number sent by the
 *      browser.
 *
 * Assumptions:
 *   - Prices are whole units of the base currency (PKR).
 *   - `multiBuy.percentOff` is a whole percentage, taken off the sale subtotal
 *     (the sum of the lines after each piece's own sale price).
 *   - The discount is capped at the subtotal, so a total can never go below
 *     zero even if the catalogue is misconfigured.
 */

/** The automatic multi-buy offer. */
export const multiBuy = {
  /** How many dresses the cart must hold for the extra discount. */
  minItems: 2,
  /** Extra percentage taken off the sale subtotal. */
  percentOff: 10,
} as const;

/** The shipping promise repeated across the storefront. */
export const shippingOffer = {
  /** Delivery is free on every order. */
  free: true,
  /** The window customers are told to expect. */
  window: "within 2 weeks",
} as const;

/** The multi-buy offer, worded for customers. */
export const MULTI_BUY_LABEL = `Buy ${multiBuy.minItems} Dresses Get Extra ${multiBuy.percentOff}% Off`;

/** The free-shipping offer, worded for customers. */
export const FREE_SHIPPING_LABEL = `Free Shipping Worldwide ${shippingOffer.window}`;

/** The only two lines the announcement bar has to say. */
export const ANNOUNCEMENT_LINES = [MULTI_BUY_LABEL, FREE_SHIPPING_LABEL] as const;

/** The default announcement bar text, in the `|`-separated shape the bar reads. */
export const ANNOUNCEMENT_TEXT = ANNOUNCEMENT_LINES.join(" | ");

/** The two real offers shown beside a product. */
export const PRODUCT_OFFER_POINTS = [MULTI_BUY_LABEL, FREE_SHIPPING_LABEL] as const;

/** The label for the automatic discount line in the cart and the checkout. */
export const MULTI_BUY_DISCOUNT_LABEL = `Buy ${multiBuy.minItems} discount`;

/**
 * Internal marker stored with an order so the record says which offer was
 * applied. It is not a customer-facing code and can never be typed in.
 */
export const MULTI_BUY_DISCOUNT_REF = "BUY2";

/**
 * How much the multi-buy offer takes off a subtotal.
 *
 * @param subtotal  The sum of the lines, in whole units of the base currency.
 * @param itemCount The number of dresses in the cart (not the number of lines).
 *
 * The arithmetic stays in whole units: `subtotal` and `percentOff` are
 * integers, and the single `Math.round` turns any fractional unit into the
 * nearest whole one. The result is never negative and never larger than the
 * subtotal.
 */
export function multiBuyDiscount(subtotal: number, itemCount: number): number {
  if (itemCount < multiBuy.minItems) return 0;
  if (!Number.isFinite(subtotal) || subtotal <= 0) return 0;

  const wholeSubtotal = Math.round(subtotal);
  const discount = Math.round((wholeSubtotal * multiBuy.percentOff) / 100);

  return Math.min(wholeSubtotal, Math.max(0, discount));
}
