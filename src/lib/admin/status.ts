/**
 * Order statuses shared by the server and the browser.
 *
 * The store originally used `new / paid / stitching`. Older orders still
 * carry those values, so they are normalised here. The labels use the
 * workshop wording the studio asked for.
 */

export const ADMIN_ORDER_STATUSES = [
  "pending",
  "confirmed",
  "in_production",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
] as const;

export type AdminOrderStatus = (typeof ADMIN_ORDER_STATUSES)[number];

export const ADMIN_ORDER_STATUS_LABELS: Record<AdminOrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  in_production: "In production",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

/** Legacy values written by the earlier store version. */
const LEGACY_STATUSES: Record<string, AdminOrderStatus> = {
  new: "pending",
  paid: "confirmed",
  stitching: "in_production",
};

export function isAdminOrderStatus(value: string): value is AdminOrderStatus {
  return (ADMIN_ORDER_STATUSES as readonly string[]).includes(value);
}

export function normaliseAdminOrderStatus(value: string | null | undefined): AdminOrderStatus {
  const raw = (value ?? "").trim();
  if (isAdminOrderStatus(raw)) return raw;
  return LEGACY_STATUSES[raw] ?? "pending";
}

/**
 * The workshop workflow. A finished order cannot go back through the line,
 * and a cancelled or refunded order is final. Refunds are allowed once money
 * has been taken, but never before an order is confirmed.
 */
const ALLOWED_TRANSITIONS: Record<AdminOrderStatus, readonly AdminOrderStatus[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["in_production", "cancelled", "refunded"],
  in_production: ["shipped", "cancelled", "refunded"],
  shipped: ["delivered", "refunded"],
  delivered: ["refunded"],
  cancelled: [],
  refunded: [],
};

export function canTransitionStatus(
  from: AdminOrderStatus,
  to: AdminOrderStatus
): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function allowedNextStatuses(from: AdminOrderStatus): AdminOrderStatus[] {
  return [...ALLOWED_TRANSITIONS[from]];
}

/** Tailwind-free colour tokens used by the status badge. */
export const STATUS_TONES: Record<AdminOrderStatus, string> = {
  pending: "amber",
  confirmed: "blue",
  in_production: "violet",
  shipped: "indigo",
  delivered: "green",
  cancelled: "slate",
  refunded: "rose",
};
