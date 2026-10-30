"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import { occasions } from "@/data/occasions";

/** Pixels the mouse must travel before a press becomes a drag, not a click. */
const DRAG_THRESHOLD = 6;

/** Length of the arrow/nudge scroll tween. Short so a click feels instant. */
const SCROLL_DURATION_MS = 200;

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export default function OccasionCarousel() {
  const railRef = useRef<HTMLDivElement>(null);
  /** Set while a drag ends so the release does not open the card underneath. */
  const suppressClick = useRef(false);
  /** Active requestAnimationFrame id for the fast scroll tween. */
  const animationRef = useRef<number | null>(null);
  /** Where the tween is heading, so rapid clicks keep stepping one card. */
  const targetRef = useRef(0);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  // Stop a running tween if the section unmounts.
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
    // Keep the step target in sync with native touch/wheel scrolling.
    if (animationRef.current === null) targetRef.current = rail.scrollLeft;
    const maxScroll = rail.scrollWidth - rail.clientWidth;
    setAtStart(rail.scrollLeft <= 2);
    setAtEnd(rail.scrollLeft >= maxScroll - 2);
  }, []);

  /** Tween the rail to an exact offset with a snappy ease-out curve. */
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

    // Turn off native smooth scrolling and snapping while we drive scrollLeft.
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

  // Keep the arrow visibility in sync with scrolling, resizing and content changes.
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

  // Fade each card up once, the first time it enters the viewport.
  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;

    const cards = Array.from(
      rail.querySelectorAll<HTMLElement>("[data-reveal]")
    );
    const showAll = () => cards.forEach((card) => card.classList.add("is-visible"));

    // No observer support or reduced motion: show the cards immediately.
    if (!("IntersectionObserver" in window) || prefersReducedMotion()) {
      showAll();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );

    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, []);

  /** Move the rail by exactly one card plus the gap between cards. */
  const scrollByCard = useCallback(
    (direction: "prev" | "next") => {
      const rail = railRef.current;
      if (!rail) return;
      const card = rail.querySelector<HTMLElement>(".occasion-tile");
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

      // A drag takes over from any in-flight arrow animation.
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
        // The click event fires after pointerup; clear the flag on the next task.
        window.setTimeout(() => {
          suppressClick.current = false;
        }, 0);

        // Land on the nearest card edge after a drag.
        const card = rail.querySelector<HTMLElement>(".occasion-tile");
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

  return (
    <section
      className="occasion-carousel-section"
      aria-labelledby="occasion-carousel-heading"
    >
      <div className="container">
        <div className="occasion-carousel-header">
          <h2 id="occasion-carousel-heading" className="occasion-carousel-title">
            Shop by Occasion
          </h2>
          <p className="occasion-carousel-subtitle">
            Find your look for the ceremony, the celebration and every gathering
            in between.
          </p>
        </div>

        <div className="occasion-carousel">
          <button
            type="button"
            className="occasion-carousel-arrow occasion-carousel-arrow--prev"
            onClick={() => scrollByCard("prev")}
            aria-label="Scroll occasions left"
            aria-hidden={atStart}
            tabIndex={atStart ? -1 : 0}
          >
            <ChevronLeft size={20} aria-hidden="true" />
          </button>

          <div
            ref={railRef}
            className="occasion-carousel-rail"
            role="region"
            aria-label="Occasion collections"
            onPointerDown={handlePointerDown}
            onClickCapture={handleClickCapture}
            onDragStart={(event) => event.preventDefault()}
          >
            {occasions.map((occasion, index) => (
              <article
                key={occasion.slug}
                className="occasion-tile"
                data-reveal
                style={{ transitionDelay: `${index * 80}ms` }}
              >
                <Link
                  href={occasion.href}
                  className="occasion-tile-link"
                  aria-label={`Shop ${occasion.title} collection`}
                  draggable={false}
                >
                  <Image
                    src={occasion.image}
                    alt={`${occasion.title} outfit`}
                    fill
                    sizes="(max-width: 767px) 62vw, 230px"
                    className="occasion-tile-image"
                    draggable={false}
                  />
                  <span
                    className="occasion-tile-gradient"
                    aria-hidden="true"
                  />
                  <span
                    className="occasion-tile-gradient occasion-tile-gradient--hover"
                    aria-hidden="true"
                  />
                  <span className="occasion-tile-content">
                    <span className="occasion-tile-copy">
                      <span className="occasion-tile-label">Shop</span>
                      <span className="occasion-tile-title">
                        {occasion.title}
                      </span>
                    </span>
                    <span className="occasion-tile-arrow" aria-hidden="true">
                      <ArrowUpRight size={16} strokeWidth={1.75} />
                    </span>
                  </span>
                </Link>
              </article>
            ))}
          </div>

          <button
            type="button"
            className="occasion-carousel-arrow occasion-carousel-arrow--next"
            onClick={() => scrollByCard("next")}
            aria-label="Scroll occasions right"
            aria-hidden={atEnd}
            tabIndex={atEnd ? -1 : 0}
          >
            <ChevronRight size={20} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Without JavaScript the reveal never runs; keep the cards visible. */}
      <noscript
        dangerouslySetInnerHTML={{
          __html:
            "<style>.occasion-tile{opacity:1 !important;transform:none !important}</style>",
        }}
      />
    </section>
  );
}
