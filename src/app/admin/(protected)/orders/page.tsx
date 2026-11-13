import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/admin-session";
import {
  isOrderStatus,
  isPaymentStatus,
  orderStatusLabels,
  orderStatuses,
  paymentStatusLabels,
  paymentStatuses,
  queryOrders,
  type OrderFilters,
} from "@/lib/orders";
import { formatPrice } from "@/lib/currency";
import { formatOrderDate, PaymentBadge, StatusBadge } from "./order-parts";

export const metadata: Metadata = {
  title: "Orders",
};

interface AdminOrdersPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/** The first value of a query parameter, or "" when it is not there. */
function first(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

/** Read the filters out of the query string. */
function readFilters(params: Record<string, string | string[] | undefined>): OrderFilters {
  const status = first(params.status);
  const payment = first(params.payment);

  return {
    query: first(params.q),
    status: isOrderStatus(status) ? status : "",
    payment: isPaymentStatus(payment) ? payment : "",
    page: Math.max(1, Number(first(params.page)) || 1),
  };
}

/** The address of the list, with the filters kept and the page changed. */
function listHref(filters: OrderFilters, page: number): string {
  const params = new URLSearchParams();

  if (filters.query) params.set("q", filters.query);
  if (filters.status) params.set("status", filters.status);
  if (filters.payment) params.set("payment", filters.payment);
  if (page > 1) params.set("page", String(page));

  const query = params.toString();
  return query ? `/admin/orders?${query}` : "/admin/orders";
}

export default function AdminOrdersPage({ searchParams }: AdminOrdersPageProps) {
  return (
    <Suspense fallback={<div className="admin-panel admin-loading">Loading orders…</div>}>
      <OrdersPanel searchParams={searchParams} />
    </Suspense>
  );
}

async function OrdersPanel({ searchParams }: AdminOrdersPageProps) {
  // The session is checked here, on the server, before a single order is
  // read. A signed-out visitor never sees an order.
  await requireAdmin();

  const params = await searchParams;
  const filters = readFilters(params);
  const result = await queryOrders(filters);

  const hasFilters = Boolean(filters.query || filters.status || filters.payment);

  return (
    <div className="admin-panel">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-title">Orders</h1>
          <p className="admin-subtitle">
            {result.total === 0
              ? "No orders match the filters."
              : `${result.total} ${result.total === 1 ? "order" : "orders"}, newest first.`}
          </p>
        </div>
      </div>

      {/* The filters are a plain GET form: the list works without JavaScript. */}
      <form action="/admin/orders" method="get" className="admin-filters">
        <label className="admin-field admin-field--grow">
          <span className="admin-label">Search</span>
          <input
            className="admin-input"
            type="search"
            name="q"
            placeholder="Order number, name, email or phone"
            defaultValue={filters.query ?? ""}
          />
        </label>

        <label className="admin-field">
          <span className="admin-label">Status</span>
          <select
            className="admin-input"
            name="status"
            defaultValue={filters.status ?? ""}
          >
            <option value="">All statuses</option>
            {orderStatuses.map((status) => (
              <option key={status} value={status}>
                {orderStatusLabels[status]}
              </option>
            ))}
          </select>
        </label>

        <label className="admin-field">
          <span className="admin-label">Payment</span>
          <select
            className="admin-input"
            name="payment"
            defaultValue={filters.payment ?? ""}
          >
            <option value="">All payments</option>
            {paymentStatuses.map((status) => (
              <option key={status} value={status}>
                {paymentStatusLabels[status]}
              </option>
            ))}
          </select>
        </label>

        <div className="admin-filter-actions">
          <button type="submit" className="admin-button admin-button--primary">
            Apply
          </button>
          {hasFilters ? (
            <Link href="/admin/orders" className="admin-button admin-button--ghost">
              Clear
            </Link>
          ) : null}
        </div>
      </form>

      {result.orders.length === 0 ? (
        <div className="admin-empty">
          <p>There is nothing to show here yet.</p>
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th scope="col">Order</th>
                <th scope="col">Placed</th>
                <th scope="col">Customer</th>
                <th scope="col">Items</th>
                <th scope="col">Total</th>
                <th scope="col">Payment</th>
                <th scope="col">Status</th>
                <th scope="col">Tracking</th>
              </tr>
            </thead>
            <tbody>
              {result.orders.map((order) => {
                const pieces = (order.items ?? []).reduce(
                  (sum, item) => sum + (item.quantity ?? 0),
                  0
                );

                return (
                  <tr key={order.id}>
                    <td>
                      <Link href={`/admin/orders/${order.id}`} className="admin-link">
                        {order.id}
                      </Link>
                    </td>
                    <td>{formatOrderDate(order.date)}</td>
                    <td>
                      <span className="admin-strong">{order.customer?.name}</span>
                      <span className="admin-muted">{order.customer?.email}</span>
                    </td>
                    <td>
                      {pieces} {pieces === 1 ? "piece" : "pieces"}
                    </td>
                    <td>{formatPrice(order.totals?.total ?? 0, "PKR")}</td>
                    <td>
                      <PaymentBadge status={order.payment?.status ?? "unpaid"} />
                    </td>
                    <td>
                      <StatusBadge status={order.status} />
                    </td>
                    <td>
                      {order.trackingNumber ? (
                        <span className="admin-mono">{order.trackingNumber}</span>
                      ) : (
                        <span className="admin-muted">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {result.pageCount > 1 ? (
        <nav className="admin-pagination" aria-label="Order pages">
          {result.page > 1 ? (
            <Link
              href={listHref(filters, result.page - 1)}
              className="admin-button admin-button--ghost"
              rel="prev"
            >
              Previous
            </Link>
          ) : (
            <span className="admin-button admin-button--ghost admin-button--off">
              Previous
            </span>
          )}

          <span className="admin-pagination-count">
            Page {result.page} of {result.pageCount}
          </span>

          {result.page < result.pageCount ? (
            <Link
              href={listHref(filters, result.page + 1)}
              className="admin-button admin-button--ghost"
              rel="next"
            >
              Next
            </Link>
          ) : (
            <span className="admin-button admin-button--ghost admin-button--off">
              Next
            </span>
          )}
        </nav>
      ) : null}
    </div>
  );
}
