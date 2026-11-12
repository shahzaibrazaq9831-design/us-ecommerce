import { Suspense } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { listApprovedReviews } from "@/lib/reviews";
import { products, summariseRatings } from "@/lib/products";
import ReviewCard from "@/components/ReviewCard";
import ReviewForm from "@/components/ReviewForm";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Customer Reviews",
  description:
    "Read what our customers say about our dresses — the fit, the fabric and the stitching — and write a review of your own.",
  path: "/reviews",
});

/**
 * The reviews page.
 *
 * Every review here is a real one that a customer wrote and that our
 * team approved. New reviews are held back until they are approved, so
 * the page only ever shows the ones that made it through.
 */
async function ReviewsContent() {
  const reviews = await listApprovedReviews();
  const summary = summariseRatings(reviews);

  return (
    <>
      <section className="reviews-header-section" aria-labelledby="reviews-heading">
        <div className="container reviews-header-container">
          <nav className="reviews-breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <ChevronRight size={14} aria-hidden="true" />
            <span className="reviews-breadcrumb-current" aria-current="page">
              Reviews
            </span>
          </nav>
          <p className="reviews-eyebrow" id="reviews-eyebrow">
            Customer Reviews
          </p>
          <h1 className="reviews-title" id="reviews-heading">
            Reviews from our customers
          </h1>
          <div className="reviews-rule" aria-hidden="true"></div>

          <div className="reviews-stats">
            <div className="reviews-stat">
              <p className="reviews-stat-value">
                {summary.count > 0 ? summary.average : "—"}
                <span className="reviews-stat-slash">/ 5</span>
              </p>
              <p className="reviews-stat-label">Rating</p>
            </div>
            <div className="reviews-stat">
              <p className="reviews-stat-value">{summary.count}</p>
              <p className="reviews-stat-label">Reviews</p>
            </div>
          </div>
        </div>
      </section>

      <section className="container reviews-main" aria-labelledby="reviews-list-heading">
        <div className="reviews-section-header">
          <p className="reviews-eyebrow reviews-section-eyebrow">Customer feedback</p>
          <h2 className="reviews-section-title" id="reviews-list-heading">
            What our customers say
          </h2>
        </div>

        {reviews.length > 0 ? (
          <ul className="reviews-list">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </ul>
        ) : (
          <div className="listing-empty" role="status">
            There are no published reviews yet. Once a customer review is approved it
            appears here.
          </div>
        )}

        <div className="reviews-write">
          <ReviewForm
            products={products.map((product) => ({
              slug: product.slug,
              name: product.name,
            }))}
          />
        </div>
      </section>
    </>
  );
}

export default function ReviewsPage() {
  return (
    <Suspense
      fallback={
        <section className="container reviews-main">
          <div className="listing-empty" role="status">
            Loading reviews…
          </div>
        </section>
      }
    >
      <ReviewsContent />
    </Suspense>
  );
}
