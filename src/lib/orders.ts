/**
 * Orders — the lookup a review uses to earn its "Verified purchase" badge.
 *
 * A review is only verified when it points at an order that really
 * exists and really contains the piece being reviewed. Nothing else
 * counts: no order, no badge.
 *
 * The order file is empty until a real order is recorded. Until then no
 * review can be verified, which is the honest answer — a badge we cannot
 * back up is worse than no badge at all.
 *
 * Swapping this file for a database means replacing the two functions
 * below; nothing else in the app reads orders.
 */

import { promises as fs } from "node:fs";
import path from "node:path";

/** One line of an order. */
export interface OrderLine {
  /** The piece that was ordered. */
  slug: string;
  quantity: number;
}

/** A recorded order. */
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

const DATA_DIR = path.join(process.cwd(), ".data");
const ORDERS_FILE = path.join(DATA_DIR, "orders.json");

/** Read every recorded order. A missing file means there are no orders. */
export async function listOrders(): Promise<OrderRecord[]> {
  try {
    const raw = await fs.readFile(ORDERS_FILE, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (entry): entry is OrderRecord =>
        Boolean(entry) && typeof (entry as OrderRecord).id === "string"
    );
  } catch {
    return [];
  }
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
