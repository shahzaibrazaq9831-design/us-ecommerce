import type {
  AdminSnapshot,
  DashboardAnalytics,
  DashboardOrder,
  NamedValue,
  RevenuePoint,
} from "./types";
import { normaliseAdminOrderStatus } from "./status";

function countBy(values: string[]): NamedValue[] {
  const counts = new Map<string, number>();
  for (const value of values) {
    const key = value.trim() || "Unknown";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Revenue and order counts, bucketed by day, for the last `days` days. */
export function revenueSeries(orders: DashboardOrder[], days = 90): RevenuePoint[] {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const buckets = new Map<string, RevenuePoint>();
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setUTCDate(date.getUTCDate() - offset);
    const key = dayKey(date);
    buckets.set(key, {
      date: key,
      label: new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        timeZone: "UTC",
      }).format(date),
      revenue: 0,
      orders: 0,
    });
  }

  for (const order of orders) {
    const status = normaliseAdminOrderStatus(order.status);
    if (status === "cancelled" || status === "refunded") continue;
    if (order.paymentStatus !== "paid") continue;

    const key = String(order.date ?? "").slice(0, 10);
    const bucket = buckets.get(key);
    if (!bucket) continue;
    bucket.revenue += order.total;
    bucket.orders += 1;
  }

  return [...buckets.values()];
}

/** Everything the analytics screen draws, derived only from real records. */
export function buildAnalytics(snapshot: AdminSnapshot): DashboardAnalytics {
  const { orders, products, reviews } = snapshot;

  return {
    revenueSeries: revenueSeries(orders, 90),
    statusCounts: countBy(orders.map((order) => normaliseAdminOrderStatus(order.status))),
    topProducts: snapshot.productRanking,
    topBrands: snapshot.brandRanking,
    categoryCounts: countBy(products.map((product) => product.categoryName)),
    occasionCounts: countBy(products.flatMap((product) => product.occasionSlugs)),
    cityCounts: countBy(orders.map((order) => order.city)),
    countryCounts: countBy(orders.map((order) => order.country)),
    ratingBreakdown: [5, 4, 3, 2, 1].map((rating) => ({
      name: `${rating} star${rating === 1 ? "" : "s"}`,
      value: reviews.filter((review) => review.rating === rating).length,
    })),
  };
}

export function averageRating(reviews: { rating: number }[]): number {
  if (!reviews.length) return 0;
  const total = reviews.reduce((sum, review) => sum + review.rating, 0);
  return Math.round((total / reviews.length) * 10) / 10;
}
