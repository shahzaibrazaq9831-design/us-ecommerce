"use server";

/**
 * Data for the small "a customer purchased …" notification.
 *
 * The popup is a client component, but approved reviews live on the server in
 * `.data/reviews.json`. This Server Function is the narrow bridge: it returns
 * only the fields the notification renders, and never the customer's name.
 */

import type { Review } from "@/lib/products";
import { listApprovedReviews } from "@/lib/reviews";

interface SalesPopupReview {
  id: string;
  image: string;
  product: string;
  productHref: string;
  verified: boolean;
}

/** Latest ten approved reviews that have a customer photo. */
export async function getSalesPopupReviews(): Promise<SalesPopupReview[]> {
  const reviews: Review[] = await listApprovedReviews();

  return reviews
    .filter((review) => Boolean(review.image))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 10)
    .map((review) => ({
      id: review.id,
      image: review.image,
      product: review.product,
      productHref: review.productHref,
      verified: review.verified,
    }));
}
