"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Download, Filter, Printer, Search, TriangleAlert } from "lucide-react";
import PageTransition from "@/components/admin/PageTransition";
import DataTable, { type DataColumn } from "@/components/admin/DataTable";
import StatusBadge from "@/components/admin/StatusBadge";
import { Drawer } from "@/components/admin/Overlays";
import { useToast } from "@/components/admin/ToastProvider";
import { EmptyState } from "@/components/admin/Feedback";
import { formatDate, formatDateTime, formatMoney } from "@/lib/admin/format";
import {
  ADMIN_ORDER_STATUS_LABELS,
  allowedNextStatuses,
  normaliseAdminOrderStatus,
} from "@/lib/admin/status";
import { updateOrderStatusAction } from "@/actions/admin";
import type { AdminOrderDetail, AdminSnapshot, DashboardOrder } from "@/lib/admin/types";

const PAYMENT_FILTERS = [
  ["unpaid", "Unpaid"],
  ["paid", "Paid"],
  ["failed", "Failed"],
  ["refunded", "Refunded"],
];

function exportCsv(orders: DashboardOrder[]) {
  const header = ["Order", "Date", "Customer", "Email", "Total", "Status", "Payment", "City"];
  const rows = orders.map((order) => [
    order.id,
    order.date,
    order.customer,
    order.email,
    String(order.total),
    order.status,
    order.paymentStatus,
    order.city,
  ]);
  const csv = [header, ...rows]
    .map((row) => row.map((value) => `"${value.replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  link.download = "admin-orders.csv";
  link.click();
  URL.revokeObjectURL(link.href);
}

export default function OrdersClient({
  orders,
  details,
  source,
  schemaNotice,
  initialOrder,
}: {
  orders: DashboardOrder[];
  details: AdminOrderDetail[];
  source: AdminSnapshot["source"];
  schemaNotice: string | null;
  initialOrder: string;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [payment, setPayment] = useState("");
  const [stitching, setStitching] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [selectedId, setSelectedId] = useState(initialOrder);
  const [lastInitial, setLastInitial] = useState(initialOrder);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const reduce = useReducedMotion();

  if (initialOrder !== lastInitial) {
    setLastInitial(initialOrder);
    if (initialOrder) setSelectedId(initialOrder);
  }

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return orders.filter((order) => {
      if (status && order.status !== status) return false;
      if (payment && order.paymentStatus !== payment) return false;
      if (stitching && !order.stitching.includes(stitching)) return false;
      if (from && order.date.slice(0, 10) < from) return false;
      if (to && order.date.slice(0, 10) > to) return false;
      if (!needle) return true;
      return [order.id, order.customer, order.email, order.city, order.country].some((value) =>
        value.toLowerCase().includes(needle)
      );
    });
  }, [orders, query, status, payment, stitching, from, to]);

  const selected = details.find((detail) => detail.id === selectedId) ?? null;
  const hasFilters = Boolean(query || status || payment || stitching || from || to);

  function clearFilters() {
    setQuery("");
    setStatus("");
    setPayment("");
    setStitching("");
    setFrom("");
    setTo("");
  }

  async function changeStatus(next: string) {
    if (!selected) return;
    setSaving(true);
    const result = await updateOrderStatusAction({ id: selected.id, status: next });
    setSaving(false);
    if (!result.ok) {
      toast(result.error, "error");
      return;
    }
    toast(result.message, "success");
    router.refresh();
  }

  const columns: DataColumn<DashboardOrder>[] = [
    {
      key: "id",
      header: "Order",
      sortValue: (row) => row.id,
      render: (row) => <strong className="admin-mono">{row.id}</strong>,
    },
    {
      key: "date",
      header: "Placed",
      sortValue: (row) => row.date,
      render: (row) => <span>{formatDate(row.date)}</span>,
    },
    {
      key: "customer",
      header: "Customer",
      sortValue: (row) => row.customer,
      render: (row) => (
        <span className="admin-cell-stack">
          <strong>{row.customer}</strong>
          <small>{row.email}</small>
        </span>
      ),
    },
    {
      key: "items",
      header: "Items",
      sortValue: (row) => row.items,
      render: (row) => <span>{row.items}</span>,
      hideOnMobile: true,
    },
    {
      key: "total",
      header: "Total",
      align: "right",
      sortValue: (row) => row.total,
      render: (row) => <strong>{formatMoney(row.total, row.currency)}</strong>,
    },
    {
      key: "payment",
      header: "Payment",
      sortValue: (row) => row.paymentStatus,
      render: (row) => (
        <span className={`admin-payment-pill is-${row.paymentStatus}`}>{row.paymentStatus}</span>
      ),
      hideOnMobile: true,
    },
    {
      key: "status",
      header: "Status",
      sortValue: (row) => row.status,
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "city",
      header: "City",
      sortValue: (row) => row.city,
      render: (row) => <span>{row.city || "—"}</span>,
      hideOnMobile: true,
    },
  ];

  return (
    <PageTransition>
      <div className="admin-page">
        <header className="admin-page-head">
          <div>
            <p className="admin-eyebrow">Fulfilment</p>
            <h1>Orders</h1>
            <p className="admin-subtitle">
              {filtered.length} order{filtered.length === 1 ? "" : "s"} · source: {source}
            </p>
          </div>
          <div className="admin-head-actions">
            <button
              type="button"
              className="admin-button admin-button--ghost"
              onClick={() => exportCsv(filtered)}
              disabled={!filtered.length}
            >
              <Download size={16} /> Export CSV
            </button>
          </div>
        </header>

        {schemaNotice ? (
          <div className="admin-notice" role="status">
            <TriangleAlert size={18} aria-hidden="true" />
            <span>{schemaNotice}</span>
          </div>
        ) : null}

        <section className="admin-filter-panel">
          <label className="admin-field admin-field--grow">
            <span className="admin-label">Search</span>
            <span className="admin-input-icon">
              <Search size={16} aria-hidden="true" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Order number, customer, email or city"
                aria-label="Search orders"
              />
            </span>
          </label>
          <label className="admin-field">
            <span className="admin-label">Status</span>
            <select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="">All statuses</option>
              {Object.entries(ADMIN_ORDER_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="admin-field">
            <span className="admin-label">Payment</span>
            <select value={payment} onChange={(event) => setPayment(event.target.value)}>
              <option value="">All payments</option>
              {PAYMENT_FILTERS.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="admin-field">
            <span className="admin-label">Stitching</span>
            <select value={stitching} onChange={(event) => setStitching(event.target.value)}>
              <option value="">All stitching</option>
              <option value="Unstitched">Unstitched</option>
              <option value="Standard stitched">Standard stitched</option>
              <option value="Custom stitched">Custom stitched</option>
            </select>
          </label>
          <label className="admin-field">
            <span className="admin-label">From</span>
            <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
          </label>
          <label className="admin-field">
            <span className="admin-label">To</span>
            <input type="date" value={to} onChange={(event) => setTo(event.target.value)} />
          </label>
          {hasFilters ? (
            <button type="button" className="admin-button admin-button--ghost" onClick={clearFilters}>
              <Filter size={15} /> Clear
            </button>
          ) : null}
        </section>

        {filtered.length ? (
          <DataTable
            rows={filtered}
            columns={columns}
            onRowClick={(row) => setSelectedId(row.id)}
            initialSort={{ key: "date", direction: "desc" }}
            emptyTitle="No matching orders"
            emptyDescription="Try clearing a filter or searching for another customer."
          />
        ) : (
          <EmptyState
            title={hasFilters ? "No matching orders" : "No orders yet"}
            description={
              hasFilters
                ? "Try clearing a filter or searching for another customer."
                : "Orders will appear here when customers check out."
            }
          />
        )}

        <Drawer
          open={Boolean(selected)}
          onClose={() => setSelectedId("")}
          title={selected ? `Order ${selected.id}` : "Order"}
          description={selected ? formatDateTime(selected.date) : undefined}
          footer={
            selected ? (
              <>
                <button
                  type="button"
                  className="admin-button admin-button--ghost"
                  onClick={() => window.print()}
                >
                  <Printer size={16} /> Print invoice
                </button>
                <select
                  className="admin-select"
                  value={normaliseAdminOrderStatus(selected.status)}
                  disabled={saving}
                  onChange={(event) => void changeStatus(event.target.value)}
                  aria-label="Change order status"
                >
                  <option value={normaliseAdminOrderStatus(selected.status)}>
                    {ADMIN_ORDER_STATUS_LABELS[normaliseAdminOrderStatus(selected.status)]} (current)
                  </option>
                  {allowedNextStatuses(normaliseAdminOrderStatus(selected.status)).map((value) => (
                    <option key={value} value={value}>
                      Move to {ADMIN_ORDER_STATUS_LABELS[value]}
                    </option>
                  ))}
                </select>
              </>
            ) : null
          }
        >
          {selected ? (
            <div className="admin-drawer-sections">
              <section className="admin-drawer-section">
                <h3>Customer</h3>
                <div className="admin-detail-grid">
                  <span>Name<strong>{selected.customer}</strong></span>
                  <span>Email<strong>{selected.email}</strong></span>
                  <span>Phone<strong>{selected.phone || "—"}</strong></span>
                  <span>Payment<strong>{selected.paymentMethod} · {selected.paymentStatus}</strong></span>
                </div>
              </section>

              <section className="admin-drawer-section">
                <h3>Items</h3>
                <ul className="admin-order-items">
                  {selected.items.map((item, index) => (
                    <li key={`${item.slug}-${index}`}>
                      <span className="admin-order-item-image" aria-hidden="true">
                        {item.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.image} alt="" />
                        ) : (
                          "—"
                        )}
                      </span>
                      <span className="admin-order-item-copy">
                        <strong>{item.name}</strong>
                        <small>
                          {item.stitching} · Qty {item.quantity}
                          {item.size ? ` · Size ${item.size}` : ""}
                          {item.lining ? ` · ${item.lining}` : ""}
                        </small>
                        {item.measurements.length ? (
                          <span className="admin-measurements">
                            {item.measurements.map((measurement) => (
                              <span key={measurement.label}>
                                {measurement.label}: <strong>{measurement.value}</strong>
                              </span>
                            ))}
                          </span>
                        ) : null}
                        {item.notes ? <small className="admin-item-note">{item.notes}</small> : null}
                      </span>
                      <strong>{formatMoney(item.price * item.quantity, selected.currency)}</strong>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="admin-drawer-section">
                <h3>Shipping address</h3>
                <p className="admin-address">{selected.address.join(", ")}</p>
                {selected.trackingNumber ? (
                  <p className="admin-tracking">
                    {selected.courier || "Courier"} · {selected.trackingNumber}
                  </p>
                ) : null}
              </section>

              <section className="admin-drawer-section">
                <h3>Totals</h3>
                <dl className="admin-totals">
                  <div><dt>Subtotal</dt><dd>{formatMoney(selected.subtotal, selected.currency)}</dd></div>
                  <div><dt>Shipping</dt><dd>{formatMoney(selected.shipping, selected.currency)}</dd></div>
                  <div><dt>Discount</dt><dd>−{formatMoney(selected.discount, selected.currency)}</dd></div>
                  <div className="is-total"><dt>Total</dt><dd>{formatMoney(selected.total, selected.currency)}</dd></div>
                </dl>
                {selected.notes ? <p className="admin-order-notes">{selected.notes}</p> : null}
              </section>

              <section className="admin-drawer-section">
                <h3>Status timeline</h3>
                {selected.history.length ? (
                  <ol className="admin-timeline">
                    <AnimatePresence initial={false}>
                      {[...selected.history].reverse().map((event, index) => (
                        <motion.li
                          key={`${event.at}-${index}`}
                          initial={reduce ? false : { opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                        >
                          <span className="admin-timeline-dot" aria-hidden="true" />
                          <strong>{event.message}</strong>
                          <small>{formatDateTime(event.at)} · {event.by}</small>
                        </motion.li>
                      ))}
                    </AnimatePresence>
                  </ol>
                ) : (
                  <p className="admin-muted">No status changes recorded yet.</p>
                )}
              </section>
            </div>
          ) : null}
        </Drawer>

        <div className="admin-print-only" aria-hidden="true">
          {selected ? (
            <div className="admin-invoice">
              <h1>{formatMoney(selected.total, selected.currency)}</h1>
              <p>Invoice for {selected.id} · {formatDate(selected.date)}</p>
              <h2>{selected.customer}</h2>
              <p>{selected.address.join(", ")}</p>
              <ul>
                {selected.items.map((item, index) => (
                  <li key={index}>
                    {item.name} × {item.quantity} — {formatMoney(item.price * item.quantity, selected.currency)}
                    <small>{item.stitching}</small>
                  </li>
                ))}
              </ul>
              <strong>Total: {formatMoney(selected.total, selected.currency)}</strong>
              <p>Payment: {selected.paymentMethod} · {selected.paymentStatus}</p>
            </div>
          ) : null}
        </div>
      </div>
    </PageTransition>
  );
}
