import Image from "next/image";
import Link from "next/link";
import { Camera } from "lucide-react";
import type { Review } from "@/lib/products";

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

function reviewDate(date: string) {
  return dateFormatter.format(new Date(`${date}T12:00:00Z`));
}

/** Crisp, whole gold stars — no blurry partial fill. */
export function Stars({ rating }: { rating: number }) {
  return (
    <div className="review-stars" aria-hidden="true">
      {Array.from({ length: 5 }, (_, index) => {
        const filled = index < Math.round(rating);
        return (
          <span
            key={index}
            className="review-star"
            aria-label={filled ? "Filled star" : "Empty star"}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill={filled ? "var(--cr-gold)" : "none"}
              stroke={filled ? "var(--cr-gold)" : "rgba(138, 129, 119, 0.4)"}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" />
            </svg>
          </span>
        );
      })}
    </div>
  );
}

function AuthorAvatar({ author }: { author: string }) {
  const initials = author
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="review-avatar-wrap">
      <div className="review-avatar-fallback">{initials}</div>
    </div>
  );
}

/**
 * One review, as a customer sees it.
 *
 * The photo is only shown when the review really has one, and the
 * "Verified purchase" badge is only shown when the review is tied to a
 * real order.
 */
export default function ReviewCard({ review }: { review: Review }) {
  const average = (Math.round(review.rating * 10) / 10).toFixed(1);

  return (
    <li className="review-item">
      <article className="review-card">
        <svg
          className="review-quote"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--cr-gold)"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeOpacity="0.25"
          aria-hidden="true"
        >
          <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" />
        </svg>

        <div className="review-head">
          <AuthorAvatar author={review.author} />
          <div className="review-head-right">
            <div className="review-author-line">
              <p className="review-author">{review.author}</p>
              {review.verified && (
                <span className="review-verified">Verified purchase</span>
              )}
            </div>
            <div className="review-meta">
              <div className="review-rating-row">
                <Stars rating={review.rating} />
                <span className="review-rating-value">
                  <span className="review-sr-only">Rated </span>
                  {average}
                  <span className="review-sr-only"> out of 5</span>
                </span>
              </div>
              <time className="review-date" dateTime={review.date}>
                {reviewDate(review.date)}
              </time>
            </div>
          </div>
        </div>

        <blockquote className="review-text">{review.text}</blockquote>

        {review.image && (
          <div className="review-photos">
            <p className="review-photos-label">
              <Camera size={14} aria-hidden="true" />
              Customer photos
            </p>
            <ul className="review-photo-grid">
              <li className="review-photo-item">
                <Image
                  src={review.image}
                  alt={`Customer photo supplied with ${review.author}'s review of ${review.product}`}
                  fill
                  className="review-photo"
                  sizes="(max-width: 640px) 100vw, 184px"
                />
              </li>
            </ul>
          </div>
        )}

        <footer className="review-footer">
          <Link href={review.productHref} className="review-product-link">
            {review.product}
          </Link>
        </footer>
      </article>
    </li>
  );
}
