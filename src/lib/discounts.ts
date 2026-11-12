/**
 * Discount codes — the single place a code is checked.
 *
 * The cart page, the cart drawer and the checkout all call
 * `validateDiscountCode`, so a code can never be accepted in one place
 * and rejected in another. Adding a code means adding one line here.
 *
 * The percentages are plain numbers so the money maths stays in one
 * place too: `discountAmount` is the only function that turns a code
 * into money.
 */

/** One discount code and what it does. */
export interface DiscountCode {
  /** The code exactly as the customer types it. */
  code: string;
  /** Percentage taken off the subtotal. */
  percent: number;
  /** Short description shown next to the code in the cart. */
  label: string;
}

/** Every discount code the store accepts, keyed by its upper-case code. */
export const DISCOUNT_CODES: Record<string, DiscountCode> = {
  PPD10: {
    code: "PPD10",
    percent: 10,
    label: "10% off your order",
  },
};

/** The code we advertise on the storefront. */
export const DEFAULT_DISCOUNT_CODE = "PPD10";

/** What `validateDiscountCode` tells the caller. */
export interface DiscountValidation {
  /** True when the code is one we accept. */
  valid: boolean;
  /** The accepted code in its canonical (upper-case) form. */
  code: string;
  /** Percentage taken off, or 0 when the code is not valid. */
  percent: number;
  /** A sentence for the customer. */
  message: string;
}

/**
 * Check a discount code. The comparison ignores case and surrounding
 * spaces, because customers paste these codes.
 */
export function validateDiscountCode(input: string): DiscountValidation {
  const code = (input ?? "").trim().toUpperCase();

  if (!code) {
    return { valid: false, code: "", percent: 0, message: "Enter a discount code." };
  }

  const discount = DISCOUNT_CODES[code];
  if (!discount) {
    return {
      valid: false,
      code,
      percent: 0,
      message: "That discount code is not valid.",
    };
  }

  return {
    valid: true,
    code: discount.code,
    percent: discount.percent,
    message: `${discount.code} applied — ${discount.label}.`,
  };
}

/**
 * How much money the code takes off a subtotal. Rounded to the nearest
 * whole unit so the totals always add up on screen.
 */
export function discountAmount(subtotal: number, code: string): number {
  const validation = validateDiscountCode(code);
  if (!validation.valid || subtotal <= 0) return 0;
  return Math.round((subtotal * validation.percent) / 100);
}
