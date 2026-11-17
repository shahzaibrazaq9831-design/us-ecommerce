"use client";

import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Crown, Search, ShoppingBag, TriangleAlert, Users, X } from "lucide-react";
import PageTransition from "@/components/admin/PageTransition";
import DataTable, { type DataColumn } from "@/components/admin/DataTable";
import StatCard from "@/components/admin/StatCard";
import { EmptyState } from "@/components/admin/Feedback";
import { formatDate, formatMoney, relativeDate } from "@/lib/admin/format";
import type { AdminCustomer, AdminSnapshot } from "@/lib/admin/types";

/** DataTable needs a stable id; an aggregated customer is keyed by email. */
type CustomerRow = AdminCustomer & { id: string };

export default function CustomersClient({
  customers,
  source,
  schemaNotice,
}: {
  customers: AdminCustomer[];
  source: AdminSnapshot["source"];
  schemaNotice: string | null;
}) {
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState("");
  const reduce = useReducedMotion();

  const rows = useMemo<CustomerRow[]>(
    () => customers.map((customer) => ({ ...customer, id: customer.email })),
    [customers]
  );

  const countries = useMemo(
    () =>
      [...new Set(customers.map((customer) => customer.country).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b)
      ),
    [customers]
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rows.filter((customer) => {
      if (country && customer.country !== country) return false;
      if (!needle) return true;
      return [customer.name, customer.email, customer.city].some((value) =>
        value.toLowerCase().includes(needle)
      );
    });
  }, [rows, query, country]);

  const summary = useMemo(() => {
    const repeat = customers.filter((customer) => customer.orders > 1).length;
    const spend = customers.reduce((total, customer) => total + customer.totalSpent, 0);
    const top = customers.reduce<AdminCustomer | null>(
      (best, customer) => (!best || customer.totalSpent > best.totalSpent ? customer : best),
      null
    );
    return { repeat, spend, top };
  }, [customers]);

  const topCustomers = useMemo(
    () =>
      [...customers]
        .sort((a, b) => b.totalSpent - a.totalSpent || b.orders - a.orders)
        .slice(0, 5),
    [customers]
  );

  const cards = [
    {
      label: "Customers",
      value: customers.length,
      icon: <Users size={19} />,
      hint: "Unique order contacts",
      tone: "blue" as const,
    },
    {
      label: "Repeat customers",
      value: summary.repeat,
      icon: <ShoppingBag size={19} />,
      hint: "More than one order",
      tone: "green" as const,
    },
    {
      label: "Recorded spend",
      value: summary.spend,
      icon: <Crown size={19} />,
      hint: "Excludes cancelled and refunded orders",
      tone: "gold" as const,
      format: (value: number) => formatMoney(value),
    },
    {
      label: "Top customer spend",
      value: summary.top?.totalSpent ?? 0,
      icon: <TriangleAlert size={19} />,
      hint: summary.top ? `Highest: ${summary.top.name}` : "No orders recorded",
      tone: "rose" as const,
      format: (value: number) => formatMoney(value),
    },
  ];

  const columns: DataColumn<CustomerRow>[] = [
    {
      key: "customer",
      header: "Customer",
      sortValue: (row) => row.name,
      render: (row) => (
        <span className="admin-cell-stack">
          <strong>{row.name}</strong>
          <small>{row.email}</small>
        </span>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      sortValue: (row) => row.phone,
      render: (row) => <span>{row.phone || "—"}</span>,
      hideOnMobile: true,
    },
    {
      key: "orders",
      header: "Orders",
      align: "right",
      sortValue: (row) => row.orders,
      render: (row) => <span>{row.orders}</span>,
    },
    {
      key: "spend",
      header: "Total spent",
      align: "right",
      sortValue: (row) => row.totalSpent,
      render: (row) => <strong>{formatMoney(row.totalSpent)}</strong>,
    },
    {
      key: "lastOrder",
      header: "Last order",
      sortValue: (row) => row.lastOrderAt,
      render: (row) => (
        <span className="admin-cell-stack">
          <strong>{formatDate(row.lastOrderAt)}</strong>
          <small>{relativeDate(row.lastOrderAt)}</small>
        </span>
      ),
    },
    {
      key: "city",
      header: "City",
      sortValue: (row) => row.city,
      render: (row) => <span>{row.city || "—"}</span>,
    },
    {
      key: "country",
      header: "Country",
      sortValue: (row) => row.country,
      render: (row) => <span>{row.country || "—"}</span>,
      hideOnMobile: true,
    },
  ];

  const hasFilters = Boolean(query || country);

  function clearFilters() {
    setQuery("");
    setCountry("");
  }

  return (
    <PageTransition>
      <div className="admin-page">
        <header className="admin-page-head">
          <div>
            <p className="admin-eyebrow">Relationships</p>
            <h1>Customers</h1>
            <p className="admin-subtitle">
              {customers.length} customer{customers.length === 1 ? "" : "s"} aggregated from orders ·
              source: {source}
            </p>
          </div>
        </header>

        {schemaNotice ? (
          <div className="admin-notice" role="status">
            <TriangleAlert size={18} aria-hidden="true" />
            <span>{schemaNotice}</span>
          </div>
        ) : null}

        <div className="admin-stat-grid">
          {cards.map((card) => (
            <StatCard key={card.label} {...card} />
          ))}
        </div>

        {topCustomers.length ? (
          <motion.section
            className="admin-panel"
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <header className="admin-card-head">
              <div>
                <h2>Top customers</h2>
                <p>Ranked by recorded spend</p>
              </div>
            </header>
            <ol className="admin-activity-list">
              {topCustomers.map((customer, index) => (
                <li key={customer.email}>
                  <span className="admin-activity-avatar" aria-hidden="true">
                    {index + 1}
                  </span>
                  <span className="admin-activity-copy">
                    <strong>{customer.name}</strong>
                    <small>
                      {customer.email}
                      {customer.city ? ` · ${customer.city}` : ""}
                    </small>
                  </span>
                  <span className="admin-activity-meta">
                    <strong>{formatMoney(customer.totalSpent)}</strong>
                    <small>
                      {customer.orders} order{customer.orders === 1 ? "" : "s"}
                    </small>
                  </span>
                </li>
              ))}
            </ol>
          </motion.section>
        ) : null}

        <section className="admin-filter-panel">
          <label className="admin-field admin-field--grow">
            <span className="admin-label">Search</span>
            <span className="admin-input-icon">
              <Search size={16} aria-hidden="true" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Name, email or city"
                aria-label="Search customers"
              />
            </span>
          </label>
          <label className="admin-field">
            <span className="admin-label">Country</span>
            <select value={country} onChange={(event) => setCountry(event.target.value)}>
              <option value="">All countries</option>
              {countries.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          {hasFilters ? (
            <button type="button" className="admin-button admin-button--ghost" onClick={clearFilters}>
              <X size={15} /> Clear
            </button>
          ) : null}
        </section>

        {customers.length ? (
          <DataTable
            rows={filtered}
            columns={columns}
            rowKey={(row) => row.email}
            initialSort={{ key: "spend", direction: "desc" }}
            emptyTitle="No matching customers"
            emptyDescription="Try another search term or clear the country filter."
          />
        ) : (
          <EmptyState
            title="No customers yet"
            description="Customers appear here as soon as an order is recorded."
          />
        )}
      </div>
    </PageTransition>
  );
}
