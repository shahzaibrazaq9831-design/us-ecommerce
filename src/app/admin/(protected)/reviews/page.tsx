import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin-session";
import { getAdminSnapshot } from "@/lib/admin/data";
import ReviewsClient from "@/components/admin/reviews/ReviewsClient";

export const metadata: Metadata = {
  title: "Reviews",
  description: "Moderate customer reviews for the store.",
};

export default async function AdminReviewsPage() {
  await requireAdmin();
  const snapshot = await getAdminSnapshot();

  return (
    <ReviewsClient
      reviews={snapshot.reviews}
      source={snapshot.source}
      schemaNotice={snapshot.schemaNotice}
    />
  );
}
