/**
 * Orders — the record of what people bought and what we did about it.
 *
 * This module owns the order file: the reading, the writing and the rules
 * that go with it. Two callers use it:
 *
 *   1. The review flow, which asks whether an order really exists and
 *      really contains the piece being reviewed. Nothing else counts: no
 *      order, no badge.
 *   2. The admin screens under /admin, which list orders, show one order in
 *      full and change its status, its tracking number, its payment state
 *      and its notes.
 *
 * Storage is a JSON file under `.data/`, the same place the reviews live,
 * so the store runs with no extra packages and no database. When the real
 * database arrives, replace the two functions in the storage section and
 * the rest of the app keeps working — the same names, the same shapes.
 *
 * Two promises the order model keeps:
 *
 *   - Every status change is written to the order's history with the time
 *     it happened and who did it.
 *   - No card data is ever stored. A payment is a method, a status and a
 *     reference — never a number, never a security code.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import type { Measurements, StitchingOption } from "@/lib/products";

/* ------------------------------------------------------------------ *
 * Types
 * ------------------------------------------------------------------ */

/** Where an order is in the workshop. */
export type OrderStatus =
  | "new"
  | "paid"
  | "stitching"
  | "shipped"
  | "delivered"
  | "cancelled";

/** How the customer is paying. */
export type PaymentMethod = "cod" | "card" | "bank_transfer";

/** Where the money is. */
export type PaymentStatus = "unpaid" | "paid" | "failed" | "refunded";

/** One piece in an order, with everything the customer chose for it. */
export interface OrderItem {
  /** The piece that was ordered. */
  slug: string;
  /** The name of the piece at the time of the order. */
  name?: string;
  /** The picture of the piece at the time of the order. */
  image?: string;
  /** The price of one piece, in PKR. */
  price?: number;
  quantity: number;
  /** How the piece is to be made. */
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

/** Who the order is for. */
export interface OrderCustomer {
  name: string;
  email: string;
  phone?: string;
}

/** Where the order is going. */
export interface OrderAddress {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: string;
}

/** The money on the order, in PKR. */
export interface OrderTotals {
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  /** The currency the totals are in. */
  currency?: string;
  /** The discount code that was applied, or "" when none was. */
  discountCode?: string;
}

/**
 * How the order is paid for.
 *
 * There is no card number, no expiry and no security code here, and there
 * never will be: the card details live with the payment provider and this
 * store only keeps the method, the state of the payment and the provider's
 * reference.
 */
export interface OrderPayment {
  method: PaymentMethod;
  status: PaymentStatus;
  /** The payment provider's reference, when there is one. */
  reference?: string;
  /** ISO timestamp of when the payment was marked as paid. */
  paidAt?: string;
  /** What was actually charged, in the currency that was charged. */
  chargedAmount?: number;
  /** The currency the provider charged in. */
  chargedCurrency?: string;
}

/**
 * Which emails have already gone out for an order.
 *
 * The times are kept on the order so that an email is never sent twice —
 * the payment webhook can arrive more than once, and a customer should
 * not receive two confirmation emails because of it.
 */
export interface OrderNotifications {
  /** When the customer was told their order was received. */
  customerConfirmationAt?: string;
  /** When the studio was told a new order had come in. */
  ownerNoticeAt?: string;
  /** When the customer was told their payment went through. */
  paymentConfirmationAt?: string;
}

/** One entry in the order's log. */
export interface OrderEvent {
  /** ISO timestamp of the change. */
  at: string;
  /** What kind of change this was. */
  type: "status" | "payment" | "tracking" | "note";
  /** Who made the change — the signed-in admin. */
  by: string;
  /** A line for the timeline. */
  message: string;
  /** The status before the change, for a status change. */
  from?: OrderStatus;
  /** The status after the change, for a status change. */
  to?: OrderStatus;
}

/** A stored order. */
export interface StoredOrder {
  /** The order number the customer quotes. */
  id: string;
  /** ISO date the order was placed. */
  date: string;
  /** The customer's email, kept at the top level for the review lookup. */
  email: string;
  customer: OrderCustomer;
  address: OrderAddress;
  items: OrderItem[];
  totals: OrderTotals;
  payment: OrderPayment;
  status: OrderStatus;
  /** The tracking number, once the parcel is on its way. */
  trackingNumber?: string;
  /** The courier carrying the parcel. */
  courier?: string;
  /** Private notes for the team. */
  notes?: string;
  /** What the customer asked us to know about the delivery. */
  deliveryNote?: string;
  /** When the customer accepted the terms and the returns policy. */
  termsAcceptedAt?: string;
  /**
   * The key the customer sent when placing the order.
   *
   * It makes creating an order safe to repeat: sending the same key
   * again returns the order that already exists instead of making a
   * second one.
   */
  idempotencyKey?: string;
  /** Which emails have already gone out. */
  notifications?: OrderNotifications;
  /** Every change made to the order, oldest first. */
  history: OrderEvent[];
}

/** One line of an order, in the shape the review flow needs. */
export interface OrderLine {
  /** The piece that was ordered. */
  slug: string;
  quantity: number;
}

/** A recorded order, in the shape the review flow needs. */
export interface OrderRecord {
  /** The order number the customer quotes in a review. */
  id: string;
  /** Email the order was placed with. */
  email: string;
  /** The pieces in the order. */
  items: OrderLine[];
  /** ISO date the order was placed. */
  date: string;
}

/* ------------------------------------------------------------------ *
 * Labels
 * ------------------------------------------------------------------ */

/** Every status, in the order they happen. */
export const orderStatuses: OrderStatus[] = [
  "new",
  "paid",
  "stitching",
  "shipped",
  "delivered",
  "cancelled",
];

/** What each status is called on screen. */
export const orderStatusLabels: Record<OrderStatus, string> = {
  new: "New",
  paid: "Paid",
  stitching: "Stitching",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

/**
 * The statuses older records were saved under, and what they are called
 * now. Orders written before the rename still read back correctly.
 */
const legacyStatusNames: Record<string, OrderStatus> = {
  pending: "new",
  confirmed: "paid",
  in_production: "stitching",
};

/** The status of an order, whatever it was saved as. */
export function normaliseStatus(value: string | undefined | null): OrderStatus {
  const raw = (value ?? "").trim();
  if (isOrderStatus(raw)) return raw;
  return legacyStatusNames[raw] ?? "new";
}

/** Every payment state. */
export const paymentStatuses: PaymentStatus[] = [
  "unpaid",
  "paid",
  "failed",
  "refunded",
];

/** What each payment state is called on screen. */
export const paymentStatusLabels: Record<PaymentStatus, string> = {
  unpaid: "Unpaid",
  paid: "Paid",
  failed: "Failed",
  refunded: "Refunded",
};

/** What each payment method is called on screen. */
export const paymentMethodLabels: Record<PaymentMethod, string> = {
  cod: "Cash on delivery",
  card: "Card",
  bank_transfer: "Bank transfer",
};

/** Is this a status we know about? */
export function isOrderStatus(value: string): value is OrderStatus {
  return (orderStatuses as string[]).includes(value);
}

/** Is this a payment state we know about? */
export function isPaymentStatus(value: string): value is PaymentStatus {
  return (paymentStatuses as string[]).includes(value);
}

/* ------------------------------------------------------------------ *
 * Storage
 * ------------------------------------------------------------------ */

const DATA_DIR = path.join(process.cwd(), ".data");
const ORDERS_FILE = path.join(DATA_DIR, "orders.json");

/** Read every stored order. A missing or damaged file reads as no orders. */
async function readOrders(): Promise<StoredOrder[]> {
  try {
    const raw = await fs.readFile(ORDERS_FILE, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(
        (entry): entry is StoredOrder =>
          Boolean(entry) && typeof (entry as StoredOrder).id === "string"
      )
      .map((entry) => ({
        ...entry,
        // Orders saved before the rename still read back with a status we
        // know, so nothing has to be migrated by hand.
        status: normaliseStatus(entry.status),
      }));
  } catch {
    return [];
  }
}

/** Write the orders back, replacing the file in one go. */
async function writeOrders(orders: StoredOrder[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const temporary = `${ORDERS_FILE}.${process.pid}.tmp`;
  await fs.writeFile(temporary, JSON.stringify(orders, null, 2), "utf8");
  await fs.rename(temporary, ORDERS_FILE);
}

/* ------------------------------------------------------------------ *
 * The review flow
 * ------------------------------------------------------------------ */

/** Every recorded order. A missing file means there are no orders. */
export async function listOrders(): Promise<OrderRecord[]> {
  const orders = await readOrders();

  return orders.map((order) => ({
    id: order.id,
    email: order.email ?? order.customer?.email ?? "",
    items: (order.items ?? []).map((item) => ({
      slug: item.slug,
      quantity: item.quantity,
    })),
    date: order.date,
  }));
}

/**
 * The order a review points at, but only when that order really contains
 * the piece the review is about. Returns null in every other case.
 */
export async function findOrderForReview(
  orderId: string,
  productSlug: string
): Promise<OrderRecord | null> {
  const id = (orderId ?? "").trim().toUpperCase();
  if (!id) return null;

  const orders = await listOrders();
  const order = orders.find((entry) => entry.id.trim().toUpperCase() === id);
  if (!order) return null;

  const containsProduct = order.items.some((item) => item.slug === productSlug);
  return containsProduct ? order : null;
}

/* ------------------------------------------------------------------ *
 * The admin screens
 * ------------------------------------------------------------------ */

/** How many orders one page of the list holds. */
export const ORDERS_PER_PAGE = 20;

/** What the admin can narrow the list by. */
export interface OrderFilters {
  /** Free text: order number, customer name, email, phone or piece. */
  query?: string;
  /** Only this status, or "" for every status. */
  status?: OrderStatus | "";
  /** Only this payment state, or "" for every state. */
  payment?: PaymentStatus | "";
  /** Which page to show, counting from one. */
  page?: number;
  /** How many orders a page holds. */
  perPage?: number;
}

/** One page of orders. */
export interface OrderPage {
  /** The orders on this page, newest first. */
  orders: StoredOrder[];
  /** How many orders the filters matched in total. */
  total: number;
  /** The page on show, counting from one. */
  page: number;
  /** How many orders a page holds. */
  perPage: number;
  /** How many pages the filters produced. */
  pageCount: number;
}

/** Keep a number inside its bounds. */
function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * The list of orders, newest first, narrowed by the search box and the two
 * filters and cut into pages.
 */
export async function queryOrders(filters: OrderFilters): Promise<OrderPage> {
  const orders = await readOrders();

  const query = (filters.query ?? "").trim().toLowerCase();
  const status = filters.status ?? "";
  const payment = filters.payment ?? "";

  const matching = orders.filter((order) => {
    if (status && order.status !== status) return false;
    if (payment && order.payment?.status !== payment) return false;
    if (!query) return true;

    const haystack = [
      order.id,
      order.customer?.name,
      order.customer?.email,
      order.customer?.phone,
      order.address?.city,
      order.address?.country,
      ...(order.items ?? []).flatMap((item) => [item.name, item.slug]),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(query);
  });

  // Newest first: the order placed last is the one we look at first.
  matching.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));

  const perPage = clamp(filters.perPage ?? ORDERS_PER_PAGE, 1, 100);
  const pageCount = Math.max(1, Math.ceil(matching.length / perPage));
  const page = clamp(Math.floor(filters.page ?? 1), 1, pageCount);
  const start = (page - 1) * perPage;

  return {
    orders: matching.slice(start, start + perPage),
    total: matching.length,
    page,
    perPage,
    pageCount,
  };
}

/** One order, by its order number. */
export async function getOrderById(id: string): Promise<StoredOrder | null> {
  const wanted = (id ?? "").trim().toUpperCase();
  if (!wanted) return null;

  const orders = await readOrders();
  const order = orders.find(
    (entry) => (entry.id ?? "").trim().toUpperCase() === wanted
  );

  return order ?? null;
}

/** What an admin action says when it goes wrong. */
export type OrderActionResult =
  | { ok: true; order: StoredOrder }
  | { ok: false; error: string };

/**
 * Change the status of an order and write the change to its history with
 * the time it happened.
 */
export async function changeOrderStatus(
  id: string,
  status: OrderStatus,
  actor: string,
  note?: string
): Promise<OrderActionResult> {
  const orders = await readOrders();
  const index = orders.findIndex(
    (entry) => (entry.id ?? "").trim().toUpperCase() === (id ?? "").trim().toUpperCase()
  );

  if (index === -1) return { ok: false, error: "not-found" };

  const order = orders[index];

  if (order.status === "cancelled") {
    return { ok: false, error: "cancelled" };
  }

  if (order.status === status) {
    return { ok: false, error: "same-status" };
  }

  const from = order.status;
  const now = new Date().toISOString();

  const updated: StoredOrder = {
    ...order,
    status,
    history: [
      ...(order.history ?? []),
      {
        at: now,
        type: "status",
        by: actor,
        from,
        to: status,
        message: note?.trim()
          ? `Status changed from ${orderStatusLabels[from]} to ${orderStatusLabels[status]} — ${note.trim()}`
          : `Status changed from ${orderStatusLabels[from]} to ${orderStatusLabels[status]}`,
      },
    ],
  };

  orders[index] = updated;
  await writeOrders(orders);

  return { ok: true, order: updated };
}

/** Add or change the tracking number of an order. */
export async function setOrderTracking(
  id: string,
  trackingNumber: string,
  courier: string,
  actor: string
): Promise<OrderActionResult> {
  const orders = await readOrders();
  const index = orders.findIndex(
    (entry) => (entry.id ?? "").trim().toUpperCase() === (id ?? "").trim().toUpperCase()
  );

  if (index === -1) return { ok: false, error: "not-found" };

  const order = orders[index];

  if (order.status === "cancelled") {
    return { ok: false, error: "cancelled" };
  }

  const tracking = trackingNumber.trim();
  const now = new Date().toISOString();

  const updated: StoredOrder = {
    ...order,
    trackingNumber: tracking,
    courier: courier.trim() || undefined,
    history: [
      ...(order.history ?? []),
      {
        at: now,
        type: "tracking",
        by: actor,
        message: courier.trim()
          ? `Tracking number set to ${tracking} (${courier.trim()})`
          : `Tracking number set to ${tracking}`,
      },
    ],
  };

  orders[index] = updated;
  await writeOrders(orders);

  return { ok: true, order: updated };
}

/**
 * Mark a cash-on-delivery order as paid. Card and bank-transfer payments
 * are settled by the provider, so they are not marked by hand.
 */
export async function markOrderAsPaid(
  id: string,
  actor: string
): Promise<OrderActionResult> {
  const orders = await readOrders();
  const index = orders.findIndex(
    (entry) => (entry.id ?? "").trim().toUpperCase() === (id ?? "").trim().toUpperCase()
  );

  if (index === -1) return { ok: false, error: "not-found" };

  const order = orders[index];

  if (order.payment?.method !== "cod") {
    return { ok: false, error: "not-cod" };
  }

  if (order.payment?.status === "paid") {
    return { ok: false, error: "already-paid" };
  }

  if (order.status === "cancelled") {
    return { ok: false, error: "cancelled" };
  }

  const now = new Date().toISOString();
  const from = order.status;
  const events: OrderEvent[] = [...(order.history ?? [])];

  events.push({
    at: now,
    type: "payment",
    by: actor,
    message: "Cash on delivery marked as paid",
  });

  // The money has arrived, so the order is paid — unless it has already
  // moved further along.
  if (from === "new") {
    events.push({
      at: now,
      type: "status",
      by: actor,
      from,
      to: "paid",
      message: `Status changed from ${orderStatusLabels[from]} to ${orderStatusLabels.paid}`,
    });
  }

  const updated: StoredOrder = {
    ...order,
    status: from === "new" ? "paid" : order.status,
    payment: { ...order.payment, status: "paid", paidAt: now },
    history: events,
  };

  orders[index] = updated;
  await writeOrders(orders);

  return { ok: true, order: updated };
}

/** Cancel an order. The cancellation is a status change, so it is logged. */
export async function cancelOrder(
  id: string,
  reason: string,
  actor: string
): Promise<OrderActionResult> {
  const orders = await readOrders();
  const index = orders.findIndex(
    (entry) => (entry.id ?? "").trim().toUpperCase() === (id ?? "").trim().toUpperCase()
  );

  if (index === -1) return { ok: false, error: "not-found" };

  const order = orders[index];

  if (order.status === "cancelled") {
    return { ok: false, error: "cancelled" };
  }

  const from = order.status;
  const now = new Date().toISOString();
  const trimmed = reason.trim();

  const updated: StoredOrder = {
    ...order,
    status: "cancelled",
    history: [
      ...(order.history ?? []),
      {
        at: now,
        type: "status",
        by: actor,
        from,
        to: "cancelled",
        message: trimmed
          ? `Status changed from ${orderStatusLabels[from]} to Cancelled — ${trimmed}`
          : `Status changed from ${orderStatusLabels[from]} to Cancelled`,
      },
    ],
  };

  orders[index] = updated;
  await writeOrders(orders);

  return { ok: true, order: updated };
}

/** Save the private notes on an order. */
export async function saveOrderNotes(
  id: string,
  notes: string,
  actor: string
): Promise<OrderActionResult> {
  const orders = await readOrders();
  const index = orders.findIndex(
    (entry) => (entry.id ?? "").trim().toUpperCase() === (id ?? "").trim().toUpperCase()
  );

  if (index === -1) return { ok: false, error: "not-found" };

  const order = orders[index];
  const now = new Date().toISOString();

  const updated: StoredOrder = {
    ...order,
    notes: notes.trim(),
    history: [
      ...(order.history ?? []),
      {
        at: now,
        type: "note",
        by: actor,
        message: "Notes updated",
      },
    ],
  };

  orders[index] = updated;
  await writeOrders(orders);

  return { ok: true, order: updated };
}

/** The status changes on an order, newest first — the status log. */
export function statusChanges(order: StoredOrder): OrderEvent[] {
  return (order.history ?? [])
    .filter((event) => event.type === "status")
    .slice()
    .reverse();
}

/* ------------------------------------------------------------------ *
 * The checkout
 *
 * Creating an order, paying for it and finding it again. These three
 * things live here so there is exactly one place where an order is
 * written and one place that decides what an order is.
 * ------------------------------------------------------------------ */

/**
 * The cookie that remembers which order this browser just placed.
 *
 * It holds nothing but the order number, it cannot be read by scripts,
 * and it is only sent to the order pages. It is what lets the
 * confirmation page show the order to the person who just placed it —
 * without it, an order number on its own reveals nothing.
 */
export const ORDER_RECEIPT_COOKIE = "ppd_order_receipt";

/** The letters an order number is made from. */
const ORDER_ID_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** How many characters the random part of an order number has. */
const ORDER_ID_LENGTH = 6;

/** The random part of an order number. */
function randomOrderSuffix(): string {
  let suffix = "";

  for (let index = 0; index < ORDER_ID_LENGTH; index += 1) {
    suffix += ORDER_ID_ALPHABET[Math.floor(Math.random() * ORDER_ID_ALPHABET.length)];
  }

  return suffix;
}

/**
 * An order number that is not already taken.
 *
 * Short enough to read out over the phone, long enough that it cannot
 * be guessed, and without the letters and digits people mistype (no I,
 * O, 0 or 1). The loop is a safety net: two orders placed in the same
 * moment must not end up with the same number.
 */
function pickOrderId(orders: StoredOrder[]): string {
  const taken = new Set(orders.map((order) => (order.id ?? "").toUpperCase()));

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const id = `RB-${randomOrderSuffix()}`;
    if (!taken.has(id)) return id;
  }

  // Ten collisions in a row means something is very wrong; fall back to
  // a number that cannot collide.
  return `RB-${Date.now().toString(36).toUpperCase()}`;
}

/** What the checkout sends to create an order. */
export interface CreateOrderInput {
  /** The key that makes creating the order safe to repeat. */
  idempotencyKey: string;
  customer: OrderCustomer;
  address: OrderAddress;
  items: OrderItem[];
  totals: OrderTotals;
  payment: {
    method: PaymentMethod;
    status?: PaymentStatus;
    reference?: string;
    chargedAmount?: number;
    chargedCurrency?: string;
  };
  deliveryNote?: string;
  termsAcceptedAt?: string;
}

/** What creating an order says. */
export type CreateOrderResult =
  | { ok: true; order: StoredOrder; created: boolean }
  | { ok: false; error: string };

/**
 * Create an order — or hand back the one that already exists.
 *
 * The idempotency key is what makes this safe to retry: a customer who
 * presses "Place order" twice, or a request that arrives again because
 * the connection dropped, gets the same order both times instead of two
 * orders and two charges.
 */
export async function createOrder(
  input: CreateOrderInput
): Promise<CreateOrderResult> {
  const orders = await readOrders();
  const key = (input.idempotencyKey ?? "").trim();

  if (!key) return { ok: false, error: "missing-idempotency-key" };

  const existing = orders.find((order) => order.idempotencyKey === key);
  if (existing) return { ok: true, order: existing, created: false };

  const now = new Date().toISOString();

  const order: StoredOrder = {
    id: pickOrderId(orders),
    date: now,
    email: (input.customer.email ?? "").trim().toLowerCase(),
    customer: input.customer,
    address: input.address,
    items: input.items,
    totals: input.totals,
    payment: {
      method: input.payment.method,
      status: input.payment.status ?? "unpaid",
      ...(input.payment.reference ? { reference: input.payment.reference } : {}),
      ...(input.payment.chargedAmount !== undefined
        ? { chargedAmount: input.payment.chargedAmount }
        : {}),
      ...(input.payment.chargedCurrency
        ? { chargedCurrency: input.payment.chargedCurrency }
        : {}),
    },
    status: "new",
    ...(input.deliveryNote ? { deliveryNote: input.deliveryNote } : {}),
    ...(input.termsAcceptedAt ? { termsAcceptedAt: input.termsAcceptedAt } : {}),
    idempotencyKey: key,
    notifications: {},
    history: [
      {
        at: now,
        type: "status",
        by: "customer",
        to: "new",
        message: "Order placed",
      },
    ],
  };

  orders.push(order);
  await writeOrders(orders);

  return { ok: true, order, created: true };
}

/**
 * Find an order by its number and the email address on it.
 *
 * Both halves have to match. This is the check behind the order lookup:
 * knowing somebody's order number is not enough to see their order.
 */
export async function findOrderByIdAndEmail(
  id: string,
  email: string
): Promise<StoredOrder | null> {
  const wantedId = (id ?? "").trim().toUpperCase();
  const wantedEmail = (email ?? "").trim().toLowerCase();

  if (!wantedId || !wantedEmail) return null;

  const orders = await readOrders();
  const order = orders.find(
    (entry) =>
      (entry.id ?? "").trim().toUpperCase() === wantedId &&
      (entry.email ?? entry.customer?.email ?? "").trim().toLowerCase() === wantedEmail
  );

  return order ?? null;
}

/** What marking an order paid says. */
export type MarkPaidResult =
  | { ok: true; order: StoredOrder; alreadyPaid: boolean }
  | { ok: false; error: string };

/**
 * Mark an order as paid.
 *
 * Only the payment provider's webhook calls this — a browser saying "I
 * paid" proves nothing. Calling it twice is harmless: the second call
 * finds the order already paid and says so, which is what makes the
 * webhook safe to receive again.
 */
export async function markOrderPaid(
  id: string,
  reference: string,
  actor = "payment provider",
  charged?: { amount: number; currency: string }
): Promise<MarkPaidResult> {
  const orders = await readOrders();
  const index = orders.findIndex(
    (entry) =>
      (entry.id ?? "").trim().toUpperCase() === (id ?? "").trim().toUpperCase()
  );

  if (index === -1) return { ok: false, error: "not-found" };

  const order = orders[index];

  if (order.payment?.status === "paid") {
    return { ok: true, order, alreadyPaid: true };
  }

  if (order.status === "cancelled") {
    return { ok: false, error: "cancelled" };
  }

  const now = new Date().toISOString();
  const from = order.status;
  const events: OrderEvent[] = [...(order.history ?? [])];

  events.push({
    at: now,
    type: "payment",
    by: actor,
    message: reference ? `Payment received (${reference})` : "Payment received",
  });

  const paid: StoredOrder = {
    ...order,
    status: from === "new" ? "paid" : order.status,
    payment: {
      ...order.payment,
      status: "paid",
      paidAt: now,
      ...(reference ? { reference } : {}),
      ...(charged
        ? { chargedAmount: charged.amount, chargedCurrency: charged.currency }
        : {}),
    },
    history: events,
  };

  if (from === "new") {
    paid.history = [
      ...events,
      {
        at: now,
        type: "status",
        by: actor,
        from,
        to: "paid",
        message: `Status changed from ${orderStatusLabels[from]} to ${orderStatusLabels.paid}`,
      },
    ];
  }

  orders[index] = paid;
  await writeOrders(orders);

  return { ok: true, order: paid, alreadyPaid: false };
}

/**
 * Close an order whose payment never completed.
 *
 * A checkout session that expires is not a sale, so the order is closed
 * rather than left hanging in the workshop.
 */
export async function expireOrder(
  id: string,
  reason = "The payment was not completed."
): Promise<{ ok: true; order: StoredOrder } | { ok: false; error: string }> {
  const orders = await readOrders();
  const order = orders.find(
    (entry) =>
      (entry.id ?? "").trim().toUpperCase() === (id ?? "").trim().toUpperCase()
  );

  if (!order) return { ok: false, error: "not-found" };
  if (order.payment?.status === "paid") return { ok: false, error: "already-paid" };
  if (order.status === "cancelled") return { ok: true, order };

  const result = await changeOrderStatus(id, "cancelled", "payment provider", reason);

  return result.ok ? { ok: true, order: result.order } : { ok: false, error: result.error };
}

/**
 * Remember which payment page an order is being paid on.
 *
 * The reference is the provider's own id for the payment session. It is
 * what lets a customer who presses "pay" twice be sent back to the
 * payment page they already have, instead of being given a second one
 * and being charged twice.
 */
export async function setPaymentReference(
  id: string,
  reference: string
): Promise<{ ok: true; order: StoredOrder } | { ok: false; error: string }> {
  const orders = await readOrders();
  const index = orders.findIndex(
    (entry) =>
      (entry.id ?? "").trim().toUpperCase() === (id ?? "").trim().toUpperCase()
  );

  if (index === -1) return { ok: false, error: "not-found" };

  const order = orders[index];

  const updated: StoredOrder = {
    ...order,
    payment: { ...order.payment, reference },
  };

  orders[index] = updated;
  await writeOrders(orders);

  return { ok: true, order: updated };
}

/**
 * Remember what the customer was charged, and in what currency.
 *
 * The totals on an order are kept in the store's base currency; this is
 * the money that actually left the customer's account.
 */
export async function setPaymentAmount(
  id: string,
  amount: number,
  currency: string
): Promise<{ ok: true; order: StoredOrder } | { ok: false; error: string }> {
  const orders = await readOrders();
  const index = orders.findIndex(
    (entry) =>
      (entry.id ?? "").trim().toUpperCase() === (id ?? "").trim().toUpperCase()
  );

  if (index === -1) return { ok: false, error: "not-found" };

  const order = orders[index];

  const updated: StoredOrder = {
    ...order,
    payment: {
      ...order.payment,
      chargedAmount: amount,
      chargedCurrency: currency.toUpperCase(),
    },
  };

  orders[index] = updated;
  await writeOrders(orders);

  return { ok: true, order: updated };
}

/**
 * Record that an email has gone out for an order.
 *
 * The payment webhook can arrive more than once, so this is what stops
 * a customer receiving the same email twice.
 */
export async function markNotificationSent(
  id: string,
  kind: keyof OrderNotifications
): Promise<{ ok: true; order: StoredOrder } | { ok: false; error: string }> {
  const orders = await readOrders();
  const index = orders.findIndex(
    (entry) =>
      (entry.id ?? "").trim().toUpperCase() === (id ?? "").trim().toUpperCase()
  );

  if (index === -1) return { ok: false, error: "not-found" };

  const now = new Date().toISOString();
  const order = orders[index];

  const updated: StoredOrder = {
    ...order,
    notifications: { ...(order.notifications ?? {}), [kind]: now },
  };

  orders[index] = updated;
  await writeOrders(orders);

  return { ok: true, order: updated };
}

/** Has this email already gone out for this order? */
export function notificationSent(
  order: StoredOrder,
  kind: keyof OrderNotifications
): boolean {
  return Boolean(order.notifications?.[kind]);
}

/* ------------------------------------------------------------------ *
 * What the customer is allowed to see
 * ------------------------------------------------------------------ */

/**
 * The order, as it is shown to the person who placed it.
 *
 * The private notes and the payment reference are not in here: they are
 * for the studio, not for the customer.
 */
export interface PublicOrder {
  /** The order number. */
  id: string;
  /** When the order was placed. */
  date: string;
  /** Where the order is in the workshop. */
  status: OrderStatus;
  /** What that status is called. */
  statusLabel: string;
  /** Who the order is for. */
  customer: OrderCustomer;
  /** Where it is going. */
  address: OrderAddress;
  /** The pieces, with their stitching and measurements. */
  items: OrderItem[];
  /** The money on the order. */
  totals: OrderTotals;
  /** How it is being paid. */
  payment: {
    method: PaymentMethod;
    status: PaymentStatus;
    paidAt?: string;
    chargedAmount?: number;
    chargedCurrency?: string;
  };
  /** What the customer asked us to know about the delivery. */
  deliveryNote?: string;
  /** What has happened to the order, oldest first. */
  history: { at: string; message: string }[];
}

/** Turn a stored order into the shape the customer is shown. */
export function toPublicOrder(order: StoredOrder): PublicOrder {
  return {
    id: order.id,
    date: order.date,
    status: order.status,
    statusLabel: orderStatusLabels[order.status] ?? order.status,
    customer: {
      name: order.customer.name,
      email: order.customer.email,
      ...(order.customer.phone ? { phone: order.customer.phone } : {}),
    },
    address: order.address,
    items: order.items ?? [],
    totals: order.totals,
    payment: {
      method: order.payment.method,
      status: order.payment.status,
      ...(order.payment.paidAt ? { paidAt: order.payment.paidAt } : {}),
      ...(order.payment.chargedAmount !== undefined
        ? { chargedAmount: order.payment.chargedAmount }
        : {}),
      ...(order.payment.chargedCurrency
        ? { chargedCurrency: order.payment.chargedCurrency }
        : {}),
    },
    ...(order.deliveryNote ? { deliveryNote: order.deliveryNote } : {}),
    history: (order.history ?? []).map((event) => ({
      at: event.at,
      message: event.message,
    })),
  };
}
