"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { heroSlides } from "@/data/site";

/** Time each slide stays on screen — matches the reference store (3000ms). */
const INTERVAL = 3000;
/** Swipe distance (px) required to change slide on touch devices. */
const SWIPE_THRESHOLD = 50;

export default function HeroSlider() {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const pointerStart = useRef<number | null>(null);

  const total = heroSlides.length;

  const goTo = useCallback(
    (index: number) => setCurrent((index + total) % total),
    [total]
  );
  const goNext = useCallback(() => goTo(current + 1), [current, goTo]);
  const goPrev = useCallback(() => goTo(current - 1), [current, goTo]);

  // Auto-advance. Recreating the interval whenever `paused` changes keeps the
  // timer in step with the CSS progress animations, which are paused in parallel.
  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % total);
    }, INTERVAL);
    return () => clearInterval(timer);
  }, [paused, total]);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      goNext();
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      goPrev();
    }
  };

  const handlePointerDown = (event: React.PointerEvent) => {
    pointerStart.current = event.clientX;
    setPaused(true);
  };

  const handlePointerUp = (event: React.PointerEvent) => {
    setPaused(false);
    const startX = pointerStart.current;
    pointerStart.current = null;
    if (startX === null) return;
    const delta = event.clientX - startX;
    if (Math.abs(delta) >= SWIPE_THRESHOLD) {
      if (delta < 0) goNext();
      else goPrev();
    }
  };

  const handlePointerCancel = () => {
    pointerStart.current = null;
    setPaused(false);
  };

  return (
    <section
      className={`hero${paused ? " paused" : ""}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setPaused(false);
        }
      }}
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
    >
      <div className="hero-slider">
        {heroSlides.map((slide, index) => (
          <div
            key={slide.title}
            className={`hero-slide${index === current ? " active" : ""}`}
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} of ${total}: ${slide.title}`}
            aria-hidden={index !== current}
          >
            <Link
              href={slide.href}
              className="hero-slide-link"
              draggable={false}
              tabIndex={index === current ? undefined : -1}
            >
              <span
                className="hero-slide-image"
                style={{ backgroundImage: `url('${slide.image}')` }}
              />
              <span className="hero-sr-only">
                {slide.title}. {slide.subtitle}. {slide.cta}.
              </span>
            </Link>
          </div>
        ))}
      </div>

      <button
        type="button"
        className="hero-arrow hero-arrow-prev"
        onClick={goPrev}
        aria-label="Previous slide"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
      </button>

      <button
        type="button"
        className="hero-arrow hero-arrow-next"
        onClick={goNext}
        aria-label="Next slide"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m9 18 6-6-6-6" />
        </svg>
      </button>

      <div className="hero-dots" role="tablist" aria-label="Choose slide">
        {heroSlides.map((slide, index) => (
          <button
            key={slide.title}
            type="button"
            role="tab"
            className={`dot${index === current ? " active" : ""}`}
            aria-label={`Show slide ${index + 1}: ${slide.title}`}
            aria-current={index === current}
            onClick={() => goTo(index)}
          >
            <span>
              {index === current && (
                <span key={current} className="hero-dot-fill" />
              )}
            </span>
          </button>
        ))}
      </div>

      <div className="hero-progress" aria-hidden="true">
        <div key={current} className="hero-progress-fill" />
      </div>
    </section>
  );
}
