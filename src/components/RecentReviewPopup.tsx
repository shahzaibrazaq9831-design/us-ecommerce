"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import type { Review } from "@/data/site";
import { reviews } from "@/data/site";

const STORAGE_SEEN = "cr_seen_reviews";
const STORAGE_COUNT = "cr_popup_shown";
const MAX_POPUPS = 3;

/* Colours mirror the Customer Reviews section (--cr-*) so the popup looks
   like it belongs to the same site. */
const CR_EMERALD = "#173c35";
const CR_INK = "#171717";
const CR_MUTED = "#6b635a";
const CREAM = "#efe7da";

function isExcludedPage() {
  if (typeof window === "undefined") return false;
  const p = window.location.pathname;
  return (
    p === "/" ||
    p === "/reviews" ||
    p.startsWith("/reviews/") ||
    p.startsWith("/cart") ||
    p.startsWith("/checkout") ||
    p.startsWith("/account") ||
    p.startsWith("/admin") ||
    p.startsWith("/auth")
  );
}

export default function RecentReviewPopup() {
  const [open, setOpen] = useState(false);
  const [review, setReview] = useState<Review | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shownRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (isExcludedPage()) return;
    if (
      document.querySelector(
        '[role="dialog"][data-state="open"], [role="region"][aria-label="Cookie choices"]'
      )
    ) {
      return;
    }

    let count = 0;
    try {
      count = Number(sessionStorage.getItem(STORAGE_COUNT)) || 0;
    } catch {}
    let seen: string[] = [];
    try {
      seen = JSON.parse(sessionStorage.getItem(STORAGE_SEEN) ?? "[]");
      if (!Array.isArray(seen)) seen = [];
    } catch {}
    shownRef.current = new Set(seen);

    if (count >= MAX_POPUPS || seen.length >= reviews.length) return;

    const next = reviews
      .filter((r) => r.image && !shownRef.current.has(r.id))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

    if (!next) return;

    const start = () => {
      timerRef.current = setTimeout(() => {
        if (document.hidden) return;
        setReview(next);
        setOpen(true);
      }, 2200);
    };

    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      window.removeEventListener("load", start);
    };
  }, []);

  const dismiss = useCallback(() => {
    setOpen(false);
    if (!review) return;
    shownRef.current.add(review.id);
    try {
      sessionStorage.setItem(
        STORAGE_SEEN,
        JSON.stringify([...shownRef.current])
      );
    } catch {}
    let count = 0;
    try {
      count = Number(sessionStorage.getItem(STORAGE_COUNT)) || 0;
    } catch {}
    try {
      sessionStorage.setItem(STORAGE_COUNT, String(count + 1));
    } catch {}
    setReview(null);
  }, [review]);

  const goToReviews = useCallback(() => {
    setOpen(false);
    if (typeof window === "undefined") return;
    window.location.href = "/reviews";
  }, []);

  if (!open || !review) return null;

  const dateFormatter = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  return (
    <aside
      aria-label="New customer review"
      role="region"
      className="cr-popup cr-popup-enter"
    >
      <button
        type="button"
        onClick={dismiss}
        className="cr-popup-dismiss"
        aria-label="Dismiss review notification"
      >
        <X size={18} aria-hidden="true" />
      </button>

      <div className="cr-popup-content">
        <div className="cr-popup-image">
          <Image
            src={review.image}
            alt={`Customer photo of ${review.author}`}
            fill
            sizes="(min-width: 640px) 80px, 64px"
          />
        </div>
        <div className="cr-popup-copy">
          <p className="cr-popup-summary">
            <strong>
              {review.author} left a{" "}
              <span className="cr-popup-review-rating">{review.rating}-star review</span>
            </strong>
          </p>
          {review.verified && (
            <p className="cr-popup-verified">
              <i className="fas fa-check-circle" aria-hidden="true" />
              Verified purchase
            </p>
          )}
          <button
            type="button"
            className="cr-popup-link"
            onClick={goToReviews}
          >
            Read all reviews
          </button>
        </div>
      </div>
    </aside>
  );
}
