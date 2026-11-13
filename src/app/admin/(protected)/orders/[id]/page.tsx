import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/admin-session";
import {
  getOrderById,
  orderStatusLabels,
  orderStatuses,
  paymentMethodLabels,
  type OrderStatus,
  type StoredOrder,
} from "@/lib/orders";
import { measurementFields, stitchingLabels } from "@/lib/products";
import { formatPrice } from "@/lib/currency";
import {
  addTrackingNumberAction,
  cancelOrderAction,
  changeOrderStatusAction,
  markCodAsPaidAction,
  saveOrderNotesAction,
} from "../actions";
import { formatOrderDateTime, PaymentBadge, StatusBadge } from "../order-parts";

export const metadata: Metadata = {
  title: "Order",
};

interface AdminOrderPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/** What each saved code says. */
const SAVED_MESSAGES: Record<string, string> = {
  status: "The order status was updated.",
  tracking: "The tracking number was saved.",
  paid: "The order was marked as paid.",
  cancelled: "The order was cancelled.",
  notes: "The notes were saved.",
};

/** What each error code says. */
const ERROR_MESSAGES: Record<string, string> = {
  "invalid-id": "That order number is not a valid one.",
  "invalid-status": "Choose a status from the list.",
  "invalid-tracking":
    "Enter a tracking number between 4 and 40 characters — letters, digits and the marks couriers use.",
  "missing-reason": "Say why the order is being cancelled.",
  "not-cod":
    "Only cash-on-delivery orders can be marked as paid here — card and bank-transfer payments are settled by the provider.",
  "already-paid": "This order is already marked as paid.",
  "same-status": "The order already has that status.",
  cancelled: "A cancelled order cannot be changed any more.",
  "not-found": "That order no longer exists.",
  unknown: "Something went wrong. Try again.",
};

/** The first value of a query parameter, or "" when it is not there. */
function first(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

export default function AdminOrderPage({ params, searchParams }: AdminOrderPageProps) {
  return (
    <Suspense fallback={<div className="admin-panel admin-loading">Loading order…</div>}>
      <OrderPanel params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function OrderPanel({ params, searchParams }: AdminOrderPageProps) {
  // The session is checked before the order is read — a signed-out visitor
  // never sees an order, not even its number.
  await requireAdmin();

  const { id } = await params;
  const query = await searchParams;

  const order = await getOrderById(id);
  if (!order) notFound();

  const saved = first(query.saved);
  const error = first(query.error);

  return (
    <div className="admin-panel">
      <div className="admin-page-head">
        <div>
          <Link href="/admin/orders" className="admin-back">
            ← All orders
          </Link>
          <h1 className="admin-title">{order.id}</h1>
          <p className="admin-subtitle">
            Placed {formatOrderDateTime(order.date)} ·{" "}
            <StatusBadge status={order.status} />
          </p>
        </div>
      </div>

      {saved ? (
        <p className="admin-alert admin-alert--success" role="status">
          {SAVED_MESSAGES[saved] ?? "Saved."}
        </p>
      ) : null}

      {error ? (
        <p className="admin-alert admin-alert--error" role="alert">
          {ERROR_MESSAGES[error] ?? ERROR_MESSAGES.unknown}
        </p>
      ) : null}

      <div className="admin-grid">
        <div className="admin-grid-main">
          <CustomerCard order={order} />
          <ItemsCard order={order} />
          <TotalsCard order={order} />
          <NotesCard order={order} />
        </div>

        <div className="admin-grid-side">
          <StatusCard order={order} />
          <TrackingCard order={order} />
          <PaymentCard order={order} />
          <CancelCard order={order} />
          <HistoryCard order={order} />
        </div>
      </div>
    </div>
  );
}

/** Who the order is for and where it is going. */
function CustomerCard({ order }: { order: StoredOrder }) {
  return (
    <section className="admin-card">
      <h2 className="admin-card-title">Customer</h2>
      <dl className="admin-details">
        <div>
          <dt>Name</dt>
          <dd>{order.customer?.name || "—"}</dd>
        </div>
        <div>
          <dt>Email</dt>
          <dd>
            {order.customer?.email ? (
              <a href={`mailto:${order.customer.email}`} className="admin-link">
                {order.customer.email}
              </a>
            ) : (
              "—"
            )}
          </dd>
        </div>
        <div>
          <dt>Phone</dt>
          <dd>{order.customer?.phone || "—"}</dd>
        </div>
      </dl>

      <h3 className="admin-card-subtitle">Shipping address</h3>
      <address className="admin-address">
        {order.customer?.name ? (
          <>
            {order.customer.name}
            <br />
          </>
        ) : null}
        {order.address?.line1 ? (
          <>
            {order.address.line1}
            <br />
          </>
        ) : null}
        {order.address?.line2 ? (
          <>
            {order.address.line2}
            <br />
          </>
        ) : null}
        {order.address?.city ? (
          <>
            {order.address.city}
            {order.address.state ? `, ${order.address.state}` : ""}
            <br />
          </>
        ) : null}
        {order.address?.postalCode ? (
          <>
            {order.address.postalCode}
            <br />
          </>
        ) : null}
        {order.address?.country || "—"}
      </address>
    </section>
  );
}

/** What was ordered, how it is to be made and to what measurements. */
function ItemsCard({ order }: { order: StoredOrder }) {
  return (
    <section className="admin-card">
      <h2 className="admin-card-title">Items ({(order.items ?? []).length})</h2>

      {(order.items ?? []).length === 0 ? (
        <p className="admin-muted">No items on this order.</p>
      ) : (
        <ul className="admin-items">
          {(order.items ?? []).map((item, index) => {
            const stitching = item.stitching
              ? stitchingLabels[item.stitching] ?? item.stitching
              : null;
            const measurements = item.measurements;

            return (
              <li key={`${item.slug}-${index}`} className="admin-item">
                <div className="admin-item-head">
                  <span className="admin-strong">{item.name || item.slug}</span>
                  <span className="admin-muted">× {item.quantity ?? 1}</span>
                </div>

                <div className="admin-item-meta">
                  {stitching ? <span className="admin-tag">{stitching}</span> : null}
                  {item.size ? <span className="admin-tag">Size {item.size}</span> : null}
                  {item.lining ? (
                    <span className="admin-tag">Lining: {item.lining}</span>
                  ) : null}
                  {item.price ? (
                    <span className="admin-tag">
                      {formatPrice(item.price, "PKR")} each
                    </span>
                  ) : null}
                </div>

                {measurements ? (
                  <dl className="admin-measurements">
                    {measurementFields.map((field) => (
                      <div key={field.key}>
                        <dt>{field.label}</dt>
                        <dd>
                          {measurements[field.key]} {measurements.unit}
                        </dd>
                      </div>
                    ))}
                  </dl>
                ) : null}

                {item.notes ? (
                  <p className="admin-item-note">Note: {item.notes}</p>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/** The money on the order. */
function TotalsCard({ order }: { order: StoredOrder }) {
  const totals = order.totals ?? {
    subtotal: 0,
    shipping: 0,
    discount: 0,
    total: 0,
  };

  return (
    <section className="admin-card">
      <h2 className="admin-card-title">Totals</h2>
      <dl className="admin-details">
        <div>
          <dt>Subtotal</dt>
          <dd>{formatPrice(totals.subtotal ?? 0, "PKR")}</dd>
        </div>
        <div>
          <dt>Shipping</dt>
          <dd>
            {(totals.shipping ?? 0) === 0
              ? "Free"
              : formatPrice(totals.shipping ?? 0, "PKR")}
          </dd>
        </div>
        <div>
          <dt>Discount</dt>
          <dd>
            {(totals.discount ?? 0) === 0
              ? "—"
              : `−${formatPrice(totals.discount ?? 0, "PKR")}`}
          </dd>
        </div>
        <div className="admin-details-total">
          <dt>Total</dt>
          <dd>{formatPrice(totals.total ?? 0, "PKR")}</dd>
        </div>
      </dl>
    </section>
  );
}

/** The private notes for the team. */
function NotesCard({ order }: { order: StoredOrder }) {
  return (
    <section className="admin-card">
      <h2 className="admin-card-title">Notes</h2>
      <p className="admin-muted">
        Notes are for the studio team. They are not shown to the customer.
      </p>
      <form action={saveOrderNotesAction} className="admin-form">
        <input type="hidden" name="id" value={order.id} />
        <label className="admin-field">
          <span className="admin-label admin-sr-only">Notes</span>
          <textarea
            className="admin-input admin-textarea"
            name="notes"
            rows={4}
            maxLength={2000}
            defaultValue={order.notes ?? ""}
            placeholder="Fitting details, fabric changes, delivery instructions…"
          />
        </label>
        <button type="submit" className="admin-button admin-button--primary">
          Save notes
        </button>
      </form>
    </section>
  );
}

/** Change the status of the order. */
function StatusCard({ order }: { order: StoredOrder }) {
  const options = orderStatuses.filter((status) => status !== order.status);

  return (
    <section className="admin-card">
      <h2 className="admin-card-title">Change status</h2>

      {order.status === "cancelled" ? (
        <p className="admin-muted">
          This order is cancelled. Nothing about it can be changed any more.
        </p>
      ) : (
        <form action={changeOrderStatusAction} className="admin-form">
          <input type="hidden" name="id" value={order.id} />

          <label className="admin-field">
            <span className="admin-label">New status</span>
            <select className="admin-input" name="status" defaultValue="">
              <option value="" disabled>
                Choose a status
              </option>
              {options.map((status) => (
                <option key={status} value={status}>
                  {orderStatusLabels[status as OrderStatus]}
                </option>
              ))}
            </select>
          </label>

          <label className="admin-field">
            <span className="admin-label">Note (optional)</span>
            <input
              className="admin-input"
              type="text"
              name="note"
              maxLength={500}
              placeholder="Why did it change?"
            />
          </label>

          <button type="submit" className="admin-button admin-button--primary">
            Update status
          </button>
        </form>
      )}
    </section>
  );
}

/** Add or change the tracking number. */
function TrackingCard({ order }: { order: StoredOrder }) {
  return (
    <section className="admin-card">
      <h2 className="admin-card-title">Tracking</h2>

      <form action={addTrackingNumberAction} className="admin-form">
        <input type="hidden" name="id" value={order.id} />

        <label className="admin-field">
          <span className="admin-label">Tracking number</span>
          <input
            className="admin-input"
            type="text"
            name="trackingNumber"
            maxLength={40}
            defaultValue={order.trackingNumber ?? ""}
            placeholder="PK123456789PK"
          />
        </label>

        <label className="admin-field">
          <span className="admin-label">Courier</span>
          <input
            className="admin-input"
            type="text"
            name="courier"
            maxLength={60}
            defaultValue={order.courier ?? ""}
            placeholder="TCS, DHL, Leopard…"
          />
        </label>

        <button type="submit" className="admin-button admin-button--primary">
          Save tracking
        </button>
      </form>
    </section>
  );
}

/** The payment, and the button that marks a cash order as paid. */
function PaymentCard({ order }: { order: StoredOrder }) {
  const payment = order.payment ?? {
    method: "cod" as const,
    status: "unpaid" as const,
  };

  return (
    <section className="admin-card">
      <h2 className="admin-card-title">Payment</h2>

      <dl className="admin-details">
        <div>
          <dt>Method</dt>
          <dd>{paymentMethodLabels[payment.method] ?? payment.method}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>
            <PaymentBadge status={payment.status} />
          </dd>
        </div>
        {payment.reference ? (
          <div>
            <dt>Reference</dt>
            <dd className="admin-mono">{payment.reference}</dd>
          </div>
        ) : null}
        {payment.paidAt ? (
          <div>
            <dt>Paid</dt>
            <dd>{formatOrderDateTime(payment.paidAt)}</dd>
          </div>
        ) : null}
      </dl>

      <p className="admin-muted">
        Card details are never stored here — only the method, the state of the
        payment and the provider&apos;s reference.
      </p>

      {payment.method === "cod" && payment.status !== "paid" ? (
        <form action={markCodAsPaidAction}>
          <input type="hidden" name="id" value={order.id} />
          <button type="submit" className="admin-button admin-button--primary">
            Mark as paid
          </button>
        </form>
      ) : null}
    </section>
  );
}

/** Cancel the order. It takes a reason, and the reason is logged. */
function CancelCard({ order }: { order: StoredOrder }) {
  if (order.status === "cancelled") {
    return (
      <section className="admin-card">
        <h2 className="admin-card-title">Cancel</h2>
        <p className="admin-muted">This order is already cancelled.</p>
      </section>
    );
  }

  return (
    <section className="admin-card admin-card--danger">
      <h2 className="admin-card-title">Cancel this order</h2>
      <details className="admin-details-block">
        <summary className="admin-button admin-button--danger">Cancel order</summary>

        <form action={cancelOrderAction} className="admin-form">
          <input type="hidden" name="id" value={order.id} />

          <label className="admin-field">
            <span className="admin-label">Reason</span>
            <input
              className="admin-input"
              type="text"
              name="reason"
              maxLength={500}
              required
              placeholder="Customer asked to cancel"
            />
          </label>

          <button type="submit" className="admin-button admin-button--danger">
            Confirm cancellation
          </button>
        </form>
      </details>
    </section>
  );
}

/** Every change made to the order, newest first. */
function HistoryCard({ order }: { order: StoredOrder }) {
  const history = (order.history ?? []).slice().reverse();

  return (
    <section className="admin-card">
      <h2 className="admin-card-title">History</h2>

      {history.length === 0 ? (
        <p className="admin-muted">Nothing has changed on this order yet.</p>
      ) : (
        <ol className="admin-history">
          {history.map((event, index) => (
            <li key={`${event.at}-${index}`} className="admin-history-item">
              <span className="admin-history-time">
                {formatOrderDateTime(event.at)}
              </span>
              <span className="admin-history-message">{event.message}</span>
              <span className="admin-history-by">by {event.by}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
