"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image, { getImageProps } from "next/image";
import Link from "next/link";
import { heroSlides } from "@/data/site";

/** Time each slide stays on screen — matches the reference store (3000ms). */
const DESKTOP_INTERVAL = 3000;
/** Phones get a slower, calmer rotation (5000ms). */
const MOBILE_INTERVAL = 5000;
/** Swipe distance (px) required to change slide on touch devices. */
const SWIPE_THRESHOLD = 45;

export default function HeroSlider() {
  const [current, setCurrent] = useState(0);
  /** Hovering or focusing the slider freezes the slide and the countdown. */
  const [paused, setPaused] = useState(false);
  /** Once the visitor navigates by hand, auto-advance stays off (as on the reference store). */
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [interval, setIntervalMs] = useState(DESKTOP_INTERVAL);

  const swipeStart = useRef<{ x: number; y: number } | null>(null);
  /** Time left on the current slide, so resuming continues where the pause happened. */
  const remaining = useRef(DESKTOP_INTERVAL);
  const startedAt = useRef(0);

  const total = heroSlides.length;
  /** Auto-advance is eligible unless there is a single slide or the visitor prefers reduced motion. */
  const autoPlay = total > 1 && !reducedMotion;
  /** The countdown only runs while eligible, not manually stopped, and not hovered/focused. */
  const running = autoPlay && autoAdvance && !paused;

  const goTo = useCallback(
    (index: number) => setCurrent((index + total) % total),
    [total]
  );

  /** Arrows, dots, keys and swipes all count as manual navigation. */
  const navigateTo = useCallback(
    (index: number) => {
      setAutoAdvance(false);
      goTo(index);
    },
    [goTo]
  );

  const goNext = useCallback(
    () => navigateTo(current + 1),
    [current, navigateTo]
  );

  const goPrev = useCallback(
    () => navigateTo(current - 1),
    [current, navigateTo]
  );

  // Respect the OS "reduce motion" setting: no auto-advance, no countdown.
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  // Phones rotate slower than the desktop hero.
  useEffect(() => {
    const query = window.matchMedia("(max-width: 1023px)");
    const update = () => setIntervalMs(query.matches ? MOBILE_INTERVAL : DESKTOP_INTERVAL);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  // The countdown resets whenever the slide changes. Declared before the timer
  // effect so a fresh full interval is restored after each auto-advance.
  useEffect(() => {
    remaining.current = interval;
  }, [current, interval]);

  // Auto-advance. The timeout uses the remaining time, so resuming after a
  // hover/focus pause continues in step with the CSS progress animations,
  // which are paused in parallel via the `.paused` class.
  // `interval` is a dependency because the first render uses the desktop
  // value and switches to the phone value once the media query is known.
  useEffect(() => {
    if (!running) return;
    startedAt.current = Date.now();
    const timer = setTimeout(
      () => setCurrent((prev) => (prev + 1) % total),
      remaining.current
    );
    return () => {
      clearTimeout(timer);
      remaining.current = Math.max(
        0,
        remaining.current - (Date.now() - startedAt.current)
      );
    };
  }, [running, current, total, interval]);

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
    swipeStart.current = { x: event.clientX, y: event.clientY };
  };

  const handlePointerUp = (event: React.PointerEvent) => {
    const start = swipeStart.current;
    swipeStart.current = null;
    if (!start) return;
    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;
    // Only mostly-horizontal swipes past the threshold change the slide.
    if (
      Math.abs(deltaX) < SWIPE_THRESHOLD ||
      Math.abs(deltaX) <= Math.abs(deltaY)
    ) {
      return;
    }
    if (deltaX < 0) goNext();
    else goPrev();
  };

  return (
    <section
      className={`hero${running ? "" : " paused"}${autoPlay ? "" : " no-autoplay"}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setPaused(false);
        }
      }}
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => {
        swipeStart.current = null;
      }}
    >
      <div className="hero-slider" aria-live={running ? "off" : "polite"}>
        {heroSlides.map((slide, index) => {
          /* Phone artwork: portrait 427 x 534 shots served to the phone hero. */
          const { props: mobileProps } = getImageProps({
            alt: "",
            src: slide.mobileImage,
            width: 825,
            height: 1024,
            sizes: "(max-width: 427px) 100vw, 427px",
            quality: 75,
          });

          return (
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
                <picture className="hero-picture">
                  <source
                    media="(max-width: 1023px)"
                    srcSet={mobileProps.srcSet}
                    sizes="(max-width: 427px) 100vw, 427px"
                  />
                  <Image
                    src={slide.image}
                    alt=""
                    fill
                    loading={index === 0 ? "eager" : "lazy"}
                    fetchPriority={index === 0 ? "high" : "auto"}
                    sizes="100vw"
                    className="hero-slide-image"
                  />
                </picture>
                <span className="hero-sr-only">
                  {slide.title}. {slide.subtitle}. {slide.cta}.
                </span>
              </Link>
            </div>
          );
        })}
      </div>

      {/* Mobile-only copy panel */}
      <div className="hero-overlay" aria-hidden="true">
        {/* <p className="hero-overlay-title">Luxury Bridal Dresses</p> */}
        <p className="hero-overlay-plus" aria-hidden="true">
          +
        </p>
        {/* <p className="hero-overlay-off">FLAT 50% OFF</p> */}
        <Link href="/shop" className="hero-overlay-cta" aria-hidden="true" tabIndex={-1}>
          Shop Now
        </Link>
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

      <div className="hero-dots" role="group" aria-label="Choose slide">
        {heroSlides.map((slide, index) => (
          <button
            key={slide.title}
            type="button"
            className={`dot${index === current ? " active" : ""}`}
            aria-label={`Show slide ${index + 1}: ${slide.title}`}
            aria-current={index === current}
            onClick={() => navigateTo(index)}
          >
            <span aria-hidden="true">
              {index === current && autoPlay && (
                <span
                  key={current}
                  className="hero-dot-fill"
                  style={{ animationDuration: `${interval}ms` }}
                />
              )}
            </span>
          </button>
        ))}
      </div>

      {autoPlay && (
        <div className="hero-progress" aria-hidden="true">
          <div
            key={current}
            className="hero-progress-fill"
            style={{ animationDuration: `${interval}ms` }}
          />
        </div>
      )}
    </section>
  );
}
