/**
 * Payments — the one door every payment comes through.
 *
 * The storefront does not know which provider takes the money. It asks
 * this module to start a payment and it gets back either a link to send
 * the customer to or a note that the money will be collected on
 * delivery. Swapping Stripe for another provider means writing one
 * more implementation of the two functions at the bottom of this file
 * and changing one line — nothing else in the app moves.
 *
 * Three rules this module keeps:
 *
 *   1. **No card data, ever.** The card is entered on the provider's
 *      own hosted page. This store never sees a card number, never
 *      stores one, and never sends one to the browser.
 *   2. **The amount is decided on the server.** The prices come from
 *      the catalogue (see `@/lib/pricing`), and this module converts
 *      that total into the currency the provider charges in.
 *   3. **Only the webhook marks an order paid.** A browser saying "I
 *      paid" proves nothing; the provider's signed webhook does.
 *
 * Everything here is server-only. It reads secrets from the environment
 * and must never be imported by a client component.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import Stripe from "stripe";
import { expireOrder, markOrderPaid, type StoredOrder } from "@/lib/orders";
import { BASE_CURRENCY } from "@/lib/pricing";
import { stitchingLabels } from "@/lib/products";

/* ------------------------------------------------------------------ *
 * Types
 * ------------------------------------------------------------------ */

/** How the customer is paying. The names match the ones on an order. */
export type PaymentMethod = "card" | "cod";

/** What starting a payment gives back. */
export type PaymentStart =
  /** Send the customer to this address to pay. */
  | { kind: "redirect"; url: string; reference: string }
  /** The money is collected when the parcel arrives. */
  | { kind: "cod"; reference: string };

/** What handling a provider event gives back. */
export type PaymentEventOutcome =
  /** The order was paid. */
  | { action: "paid"; order: StoredOrder; alreadyPaid: boolean }
  /** The payment was never completed and the order was closed. */
  | { action: "expired"; order: StoredOrder }
  /** Nothing to do for this event. */
  | { action: "ignored"; reason: string };

/* ------------------------------------------------------------------ *
 * Configuration
 *
 * Every secret comes from the environment and is read at request time,
 * so a secret is never baked into a build and never reaches a browser.
 * ------------------------------------------------------------------ */

/** The secret key from the Stripe dashboard. */
function stripeSecretKey(): string {
  return process.env.STRIPE_SECRET_KEY?.trim() ?? "";
}

/** The signing secret of the Stripe webhook. */
function stripeWebhookSecret(): string {
  return process.env.STRIPE_WEBHOOK_SECRET?.trim() ?? "";
}

/** The Stripe client, made once and kept. */
let stripeClient: Stripe | null = null;

/** The Stripe client, or null when Stripe is not set up on this server. */
function stripe(): Stripe | null {
  const key = stripeSecretKey();
  if (!key) return null;

  if (!stripeClient) {
    stripeClient = new Stripe(key, { appInfo: { name: "Rung E Bahar" } });
  }

  return stripeClient;
}

/** Can this server take a card payment at all? */
export function isCardPaymentEnabled(): boolean {
  return stripe() !== null;
}

/**
 * Is cash on delivery on?
 *
 * Switched with the `COD_ENABLED` environment variable. It is on unless
 * the variable says otherwise, so a fresh server works out of the box.
 */
export function isCashOnDeliveryEnabled(): boolean {
  const raw = process.env.COD_ENABLED?.trim().toLowerCase();

  if (!raw) return true;
  if (raw === "false" || raw === "0" || raw === "no" || raw === "off") return false;

  return true;
}

/** The ways a customer may pay on this server. */
export function availablePaymentMethods(): PaymentMethod[] {
  const methods: PaymentMethod[] = [];

  if (isCardPaymentEnabled()) methods.push("card");
  if (isCashOnDeliveryEnabled()) methods.push("cod");

  return methods;
}

/**
 * The currency the provider charges in.
 *
 * The visitor's chosen currency is used when the provider takes it, so
 * the amount on the payment page is the amount they saw on the site.
 * Otherwise the `PAYMENT_CURRENCY` variable decides, and the store's
 * base currency is the last resort.
 */
export function resolveChargeCurrency(requested?: string | null): string {
  const wanted = (requested ?? "").trim().toUpperCase();

  if (wanted && SUPPORTED_CHARGE_CURRENCIES.includes(wanted)) return wanted;

  const fallback = (process.env.PAYMENT_CURRENCY ?? "").trim().toUpperCase();
  if (fallback && SUPPORTED_CHARGE_CURRENCIES.includes(fallback)) return fallback;

  return DEFAULT_CHARGE_CURRENCY;
}

/** The currencies the payment provider is asked to charge in. */
export const SUPPORTED_CHARGE_CURRENCIES = [
  "USD",
  "EUR",
  "GBP",
  "CAD",
  "AUD",
  "NZD",
  "CHF",
  "SEK",
  "NOK",
  "DKK",
  "SGD",
  "HKD",
  "JPY",
  "INR",
  "AED",
  "SAR",
  "ZAR",
];

/** The currency charged in when nothing better is known. */
export const DEFAULT_CHARGE_CURRENCY = "USD";

/**
 * The currencies with no minor unit — 1000 rupees is 1000, not 10.00.
 *
 * These are the currencies the provider counts in whole units.
 */
const ZERO_DECIMAL_CURRENCIES = [
  "BIF",
  "CLP",
  "DJF",
  "GNF",
  "JPY",
  "KMF",
  "KRW",
  "MGA",
  "PYG",
  "RWF",
  "UGX",
  "VND",
  "VUV",
  "XAF",
  "XOF",
  "XPF",
];

/**
 * The currencies with three decimals — the dinar and the riyal among
 * them. One dinar is a thousand fils, so the amount is a thousand
 * times the whole number.
 */
const THREE_DECIMAL_CURRENCIES = [
  "BHD",
  "IQD",
  "JOD",
  "KWD",
  "LYD",
  "OMR",
  "TND",
];

/**
 * How many minor units make one whole of this currency.
 *
 * 100 for the usual two-decimal currencies, 1 for the ones with no
 * minor unit, 1000 for the three-decimal ones.
 */
export function minorUnitFactor(currency: string): number {
  const code = (currency ?? "").trim().toUpperCase();

  if (ZERO_DECIMAL_CURRENCIES.includes(code)) return 1;
  if (THREE_DECIMAL_CURRENCIES.includes(code)) return 1000;

  return 100;
}

/** An amount in whole currency as the provider wants it. */
export function toMinorUnits(amount: number, currency: string): number {
  return Math.round((amount ?? 0) * minorUnitFactor(currency));
}

/* ------------------------------------------------------------------ *
 * Starting a payment
 * ------------------------------------------------------------------ */

/** What the caller tells us about where the customer is. */
export interface PaymentContext {
  /** The address of the site, so the provider can come back to it. */
  baseUrl: string;
  /** The currency to charge in. */
  currency: string;
}

/**
 * Start a card payment: a Stripe Checkout session the customer is sent
 * to.
 *
 * The amount is built here from the order's own totals — the price of
 * each piece and the discount that was applied to it — so the page the
 * customer sees adds up to the order we hold.
 */
export async function startCardPayment(
  order: StoredOrder,
  context: PaymentContext
): Promise<PaymentStart> {
  const client = stripe();
  if (!client) throw new Error("stripe-not-configured");

  const currency = context.currency.toLowerCase();

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = order.items.map(
    (item) => ({
      quantity: item.quantity,
      price_data: {
        currency,
        unit_amount: toMinorUnits(item.price ?? 0, context.currency),
        product_data: {
          name: item.name ?? item.slug,
          description: describeItem(item),
        },
      },
    })
  );

  const shipping = toMinorUnits(order.totals.shipping, context.currency);

  if (shipping > 0) {
    lineItems.push({
      quantity: 1,
      price_data: {
        currency,
        unit_amount: shipping,
        product_data: { name: "Delivery" },
      },
    });
  }

  // What the pieces and the delivery come to, in the currency the
  // provider counts in.
  const linesTotal = lineItems.reduce(
    (sum, line) =>
      sum +
      (line.price_data?.unit_amount ?? 0) * (line.quantity ?? 1),
    0
  );

  // What the customer owes, worked out on the server, in the same
  // currency.
  const target = toMinorUnits(order.totals.total, context.currency);

  // The discount is put on the session as a coupon, so the provider
  // takes exactly the amount that is left — the page the customer sees
  // adds up to the order we hold, to the cent. The amount is taken from
  // the lines themselves, so the rounding when the prices were
  // converted cannot leave a penny behind.
  const discounts: Stripe.Checkout.SessionCreateParams.Discount[] = [];
  const discountAmount = linesTotal - target;

  if (discountAmount > 0) {
    const coupon = await client.coupons.create({
      amount_off: discountAmount,
      currency,
      duration: "once",
      name: order.totals.discountCode
        ? `Discount ${order.totals.discountCode}`
        : "Discount",
    });

    discounts.push({ coupon: coupon.id });
  }

  const session = await client.checkout.sessions.create({
    mode: "payment",
    customer_email: order.customer.email,
    client_reference_id: order.id,
    metadata: { orderId: order.id },
    line_items: lineItems,
    ...(discounts.length > 0 ? { discounts } : {}),
    success_url: `${context.baseUrl}/order/${encodeURIComponent(order.id)}?payment=success`,
    // If the customer backs out of paying, they land on their order,
    // where they can try again — the order itself is already saved.
    cancel_url: `${context.baseUrl}/order/${encodeURIComponent(order.id)}?payment=cancelled`,
  });

  if (!session.url) throw new Error("stripe-no-url");

  return { kind: "redirect", url: session.url, reference: session.id };
}

/**
 * Continue a card payment that was started before.
 *
 * A customer who presses "Pay" twice, or whose request is sent again
 * because the connection dropped, must not end up with two live payment
 * pages: paying both would charge them twice. So an order that already
 * has a payment session keeps using it, and a new session is only made
 * when the old one has closed.
 */
export async function resumeCardPayment(
  order: StoredOrder,
  context: PaymentContext
): Promise<PaymentStart> {
  const client = stripe();
  if (!client) throw new Error("stripe-not-configured");

  const reference = order.payment?.reference ?? "";

  if (reference.startsWith("cs_")) {
    try {
      const session = await client.checkout.sessions.retrieve(reference);

      if (session.status === "open" && session.url) {
        return { kind: "redirect", url: session.url, reference: session.id };
      }
    } catch {
      // The session is gone or cannot be read; a new one is made below.
    }
  }

  return startCardPayment(order, context);
}

/**
 * Start a cash-on-delivery payment.
 *
 * There is nothing to start: the money is collected when the parcel
 * arrives, and the order is marked as paid by hand once it has.
 */
export function startCashOnDelivery(order: StoredOrder): PaymentStart {
  return { kind: "cod", reference: `cod_${order.id}` };
}

/**
 * Start a payment with whichever method the customer chose.
 */
export async function startPayment(
  order: StoredOrder,
  method: PaymentMethod,
  context: PaymentContext
): Promise<PaymentStart> {
  if (method === "cod") {
    if (!isCashOnDeliveryEnabled()) throw new Error("cod-disabled");
    return startCashOnDelivery(order);
  }

  if (!isCardPaymentEnabled()) throw new Error("stripe-not-configured");

  return startCardPayment(order, context);
}

/** A short description of how a piece is to be made. */
function describeItem(item: { stitching?: string; size?: string; lining?: string; notes?: string }): string {
  const parts: string[] = [];

  const stitching = item.stitching as keyof typeof stitchingLabels | undefined;
  if (stitching && stitchingLabels[stitching]) parts.push(stitchingLabels[stitching]);
  if (item.size) parts.push(`Size ${item.size}`);
  if (item.lining) parts.push(item.lining);
  if (item.notes) parts.push(item.notes);

  return parts.join(" · ");
}

/* ------------------------------------------------------------------ *
 * The webhook
 * ------------------------------------------------------------------ */

/**
 * Check the provider's signature and read the event.
 *
 * The raw body is what is signed, so it must be read as text and passed
 * in untouched — parsing and re-serialising it would change the bytes
 * and the signature would no longer match.
 */
export function verifyStripeEvent(payload: string, signature: string): Stripe.Event {
  const client = stripe();
  if (!client) throw new Error("stripe-not-configured");

  const secret = stripeWebhookSecret();
  if (!secret) throw new Error("stripe-webhook-secret-missing");

  return client.webhooks.constructEvent(payload, signature, secret);
}

/**
 * Do what a provider event means for an order.
 *
 * The provider may send the same event more than once, so every step
 * here has to be safe to repeat: marking an order paid twice changes
 * nothing, and an order that is already paid is left alone.
 */
export async function applyStripeEvent(event: Stripe.Event): Promise<PaymentEventOutcome> {
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId ?? session.client_reference_id ?? "";
    const order = orderId ? await findOrder(orderId) : null;

    if (!order) return { action: "ignored", reason: "unknown-order" };

    const charged =
      typeof session.amount_total === "number"
        ? { amount: session.amount_total / minorUnitFactor(session.currency ?? "usd"), currency: (session.currency ?? "usd").toUpperCase() }
        : undefined;

    const result = await markOrderPaid(order.id, session.id, "stripe", charged);

    if (!result.ok) return { action: "ignored", reason: result.error };

    return { action: "paid", order: result.order, alreadyPaid: result.alreadyPaid };
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId ?? session.client_reference_id ?? "";
    const order = orderId ? await findOrder(orderId) : null;

    if (!order) return { action: "ignored", reason: "unknown-order" };

    const result = await expireOrder(order.id, "The payment was not completed in time.");

    if (!result.ok) return { action: "ignored", reason: result.error };

    return { action: "expired", order: result.order };
  }

  return { action: "ignored", reason: "unhandled-event" };
}

/** One order, by its number. */
async function findOrder(id: string): Promise<StoredOrder | null> {
  const { getOrderById } = await import("@/lib/orders");
  return getOrderById(id);
}

/* ------------------------------------------------------------------ *
 * Events we have already handled
 *
 * The provider retries an event until it is told it was received, so
 * the same event can arrive twice. The order itself is the real guard
 * against a double charge, and this list is the second one: an event we
 * have already dealt with is skipped without being read twice.
 * ------------------------------------------------------------------ */

const DATA_DIR = path.join(process.cwd(), ".data");
const EVENTS_FILE = path.join(DATA_DIR, "stripe-events.json");

/** How many event ids we remember. */
const EVENTS_KEPT = 200;

/** The ids of the events we have already handled. */
async function readHandledEvents(): Promise<string[]> {
  try {
    const raw = await fs.readFile(EVENTS_FILE, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

/** Remember that an event has been handled. */
async function rememberEvent(id: string): Promise<void> {
  const events = await readHandledEvents();
  if (events.includes(id)) return;

  events.push(id);
  await fs.mkdir(DATA_DIR, { recursive: true });
  const temporary = `${EVENTS_FILE}.${process.pid}.tmp`;
  await fs.writeFile(temporary, JSON.stringify(events.slice(-EVENTS_KEPT)), "utf8");
  await fs.rename(temporary, EVENTS_FILE);
}

/** Has this event been handled before? */
export async function wasEventHandled(id: string): Promise<boolean> {
  return (await readHandledEvents()).includes(id);
}

/** Remember that an event has been handled. */
export { rememberEvent as rememberHandledEvent };

/* ------------------------------------------------------------------ *
 * Handy helpers
 * ------------------------------------------------------------------ */

/** The currency the store keeps its prices in. */
export { BASE_CURRENCY };
