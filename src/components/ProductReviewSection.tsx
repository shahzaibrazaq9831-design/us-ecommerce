import { listApprovedReviewsForProduct } from "@/lib/reviews";
import { summariseRatings, type Product } from "@/lib/products";
import ReviewCard from "@/components/ReviewCard";
import ReviewForm from "@/components/ReviewForm";
import { Stars } from "@/components/ReviewCard";

/**
 * The review section on a product page.
 *
 * It shows the approved reviews for this piece and the real average
 * rating. A piece with no approved review says so plainly — there is no
 * made-up rating and no made-up review anywhere on the page.
 */
export default async function ProductReviewSection({ product }: { product: Product }) {
  const reviews = await listApprovedReviewsForProduct(product.slug);
  const summary = summariseRatings(reviews);

  return (
    <section className="product-reviews" aria-labelledby="product-reviews-heading">
      <div className="product-reviews-head">
        <h2 id="product-reviews-heading" className="product-reviews-title">
          Customer reviews
        </h2>

        {summary.count > 0 ? (
          <div className="product-reviews-summary">
            <span className="product-reviews-average">{summary.average}</span>
            <span className="product-reviews-stars">
              <Stars rating={summary.average} />
            </span>
            <span className="product-reviews-count">
              {summary.count} {summary.count === 1 ? "review" : "reviews"}
            </span>
          </div>
        ) : (
          <p className="product-reviews-empty">
            No reviews yet. If you have ordered this piece, we would love to hear how
            it went.
          </p>
        )}
      </div>

      {reviews.length > 0 && (
        <ul className="reviews-list product-reviews-list">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </ul>
      )}

      <ReviewForm productSlug={product.slug} />
    </section>
  );
}
