"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { usePathname } from "next/navigation";
import { ChevronDown, Globe, X } from "lucide-react";
import { MARKETS } from "@/lib/markets";
import { useCurrency } from "@/context/CurrencyContext";
import { hasOpenModal } from "@/lib/overlay";

/** Wait this long after mount before the card may appear. */
const OPEN_DELAY = 1200;
/** Scrolling (incl. touch / two-finger scroll) must be idle for this long. */
const SCROLL_IDLE_MS = 900;

/**
 * "Confirm your price market" reminder — ported from the live site.
 *
 * First visit only: a small card pinned under the header on the right asks
 * the visitor to confirm the market their prices are shown for. It waits
 * until the visitor has scrolled down from the hero section and scrolling
 * has settled — retrying until that moment instead of giving up, so it
 * works on phones too. Dismissing it — X button, Escape, or tapping
 * outside on compact phones — collapses it into a "Prices: …" pill in the
 * same spot that reopens the card. It never appears again once the visitor
 * has deliberately picked a country or currency, and it stays off the
 * checkout page.
 */
export default function FirstVisitRegionDialog() {
  const pathname = usePathname();
  const { region, hasManualRegionPreference, isDetectingRegion, setRegionCode } = useCurrency();

  const [mounted, setMounted] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [showSelect, setShowSelect] = useState(false);
  const [isCompact, setIsCompact] = useState(false);
  const [minimized, setMinimized] = useState<boolean | null>(null);
  const [selectValue, setSelectValue] = useState("");
  /*
   * ?market=1 always shows the reminder, even when the visitor already
   * picked a market earlier — handy for checking the card on any device.
   */
  const [forceShow] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return new URLSearchParams(window.location.search).get("market") === "1";
    } catch {
      return false;
    }
  });

  const containerRef = useRef<HTMLElement | null>(null);
  const usedEscapeRef = useRef(false);

  /*
   * Pin the card just below the real sticky topbar.
   *
   * The header is not the same height on every screen (announcement bar,
   * offer strip, safe-area insets), so its height is measured instead of
   * guessed. That keeps the card under the header — never cut by it — on
   * phones, tablets and laptops alike.
   */
  const [topOffset, setTopOffset] = useState<number | null>(null);

  useEffect(() => {
    const measure = () => {
      const bar = document.querySelector<HTMLElement>(".site-topbar");
      if (!bar) return;
      const bottom = Math.round(bar.getBoundingClientRect().bottom);
      if (bottom <= 0) return;
      // The gap below the header is exactly the one the card had before it
      // started measuring the header, so the card sits in the same spot on
      // every screen — it just can never be cut by a taller header.
      const gap = window.matchMedia("(min-width: 1024px)").matches ? 32 : 21;
      setTopOffset(bottom + gap);
    };

    measure();
    const frame = window.requestAnimationFrame(measure);
    window.addEventListener("resize", measure);
    window.addEventListener("orientationchange", measure);

    const bar = document.querySelector<HTMLElement>(".site-topbar");
    let observer: ResizeObserver | null = null;
    if (bar && typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(measure);
      observer.observe(bar);
    }

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", measure);
      window.removeEventListener("orientationchange", measure);
      observer?.disconnect();
    };
  }, []);

  // The card is only minimized once the visitor asks for it — the scroll
  // trigger already keeps it out of the way while the page loads.
  const isMinimized = minimized ?? false;

  useEffect(() => {
    const query = window.matchMedia("(max-width: 639px) and (max-height: 700px)");
    const onChange = (event: MediaQueryListEvent) => setIsCompact(event.matches);
    query.addEventListener("change", onChange);
    let inner = 0;
    const outer = window.requestAnimationFrame(() => {
      inner = window.requestAnimationFrame(() => {
        setIsCompact(query.matches);
        setMounted(true);
      });
    });
    return () => {
      window.cancelAnimationFrame(outer);
      window.cancelAnimationFrame(inner);
      query.removeEventListener("change", onChange);
    };
  }, []);

  /*
   * Wait for the right moment to show the card: the visitor has scrolled
   * down from the hero section, scrolling (touch and wheel included) has
   * been idle for a moment, and no other popup owns the screen. Retries
   * indefinitely instead of giving up after a fixed number of attempts,
   * so the timing also works on phones.
   */
  useEffect(() => {
    if (revealed || (hasManualRegionPreference && !forceShow) || pathname?.startsWith("/checkout")) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let lastScrollAt = 0;

    const markScrolling = () => {
      lastScrollAt = Date.now();
    };

    // "Scrolled down from the hero" = the hero section's bottom edge has
    // passed most of the viewport. Pages without a hero use a small nudge.
    const requiredScrollY = () => {
      const hero = document.querySelector<HTMLElement>(".hero-slider");
      const heroBottom = hero
        ? hero.getBoundingClientRect().bottom + window.scrollY
        : 0;
      return Math.max(heroBottom ? heroBottom - window.innerHeight * 0.6 : 0, 120);
    };

    const tryReveal = () => {
      if (cancelled) return;

      // Retry while the tab is in the background.
      if (document.hidden) {
        timer = setTimeout(tryReveal, 1000);
        return;
      }

      // The visitor must scroll down from the hero section first.
      if (window.scrollY < requiredScrollY()) {
        timer = setTimeout(tryReveal, 800);
        return;
      }

      // Never pop up mid-scroll (touch and wheel included).
      if (Date.now() - lastScrollAt < SCROLL_IDLE_MS) {
        timer = setTimeout(tryReveal, 300);
        return;
      }

      // Let any open modal own the screen while it is open. The recent-review
      // card is not one of them: it sits in the opposite corner (bottom-left)
      // and never overlaps this card, so it must not hold the reminder back.
      if (hasOpenModal()) {
        timer = setTimeout(tryReveal, 1200);
        return;
      }

      setRevealed(true);
    };

    window.addEventListener("scroll", markScrolling, { passive: true });
    window.addEventListener("touchmove", markScrolling, { passive: true });
    window.addEventListener("wheel", markScrolling, { passive: true });
    timer = setTimeout(tryReveal, OPEN_DELAY);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      window.removeEventListener("scroll", markScrolling);
      window.removeEventListener("touchmove", markScrolling);
      window.removeEventListener("wheel", markScrolling);
    };
  }, [revealed, hasManualRegionPreference, forceShow, pathname]);

  // On compact screens, a tap outside or Escape collapses the card into the pill.
  useEffect(() => {
    if (
      !isCompact ||
      isMinimized ||
      (hasManualRegionPreference && !forceShow) ||
      pathname?.startsWith("/checkout")
    ) {
      return;
    }

    const onPointerDown = (event: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setMinimized(true);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        usedEscapeRef.current = true;
        setMinimized(true);
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isCompact, isMinimized, hasManualRegionPreference, forceShow, pathname]);

  // Return focus to the pill when Escape collapsed the card.
  useEffect(() => {
    if (!isMinimized || !usedEscapeRef.current) return;
    usedEscapeRef.current = false;
    containerRef.current?.querySelector("button")?.focus();
  }, [isMinimized]);

  // Only pre-select the detected market once detection has settled.
  const detectedCode =
    !isDetectingRegion && MARKETS.some((m) => m.code === region.code) ? region.code : "";
  const selectedCode = selectValue || detectedCode;
  const selected = useMemo(() => MARKETS.find((m) => m.code === selectedCode), [selectedCode]);

  /*
   * While the card is open the floating buttons (WhatsApp bubble, back to
   * top) step aside, so nothing can sit on top of the card's corner on a
   * short screen.
   */
  const cardIsOpen =
    mounted &&
    revealed &&
    !isMinimized &&
    (forceShow || !hasManualRegionPreference) &&
    !pathname?.startsWith("/checkout");

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("fvrd-open", cardIsOpen);
    return () => root.classList.remove("fvrd-open");
  }, [cardIsOpen]);

  if (
    !mounted ||
    !revealed ||
    (hasManualRegionPreference && !forceShow) ||
    pathname?.startsWith("/checkout")
  ) {
    return null;
  }

  return (
    <aside
      ref={containerRef}
      aria-label="Shipping country reminder"
      data-open={isMinimized ? "false" : "true"}
      className={`fvrd${isCompact && !isMinimized ? " fvrd--raised" : ""}`}
      style={
        topOffset ? ({ "--fvrd-top": `${topOffset}px` } as CSSProperties) : undefined
      }
    >
      {isMinimized ? (
        <button
          type="button"
          className="fvrd-pill"
          onClick={() => setMinimized(false)}
          aria-label={`Shipping country. Prices: ${region.name}. Review shipping country.`}
        >
          <Globe size={16} strokeWidth={2} aria-hidden="true" className="fvrd-pill-icon" />
          <span className="fvrd-pill-text">
            {isDetectingRegion ? "Choose shipping country" : `Prices: ${region.name}`}
          </span>
        </button>
      ) : (
        <section
          aria-labelledby="fvrd-title"
          className={`fvrd-card${isCompact ? " fvrd-card--compact" : ""}`}
        >
          <div className="fvrd-head">
            <div className="fvrd-head-text">
              <h2 id="fvrd-title" className="fvrd-title">
                Confirm your price market
              </h2>
              <p className="fvrd-desc">
                {isDetectingRegion
                  ? "Choose a price market. Other destinations use USD."
                  : `Prices are shown for ${region.name}. Choose your delivery country at checkout.`}
              </p>
            </div>
            <button
              type="button"
              className="fvrd-close"
              onClick={() => {
                usedEscapeRef.current = true;
                setMinimized(true);
              }}
              aria-label="Minimize shipping country reminder"
            >
              <X size={16} strokeWidth={2.2} aria-hidden="true" />
            </button>
          </div>

          <form
            className="fvrd-form"
            onSubmit={(event) => {
              event.preventDefault();
              if (selected) setRegionCode(selected.code);
            }}
          >
            {showSelect ? (
              <label className="fvrd-field" htmlFor="fvrd-select">
                Country/region
                <span className="fvrd-select-wrap">
                  <select
                    id="fvrd-select"
                    required
                    value={selectedCode}
                    onChange={(event) => setSelectValue(event.target.value)}
                    className="fvrd-select"
                  >
                    <option value="" disabled>
                      Select your price market
                    </option>
                    {MARKETS.map((market) => (
                      <option key={market.code} value={market.code}>
                        {market.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={16}
                    strokeWidth={2.2}
                    aria-hidden="true"
                    className="fvrd-select-chevron"
                  />
                </span>
              </label>
            ) : null}

            <div className="fvrd-actions">
              {selected || showSelect ? (
                <button
                  type="submit"
                  className="fvrd-btn fvrd-btn--primary"
                  disabled={!selected}
                  aria-label={selected ? `Confirm ${selected.name}` : "Confirm country"}
                >
                  Confirm
                </button>
              ) : null}
              {showSelect ? null : (
                <button
                  type="button"
                  className={`fvrd-btn fvrd-btn--outline${selected ? "" : " fvrd-btn--wide"}`}
                  onClick={() => setShowSelect(true)}
                >
                  {selected ? "Change" : "Choose country"}
                </button>
              )}
            </div>
          </form>
        </section>
      )}
    </aside>
  );
}
