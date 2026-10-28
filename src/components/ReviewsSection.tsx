"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Camera,
  ChevronLeft,
  ChevronRight,
  Quote,
  X,
} from "lucide-react";
import type { Review } from "@/data/site";

interface ReviewsSectionProps {
  reviews: Review[];
  /** Shows the "Read all reviews" button under the carousel. */
  showAllLink?: boolean;
  /** The homepage uses h2; the reviews page uses h1. */
  headingAs?: "h1" | "h2";
}

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** Cards visible at once, matching the CSS breakpoints. */
function cardsPerView() {
  if (typeof window === "undefined") return 4;
  if (window.matchMedia("(min-width: 1024px)").matches) return 4;
  if (window.matchMedia("(min-width: 640px)").matches) return 2;
  return 1;
}

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

function formatReviewDate(date: string) {
  return dateFormatter.format(new Date(`${date}T12:00:00Z`));
}

export default function ReviewsSection({
  reviews,
  showAllLink = true,
  headingAs = "h2",
}: ReviewsSectionProps) {
  const railRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const lastTriggerRef = useRef<HTMLButtonElement | null>(null);
  const [perView, setPerView] = useState(4);
  const [activePage, setActivePage] = useState(0);
  const [lightbox, setLightbox] = useState<Review | null>(null);
  const Heading = headingAs;

  const pageCount = Math.max(1, Math.ceil(reviews.length / perView));

  const measure = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return null;

    const card = rail.querySelector<HTMLElement>(".cr-card-wrap");
    if (!card) return null;

    const gap = parseFloat(window.getComputedStyle(rail).columnGap) || 0;
    const step = card.getBoundingClientRect().width + gap;

    return {
      rail,
      step,
      maxScroll: rail.scrollWidth - rail.clientWidth,
    };
  }, []);

  const syncActivePage = useCallback(() => {
    const metrics = measure();
    if (!metrics) return;

    const cardIndex = Math.round(metrics.rail.scrollLeft / metrics.step);
    const page = Math.min(
      Math.round(cardIndex / perView),
      Math.max(0, pageCount - 1)
    );

    setActivePage(page);
  }, [measure, perView, pageCount]);

  // Keep the active dot in sync with touch / trackpad scrolling.
  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;

    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        syncActivePage();
      });
    };

    syncActivePage();
    rail.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      rail.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [syncActivePage]);

  // Recalculate how many cards fit whenever the breakpoint changes.
  useEffect(() => {
    const update = () => setPerView(cardsPerView());

    update();
    const wide = window.matchMedia("(min-width: 1024px)");
    const medium = window.matchMedia("(min-width: 640px)");
    wide.addEventListener("change", update);
    medium.addEventListener("change", update);

    return () => {
      wide.removeEventListener("change", update);
      medium.removeEventListener("change", update);
    };
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(syncActivePage);
    return () => window.cancelAnimationFrame(frame);
  }, [perView, syncActivePage]);

  const goToPage = useCallback(
    (page: number) => {
      const metrics = measure();
      if (!metrics) return;

      const target = Math.max(0, Math.min(page, pageCount - 1));
      setActivePage(target);

      metrics.rail.scrollTo({
        left: Math.min(target * metrics.step * perView, metrics.maxScroll),
        behavior: prefersReducedMotion() ? "auto" : "smooth",
      });
    },
    [measure, pageCount, perView]
  );

  // Close the photo dialog with Escape and lock page scrolling while it is open.
  useEffect(() => {
    if (!lightbox) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLightbox(null);
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      lastTriggerRef.current?.focus();
    };
  }, [lightbox]);

  return (
    <section className="cr-section" aria-labelledby="customer-reviews">
      <div className="cr-container">
        <div className="cr-header">
          <div className="cr-header-row">
            <span className="cr-rule" aria-hidden="true" />
            <Heading id="customer-reviews" className="cr-title">
              Customer Reviews
            </Heading>
            <span className="cr-rule" aria-hidden="true" />
          </div>
          <p className="cr-subtitle">Customer experiences, in their own words</p>
        </div>

        <div className="cr-carousel">
          <button
            type="button"
            className="cr-arrow cr-arrow--prev"
            onClick={() => goToPage(activePage - 1)}
            aria-label="Show previous reviews"
          >
            <ChevronLeft size={20} aria-hidden="true" />
          </button>

          <div
            ref={railRef}
            className="cr-rail"
            role="region"
            aria-roledescription="carousel"
            aria-label="Customer reviews"
          >
            {reviews.map((review) => {
              return (
                <div key={review.id} className="cr-card-wrap">
                  <article className="cr-card">
                    <div className="cr-photo">
                      <button
                        type="button"
                        className="cr-photo-button"
                        onClick={(event) => {
                          lastTriggerRef.current = event.currentTarget;
                          setLightbox(review);
                        }}
                        aria-haspopup="dialog"
                        aria-expanded={lightbox?.id === review.id}
                        aria-label={`View full photo: Customer photo of ${review.product}`}
                      >
                        <Image
                          src={review.image}
                          alt={`Customer photo of ${review.product}`}
                          fill
                          sizes="(max-width: 639px) 86vw, (max-width: 1023px) 46vw, 330px"
                          className="cr-photo-image"
                        />
                      </button>
                      <span className="cr-photo-badge">
                        <Camera size={14} strokeWidth={2} aria-hidden="true" />
                        Customer photo
                      </span>
                    </div>

                    <div className="cr-card-body">
                      <div className="cr-card-head">
                        <div>
                          <Link
                            href={review.productHref}
                            className="cr-product"
                          >
                            {review.product}
                          </Link>
                          <div className="cr-rating">
                            <div className="cr-stars" aria-hidden="true">
                              {Array.from({ length: 5 }, (_, index) => {
                                const filled = index < Math.round(review.rating);
                                return (
                                  <span
                                    key={index}
                                    className="cr-star"
                                    aria-label={
                                      filled ? "Filled star" : "Empty star"
                                    }
                                    aria-hidden="true"
                                  >
                                    <svg
                                      width="16"
                                      height="16"
                                      viewBox="0 0 24 24"
                                      fill={filled ? "var(--cr-gold)" : "none"}
                                      stroke={
                                        filled
                                          ? "var(--cr-gold)"
                                          : "rgba(138, 129, 119, 0.4)"
                                      }
                                      strokeWidth="1.5"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      className="cr-star-icon"
                                    >
                                      <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" />
                                    </svg>
                                  </span>
                                );
                              })}
                            </div>
                            <span className="cr-rating-value">
                              <span className="cr-sr-only">Rated </span>
                              {review.rating.toFixed(1)}
                              <span className="cr-sr-only"> out of 5</span>
                            </span>
                          </div>
                        </div>

                        <Quote
                          size={28}
                          strokeWidth={2}
                          className="cr-quote"
                          aria-hidden="true"
                        />
                      </div>

                      <blockquote className="cr-text">
                        {review.text}
                      </blockquote>

                      <footer className="cr-footer">
                        <div className="cr-author-row">
                          <p className="cr-author">{review.author}</p>
                          {review.verified && (
                            <span className="cr-verified">
                              Verified purchase
                            </span>
                          )}
                        </div>
                        <time
                          dateTime={review.date}
                          className="cr-date"
                          aria-label={`Posted on ${formatReviewDate(
                            review.date
                          )}`}
                        >
                          {formatReviewDate(review.date)}
                        </time>
                      </footer>
                    </div>
                  </article>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            className="cr-arrow cr-arrow--next"
            onClick={() => goToPage(activePage + 1)}
            aria-label="Show next reviews"
          >
            <ChevronRight size={20} aria-hidden="true" />
          </button>
        </div>

        <div className="cr-dots" aria-label="Review pages">
          {Array.from({ length: pageCount }, (_, page) => {
            const isActive = page === activePage;

            return (
              <button
                key={page}
                type="button"
                className="cr-dot"
                onClick={() => goToPage(page)}
                aria-label={`Show review group ${page + 1} of ${pageCount}`}
                aria-current={isActive ? "true" : undefined}
              >
                <span
                  className={`cr-dot-mark${isActive ? " is-active" : ""}`}
                  aria-hidden="true"
                />
              </button>
            );
          })}
        </div>

        {showAllLink && (
          <div className="cr-all">
            <Link href="/reviews" className="cr-all-link">
              Read all reviews
              <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
            </Link>
          </div>
        )}
      </div>

      {lightbox && (
        <div
          className="cr-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Customer photo"
          onClick={(event) => {
            if (event.target === event.currentTarget) setLightbox(null);
          }}
        >
          <button
            ref={closeButtonRef}
            type="button"
            className="cr-lightbox-close"
            onClick={() => setLightbox(null)}
            aria-label="Close photo"
          >
            <X size={22} aria-hidden="true" />
          </button>
          <div className="cr-lightbox-body">
            <Image
              src={lightbox.image}
              alt={`Customer photo of ${lightbox.product}`}
              fill
              sizes="(max-width: 767px) 92vw, 900px"
              className="cr-lightbox-image"
            />
          </div>
        </div>
      )}
    </section>
  );
}
