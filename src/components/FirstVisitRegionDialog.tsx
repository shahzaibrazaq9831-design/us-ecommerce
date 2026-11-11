"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronDown, Globe, X } from "lucide-react";
import { MARKETS } from "@/lib/markets";
import { useCurrency } from "@/context/CurrencyContext";

/**
 * "Confirm your price market" reminder — ported from the live site.
 *
 * First visit only: a small card pinned under the header on the right asks
 * the visitor to confirm the market their prices are shown for. Dismissing
 * it — X button, Escape, or tapping outside on compact phones — collapses
 * it into a "Prices: …" pill in the same spot that reopens the card. It
 * never appears again once the visitor has deliberately picked a country
 * or currency, and it stays off the checkout page.
 */
export default function FirstVisitRegionDialog() {
  const pathname = usePathname();
  const { region, hasManualRegionPreference, isDetectingRegion, setRegionCode } = useCurrency();

  const [mounted, setMounted] = useState(false);
  const [showSelect, setShowSelect] = useState(false);
  const [isCompact, setIsCompact] = useState(false);
  const [minimized, setMinimized] = useState<boolean | null>(null);
  const [selectValue, setSelectValue] = useState("");

  const containerRef = useRef<HTMLElement | null>(null);
  const usedEscapeRef = useRef(false);

  // Compact phones (small screen AND short viewport) start minimized as a pill.
  const isMinimized = minimized ?? isCompact;

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

  // On compact screens, a tap outside or Escape collapses the card into the pill.
  useEffect(() => {
    if (!isCompact || isMinimized || hasManualRegionPreference || pathname?.startsWith("/checkout")) return;

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
  }, [isCompact, isMinimized, hasManualRegionPreference, pathname]);

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

  if (!mounted || hasManualRegionPreference || pathname?.startsWith("/checkout")) return null;

  return (
    <aside
      ref={containerRef}
      aria-label="Shipping country reminder"
      data-open={isMinimized ? "false" : "true"}
      className={`fvrd${isCompact && !isMinimized ? " fvrd--raised" : ""}`}
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
