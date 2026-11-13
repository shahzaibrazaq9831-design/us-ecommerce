import type { OrderStatus, PaymentStatus } from "@/lib/orders";
import { orderStatusLabels, paymentStatusLabels } from "@/lib/orders";

/**
 * The small pieces the order screens share: how a date reads, how a status
 * reads and the badges that colour them.
 */

/** Read an ISO timestamp as a date and a time. */
export function formatOrderDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";

  try {
    return new Intl.DateTimeFormat("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  } catch {
    return date.toISOString();
  }
}

/** Read an ISO timestamp as a date on its own. */
export function formatOrderDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";

  try {
    return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

/** The colour a status badge wears. */
const STATUS_TONES: Record<string, string> = {
  pending: "warning",
  confirmed: "info",
  in_production: "info",
  shipped: "info",
  delivered: "success",
  cancelled: "error",
  unpaid: "warning",
  paid: "success",
  failed: "error",
  refunded: "muted",
};

/** The badge that shows where an order is. */
export function StatusBadge({ status }: { status: OrderStatus }) {
  const label = orderStatusLabels[status] ?? status;

  return (
    <span className={`admin-badge admin-badge--${STATUS_TONES[status] ?? "muted"}`}>
      {label}
    </span>
  );
}

/** The badge that shows where the money is. */
export function PaymentBadge({ status }: { status: PaymentStatus }) {
  const label = paymentStatusLabels[status] ?? status;

  return (
    <span className={`admin-badge admin-badge--${STATUS_TONES[status] ?? "muted"}`}>
      {label}
    </span>
  );
}
