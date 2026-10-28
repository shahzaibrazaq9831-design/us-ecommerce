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
      className="fixed bottom-3 left-3 z-40 w-[calc(100vw-6rem)] max-w-[23rem] cr-popup-enter rounded-2xl border border-emerald/10 bg-white p-3 text-[var(--cr-ink)] shadow-[0_12px_40px_-12px_rgba(23,60,53,0.24)] sm:left-5 sm:bottom-4 sm:w-[23rem] sm:p-4"
    >
      <button
        type="button"
        onClick={dismiss}
        className="absolute top-1 right-1 inline-flex size-8 items-center justify-center rounded-full border border-transparent bg-transparent text-[var(--cr-muted)]/70 transition-colors hover:bg-[#f4efe6] hover:text-[var(--cr-ink)]"
        aria-label="Dismiss review notification"
      >
        <X size={3.5} aria-hidden="true" />
      </button>

      <div className="flex items-center gap-3 sm:gap-3.5">
        <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded-lg bg-[var(--cr-cream)] sm:h-28 sm:w-20">
          <Image
            src={review.image}
            alt={`Customer photo of ${review.author}`}
            fill
            sizes="(min-width: 640px) 80px, 64px"
            className="object-cover"
          />
        </div>
        <div className="min-w-0 flex-1 text-[0.8125rem] leading-snug">
          <p className="pr-5 leading-relaxed text-[var(--cr-muted)]">
            <strong className="font-bold text-[var(--cr-ink)]">
              {review.author} <span className="font-normal">left a </span>
              <span className="whitespace-nowrap">{review.rating}-star review</span>
            </strong>
          </p>
          {review.verified && (
            <p className="mt-1 flex items-center gap-1 text-[0.75rem] font-medium text-[var(--cr-emerald)]">
              <i className="fas fa-check-circle" aria-hidden="true" />
              Verified purchase
            </p>
          )}
          <p
            className="mt-2 truncate text-xs font-semibold text-[var(--cr-emerald)] underline underline-offset-2 decoration-transparent hover:decoration-current cursor-pointer"
            onClick={goToReviews}
          >
            Read all reviews
          </p>
        </div>
      </div>
    </aside>
  );
}
