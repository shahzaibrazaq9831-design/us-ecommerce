"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  CircleDollarSign,
  Clock3,
  Package,
  TriangleAlert,
  ShoppingCart,
  Star,
  Users,
} from "lucide-react";
import PageTransition from "@/components/admin/PageTransition";
import StatCard from "@/components/admin/StatCard";
import StatusBadge from "@/components/admin/StatusBadge";
import { CountBar, RankingBar, RevenueAreaChart, StatusDonut } from "@/components/admin/Charts";
import { EmptyState } from "@/components/admin/Feedback";
import { formatDate, formatMoney, relativeDate } from "@/lib/admin/format";
import type { AdminSnapshot, DashboardAnalytics } from "@/lib/admin/types";

export default function OverviewClient({
  snapshot,
  analytics,
  stats,
}: {
  snapshot: AdminSnapshot;
  analytics: DashboardAnalytics;
  stats: {
    totalRevenue: number;
    ordersToday: number;
    pendingOrders: number;
    totalProducts: number;
    lowStock: number;
    averageRating: number;
    newCustomers: number;
  };
}) {
  const reduce = useReducedMotion();
  const lowStock = snapshot.products
    .filter((product) => product.stock <= 5)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 5);

  const cards = [
    {
      label: "Total revenue",
      value: stats.totalRevenue,
      icon: <CircleDollarSign size={19} />,
      hint: "Paid, non-refunded orders",
      tone: "gold" as const,
      format: (value: number) => formatMoney(value),
    },
    {
      label: "Orders today",
      value: stats.ordersToday,
      icon: <ShoppingCart size={19} />,
      hint: "Placed in the last 24 hours",
      tone: "green" as const,
    },
    {
      label: "Pending orders",
      value: stats.pendingOrders,
      icon: <Clock3 size={19} />,
      hint: "Waiting for confirmation",
      tone: "blue" as const,
    },
    {
      label: "Total products",
      value: stats.totalProducts,
      icon: <Package size={19} />,
      hint: "Live catalogue items",
      tone: "green" as const,
    },
    {
      label: "Low stock",
      value: stats.lowStock,
      icon: <TriangleAlert size={19} />,
      hint: "5 units or fewer",
      tone: "rose" as const,
    },
    {
      label: "Average rating",
      value: stats.averageRating,
      icon: <Star size={19} />,
      hint: `${snapshot.reviews.length} customer reviews`,
      tone: "gold" as const,
      format: (value: number) => value.toFixed(1),
    },
    {
      label: "New customers",
      value: stats.newCustomers,
      icon: <Users size={19} />,
      hint: "First order in 30 days",
      tone: "blue" as const,
    },
  ];

  return (
    <PageTransition>
      <div className="admin-page">
        <header className="admin-page-head">
          <div>
            <p className="admin-eyebrow">Damsa Coture overview</p>
            <h1>Good to see you.</h1>
            <p className="admin-subtitle">
              A live view of your orders, catalogue and customers.
            </p>
          </div>
          <Link href="/admin/orders" className="admin-button admin-button--primary">
            View orders <ArrowRight size={16} />
          </Link>
        </header>

        {snapshot.schemaNotice ? (
          <div className="admin-notice" role="status">
            <TriangleAlert size={18} aria-hidden="true" />
            <span>{snapshot.schemaNotice}</span>
          </div>
        ) : null}

        <div className="admin-stat-grid">
          {cards.map((card) => (
            <StatCard key={card.label} {...card} />
          ))}
        </div>

        <div className="admin-chart-grid admin-chart-grid--overview">
          <div className="admin-chart-span-2">
            <RevenueAreaChart data={analytics.revenueSeries} />
          </div>
          <StatusDonut data={analytics.statusCounts} />
        </div>

        <div className="admin-chart-grid">
          <RankingBar
            title="Top selling products"
            subtitle="By paid order revenue"
            data={analytics.topProducts}
          />
          <CountBar
            title="Top brands"
            subtitle="Share of paid revenue"
            data={analytics.topBrands}
            color="#c9a227"
          />
        </div>

        <div className="admin-panel-grid">
          <motion.section
            className="admin-panel"
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <header className="admin-card-head">
              <div>
                <h2>Recent orders</h2>
                <p>The latest activity across the shop</p>
              </div>
              <Link href="/admin/orders" className="admin-link-button">
                View all
              </Link>
            </header>

            {snapshot.orders.length ? (
              <ul className="admin-activity-list">
                {snapshot.orders.slice(0, 6).map((order) => (
                  <li key={order.id}>
                    <Link href={`/admin/orders?order=${encodeURIComponent(order.id)}`}>
                      <span className="admin-activity-avatar" aria-hidden="true">
                        {order.customer.slice(0, 1).toUpperCase()}
                      </span>
                      <span className="admin-activity-copy">
                        <strong>{order.customer}</strong>
                        <small>
                          {order.id} · {relativeDate(order.date)} · {formatDate(order.date)}
                        </small>
                      </span>
                      <span className="admin-activity-meta">
                        <strong>{formatMoney(order.total, order.currency)}</strong>
                        <StatusBadge status={order.status} />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                title="No orders yet"
                description="Orders will appear here as soon as a customer checks out."
              />
            )}
          </motion.section>

          <motion.section
            className="admin-panel"
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <header className="admin-card-head">
              <div>
                <h2>Latest reviews</h2>
                <p>What customers are saying</p>
              </div>
              <Link href="/admin/reviews" className="admin-link-button">
                Moderate
              </Link>
            </header>

            {snapshot.reviews.length ? (
              <ul className="admin-review-list">
                {snapshot.reviews.slice(0, 5).map((review) => (
                  <li key={review.id}>
                    <div className="admin-review-stars" aria-label={`${review.rating} stars`}>
                      {"★".repeat(review.rating)}
                      <span>{review.rating}/5</span>
                    </div>
                    <p>“{review.text}”</p>
                    <small>
                      {review.author} · {review.productName} · {relativeDate(review.createdAt)}
                    </small>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                title="No reviews yet"
                description="Approved customer reviews will appear here."
              />
            )}
          </motion.section>
        </div>

        <motion.section
          className="admin-panel"
          initial={reduce ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <header className="admin-card-head">
            <div>
              <h2>Low-stock alerts</h2>
              <p>Pieces that need restocking soon</p>
            </div>
            <Link href="/admin/products" className="admin-link-button">
              Manage stock
            </Link>
          </header>
          {lowStock.length ? (
            <ul className="admin-low-stock-list">
              {lowStock.map((product) => (
                <li key={product.id}>
                  <span className="admin-low-stock-name">
                    <strong>{product.name}</strong>
                    <small>{product.categoryName}</small>
                  </span>
                  <span className={`admin-stock-pill ${product.stock === 0 ? "is-empty" : ""}`}>
                    {product.stock} left
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="Stock levels look healthy"
              description="Nothing is at or below the five-unit threshold."
            />
          )}
        </motion.section>
      </div>
    </PageTransition>
  );
}
