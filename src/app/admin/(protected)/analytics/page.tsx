import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin-session";
import { getAdminSnapshot } from "@/lib/admin/data";
import { averageRating, buildAnalytics, revenueSeries } from "@/lib/admin/analytics";
import AnalyticsClient from "@/components/admin/analytics/AnalyticsClient";

export const metadata: Metadata = {
  title: "Analytics",
  description: "Revenue, status and ranking insights from recorded store data.",
};

export default async function AdminAnalyticsPage() {
  await requireAdmin();
  const snapshot = await getAdminSnapshot();
  const analytics = buildAnalytics(snapshot);

  return (
    <AnalyticsClient
      // A full year is sent so the client can slice it for 30/90/365-day views.
      analytics={{ ...analytics, revenueSeries: revenueSeries(snapshot.orders, 365) }}
      source={snapshot.source}
      schemaNotice={snapshot.schemaNotice}
      stats={{
        totalOrders: snapshot.orders.length,
        totalCustomers: snapshot.customers.length,
        averageRating: averageRating(snapshot.reviews),
        reviewCount: snapshot.reviews.length,
      }}
    />
  );
}
