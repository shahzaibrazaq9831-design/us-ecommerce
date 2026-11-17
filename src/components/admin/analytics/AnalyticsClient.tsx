"use client";

import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  CircleDollarSign,
  ShoppingBag,
  Star,
  TriangleAlert,
  Users,
  Wallet,
} from "lucide-react";
import PageTransition from "@/components/admin/PageTransition";
import StatCard from "@/components/admin/StatCard";
import { CountBar, RankingBar, RevenueAreaChart, StatusDonut } from "@/components/admin/Charts";
import { formatMoney } from "@/lib/admin/format";
import type { AdminSnapshot, DashboardAnalytics } from "@/lib/admin/types";

const RANGES = [30, 90, 365] as const;
type Range = (typeof RANGES)[number];

export default function AnalyticsClient({
  analytics,
  source,
  schemaNotice,
  stats,
}: {
  analytics: DashboardAnalytics;
  source: AdminSnapshot["source"];
  schemaNotice: string | null;
  stats: {
    totalOrders: number;
    totalCustomers: number;
    averageRating: number;
    reviewCount: number;
  };
}) {
  const [range, setRange] = useState<Range>(30);
  const reduce = useReducedMotion();

  const series = useMemo(
    () => analytics.revenueSeries.slice(-range),
    [analytics.revenueSeries, range]
  );

  const rangeStats = useMemo(() => {
    const revenue = series.reduce((total, point) => total + point.revenue, 0);
    const orders = series.reduce((total, point) => total + point.orders, 0);
    const activeDays = series.filter((point) => point.revenue > 0).length;
    return {
      revenue,
      orders,
      activeDays,
      averageOrderValue: orders ? revenue / orders : 0,
    };
  }, [series]);

  const cards = [
    {
      label: `Revenue · ${range}d`,
      value: rangeStats.revenue,
      icon: <CircleDollarSign size={19} />,
      hint: `Paid orders in the last ${range} days`,
      tone: "gold" as const,
      format: (value: number) => formatMoney(value),
    },
    {
      label: `Paid orders · ${range}d`,
      value: rangeStats.orders,
      icon: <ShoppingBag size={19} />,
      hint: "Cancelled and refunded excluded",
      tone: "green" as const,
    },
    {
      label: "Average order value",
      value: rangeStats.averageOrderValue,
      icon: <Wallet size={19} />,
      hint: `Across ${rangeStats.orders} paid order${rangeStats.orders === 1 ? "" : "s"}`,
      tone: "blue" as const,
      format: (value: number) => formatMoney(value),
    },
    {
      label: "Active days",
      value: rangeStats.activeDays,
      icon: <TriangleAlert size={19} />,
      hint: `Days with revenue in the last ${range}`,
      tone: "rose" as const,
    },
    {
      label: "Average rating",
      value: stats.averageRating,
      icon: <Star size={19} />,
      hint: `${stats.reviewCount} review${stats.reviewCount === 1 ? "" : "s"} on record`,
      tone: "gold" as const,
      format: (value: number) => value.toFixed(1),
    },
    {
      label: "Customers",
      value: stats.totalCustomers,
      icon: <Users size={19} />,
      hint: `${stats.totalOrders} orders on record`,
      tone: "blue" as const,
    },
  ];

  return (
    <PageTransition>
      <div className="admin-page">
        <header className="admin-page-head">
          <div>
            <p className="admin-eyebrow">Insights</p>
            <h1>Analytics</h1>
            <p className="admin-subtitle">
              Calculated from {stats.totalOrders} recorded orders · source: {source}
            </p>
          </div>
          <div className="admin-head-actions">
            <div className="admin-segmented" role="group" aria-label="Analytics date range">
              {RANGES.map((value) => (
                <button
                  key={value}
                  type="button"
                  className={range === value ? "is-active" : ""}
                  onClick={() => setRange(value)}
                  aria-pressed={range === value}
                >
                  {value}d
                </button>
              ))}
            </div>
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

        <div className="admin-chart-grid admin-chart-grid--overview">
          <div className="admin-chart-span-2">
            <RevenueAreaChart data={series} />
          </div>
          <StatusDonut data={analytics.statusCounts} />
        </div>

        <motion.div
          className="admin-chart-grid"
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <RankingBar
            title="Top products"
            subtitle="Ranked by paid order revenue"
            data={analytics.topProducts}
          />
          <CountBar
            title="Top brands"
            subtitle="Ranked by paid order revenue"
            data={analytics.topBrands}
            color="#c9a227"
          />
          <CountBar
            title="Categories"
            subtitle="Products per category"
            data={analytics.categoryCounts}
          />
          <CountBar
            title="Occasions"
            subtitle="Products per occasion"
            data={analytics.occasionCounts}
            color="#c9a227"
          />
          <CountBar
            title="Cities"
            subtitle="Orders per delivery city"
            data={analytics.cityCounts}
          />
          <CountBar
            title="Countries"
            subtitle="Orders per delivery country"
            data={analytics.countryCounts}
            color="#c9a227"
          />
          <CountBar
            title="Rating breakdown"
            subtitle={`All ${stats.reviewCount} review${stats.reviewCount === 1 ? "" : "s"}`}
            data={analytics.ratingBreakdown}
          />
        </motion.div>
      </div>
    </PageTransition>
  );
}
