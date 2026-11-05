"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import GalleryProductCard from "@/components/GalleryProductCard";
import type { CollectionProduct } from "@/data/collections";

/** Pixels the mouse must travel before a press becomes a drag, not a click. */
const DRAG_THRESHOLD = 6;

/** Length of the arrow/nudge scroll tween. Short so a click feels instant. */
const SCROLL_DURATION_MS = 220;

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

interface ProductRailProps {
  /** Used for the heading id and to keep multiple rails accessible. */
  id: string;
  title: string;
  subtitle?: string;
  viewAllHref?: string;
  products: CollectionProduct[];
  /** Occasion keeps the cream background and centred header. */
  variant?: "default" | "occasion";
  /**
   * "rail" (default) — horizontal scroller with arrows.
   * "grid" — shows every item in a responsive grid (2 per row on phones,
   * 3 on tablets, 4 on desktop) with a centred gold pill button below.
   */
  layout?: "rail" | "grid";
  /** Label for the pill button rendered below the grid (grid layout only). */
  ctaLabel?: string;
}

/**
 * Horizontal product rail with the reference storefront's arrow behaviour:
 * rail arrows stay hidden on desktop until the section is hovered/focused and
 * are removed entirely on touch/mobile, where a thin progress line below the
 * rail hints at the swipe position instead.
 */
export default function ProductRail({
  id,
  title,
  subtitle,
  viewAllHref,
  products,
  variant = "default",
  layout = "rail",
  ctaLabel,
}: ProductRailProps) {
  const railRef = useRef<HTMLDivElement>(null);
  const progressThumbRef = useRef<HTMLDivElement>(null);
  const suppressClick = useRef(false);
  const animationRef = useRef<number | null>(null);
  const targetRef = useRef(0);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [autoReveal, setAutoReveal] = useState(false);

  // Auto-reveal grid images after 2 seconds so they don't wait for manual scroll.
  useEffect(() => {
    if (layout !== "grid") return;
    const timer = window.setTimeout(() => {
      setAutoReveal(true);
    }, 2000);
    return () => window.clearTimeout(timer);
  }, [layout]);

  useEffect(
    () => () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    },
    []
  );

  const updateEdges = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    if (animationRef.current === null) targetRef.current = rail.scrollLeft;
    const maxScroll = rail.scrollWidth - rail.clientWidth;
    setAtStart(rail.scrollLeft <= 2);
    setAtEnd(rail.scrollLeft >= maxScroll - 2);

    // Keep the mobile progress line in sync with the swipe position.
    const thumb = progressThumbRef.current;
    if (thumb) {
      const track = thumb.parentElement;
      if (track) {
        if (maxScroll <= 1) {
          thumb.style.width = "100%";
          thumb.style.left = "0%";
          track.style.opacity = "0";
        } else {
          const thumbWidth = (rail.clientWidth / rail.scrollWidth) * 100;
          const progress = rail.scrollLeft / maxScroll;
          thumb.style.width = `${thumbWidth}%`;
          thumb.style.left = `${progress * (100 - thumbWidth)}%`;
          track.style.opacity = "1";
        }
      }
    }
  }, []);

  const animateTo = useCallback((target: number) => {
    const rail = railRef.current;
    if (!rail) return;

    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    rail.classList.remove("is-animating");

    const maxScroll = rail.scrollWidth - rail.clientWidth;
    const clamped = Math.min(Math.max(target, 0), maxScroll);
    const startLeft = rail.scrollLeft;
    const distance = clamped - startLeft;

    if (prefersReducedMotion() || Math.abs(distance) < 1) {
      rail.scrollLeft = clamped;
      return;
    }

    rail.classList.add("is-animating");

    const startedAt = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - startedAt) / SCROLL_DURATION_MS, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      rail.scrollLeft = startLeft + distance * eased;

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(tick);
        return;
      }
      animationRef.current = null;
      rail.classList.remove("is-animating");
    };

    animationRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;

    updateEdges();
    rail.addEventListener("scroll", updateEdges, { passive: true });
    const resizeObserver = new ResizeObserver(updateEdges);
    resizeObserver.observe(rail);

    return () => {
      rail.removeEventListener("scroll", updateEdges);
      resizeObserver.disconnect();
    };
  }, [updateEdges]);

  const scrollByCard = useCallback(
    (direction: "prev" | "next") => {
      const rail = railRef.current;
      if (!rail) return;
      const card = rail.querySelector<HTMLElement>(".gallery-card");
      if (!card) return;

      const gap = parseFloat(window.getComputedStyle(rail).columnGap) || 0;
      const step = card.getBoundingClientRect().width + gap;
      const maxScroll = rail.scrollWidth - rail.clientWidth;
      const target = Math.min(
        Math.max(
          targetRef.current + (direction === "next" ? step : -step),
          0
        ),
        maxScroll
      );

      targetRef.current = target;
      animateTo(target);
    },
    [animateTo]
  );

  // Desktop mouse drag. Touch devices keep native swipe scrolling.
  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.pointerType !== "mouse" || event.button !== 0) return;

      const rail = event.currentTarget;
      const startX = event.clientX;
      const startLeft = rail.scrollLeft;
      let moved = false;

      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
        rail.classList.remove("is-animating");
      }
      targetRef.current = startLeft;

      const handleMove = (moveEvent: globalThis.PointerEvent) => {
        const delta = moveEvent.clientX - startX;
        if (!moved && Math.abs(delta) > DRAG_THRESHOLD) {
          moved = true;
          rail.classList.add("is-dragging");
        }
        if (!moved) return;
        moveEvent.preventDefault();
        rail.scrollLeft = startLeft - delta;
      };

      const handleEnd = () => {
        window.removeEventListener("pointermove", handleMove);
        window.removeEventListener("pointerup", handleEnd);
        window.removeEventListener("pointercancel", handleEnd);
        if (!moved) return;

        rail.classList.remove("is-dragging");
        suppressClick.current = true;
        window.setTimeout(() => {
          suppressClick.current = false;
        }, 0);

        const card = rail.querySelector<HTMLElement>(".gallery-card");
        if (!card) return;
        const gap = parseFloat(window.getComputedStyle(rail).columnGap) || 0;
        const step = card.getBoundingClientRect().width + gap;
        const maxScroll = rail.scrollWidth - rail.clientWidth;
        const target = Math.min(
          Math.max(Math.round(rail.scrollLeft / step), 0) * step,
          maxScroll
        );
        targetRef.current = target;
        animateTo(target);
      };

      window.addEventListener("pointermove", handleMove, { passive: false });
      window.addEventListener("pointerup", handleEnd);
      window.addEventListener("pointercancel", handleEnd);
    },
    [animateTo]
  );

  const handleClickCapture = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (!suppressClick.current) return;
    event.preventDefault();
    event.stopPropagation();
  };

  // Mouse wheel: scroll horizontally instead of vertically.
  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
      const rail = railRef.current;
      if (!rail) return;
      event.preventDefault();
      const step = 120;
      rail.scrollBy({ left: event.deltaY > 0 ? step : -step, behavior: "smooth" });
    }
  };

  // Grid layout — every item visible at once (no horizontal scroll). The
  // cards link straight to the product (buy) page; the only link in the
  // header row is gone, replaced by the gold pill below the grid.
  if (layout === "grid") {
    return (
      <section
        className="product-rail-section product-rail-section--grid"
        aria-labelledby={`${id}-heading`}
      >
        <div className="container">
          <div className="product-rail-header">
            <div className="product-rail-header-copy">
              <h2 id={`${id}-heading`} className="product-rail-title">
                {title}
              </h2>
              {subtitle && <p className="product-rail-subtitle">{subtitle}</p>}
            </div>
          </div>

          <div className={`collection-grid product-grid${autoReveal ? " is-revealing" : ""}`}>
            {products.map((product, index) => (
              <GalleryProductCard
                key={product.id}
                product={product}
                eager={autoReveal || index < 4}
              />
            ))}
          </div>

          {viewAllHref && (
            <div className="product-rail-cta-wrap">
              <Link href={viewAllHref} className="product-rail-cta">
                {ctaLabel ?? "View All"}
                <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
              </Link>
            </div>
          )}
        </div>
      </section>
    );
  }

  const isOccasion = variant === "occasion";

  return (
    <section
      className={`product-rail-section${isOccasion ? " product-rail-section--occasion" : ""}`}
      aria-labelledby={`${id}-heading`}
    >
      <div className="container">
        <div
          className={`product-rail-header${isOccasion ? " product-rail-header--occasion" : ""}`}
        >
          <div className="product-rail-header-copy">
            <h2 id={`${id}-heading`} className="product-rail-title">
              {title}
            </h2>
            {subtitle && <p className="product-rail-subtitle">{subtitle}</p>}
          </div>
          {viewAllHref && (
            <Link href={viewAllHref} className="product-rail-view-all">
              View all
            </Link>
          )}
        </div>

        <div className="product-rail-wrap">
          <button
            type="button"
            className="product-rail-arrow product-rail-arrow--prev"
            onClick={() => scrollByCard("prev")}
            aria-label={`Scroll ${title} left`}
            aria-hidden={atStart}
            tabIndex={atStart ? -1 : 0}
          >
            <ChevronLeft size={20} aria-hidden="true" />
          </button>

          <div
            ref={railRef}
            className="product-rail"
            role="region"
            aria-label={title}
            onPointerDown={handlePointerDown}
            onClickCapture={handleClickCapture}
            onDragStart={(event) => event.preventDefault()}
            onWheel={handleWheel}
          >
            {products.map((product, index) => (
              <GalleryProductCard
                key={product.id}
                product={product}
                eager={index < 4}
              />
            ))}
          </div>

          <button
            type="button"
            className="product-rail-arrow product-rail-arrow--next"
            onClick={() => scrollByCard("next")}
            aria-label={`Scroll ${title} right`}
            aria-hidden={atEnd}
            tabIndex={atEnd ? -1 : 0}
          >
            <ChevronRight size={20} aria-hidden="true" />
          </button>

          {/* Thin scroll-progress line — mobile only, stands in for the arrows */}
          <div className="product-rail-progress" aria-hidden="true">
            <div className="product-rail-progress-thumb" ref={progressThumbRef} />
          </div>
        </div>
      </div>
    </section>
  );
}
