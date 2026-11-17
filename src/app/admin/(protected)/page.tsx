import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin-session";
import { getAdminSnapshot } from "@/lib/admin/data";
import { averageRating, buildAnalytics, revenueSeries } from "@/lib/admin/analytics";
import OverviewClient from "@/components/admin/overview/OverviewClient";

export const metadata: Metadata = { title: "Overview" };

export default async function AdminOverviewPage() {
  await requireAdmin();
  const snapshot = await getAdminSnapshot();
  const analytics = buildAnalytics(snapshot);

  // Server-rendered analytics: the cutoff is read once for this snapshot.
  // eslint-disable-next-line react-hooks/purity
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recentEmails = new Set(
    snapshot.orders
      .filter((order) => new Date(order.date).getTime() >= thirtyDaysAgo)
      .map((order) => order.email.toLowerCase())
  );

  const today = new Date().toISOString().slice(0, 10);
  const totalRevenue = revenueSeries(snapshot.orders, 3650).reduce(
    (sum, point) => sum + point.revenue,
    0
  );

  return (
    <OverviewClient
      snapshot={snapshot}
      analytics={analytics}
      stats={{
        totalRevenue,
        ordersToday: snapshot.orders.filter((order) => order.date.slice(0, 10) === today).length,
        pendingOrders: snapshot.orders.filter((order) => order.status === "pending").length,
        totalProducts: snapshot.products.length,
        lowStock: snapshot.products.filter((product) => product.stock <= 5).length,
        averageRating: averageRating(snapshot.reviews),
        newCustomers: recentEmails.size,
      }}
    />
  );
}
