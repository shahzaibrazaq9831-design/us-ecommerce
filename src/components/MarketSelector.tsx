"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { usePathname } from "next/navigation";
import { Check, ChevronDown } from "lucide-react";
import { MARKETS, Market } from "@/lib/markets";
import { useCurrency } from "@/context/CurrencyContext";
import { useCart } from "@/context/CartContext";

/**
 * Floating market selector — ported from the live site.
 *
 * A small pill with the current market's flag and currency pinned to the
 * bottom-left on desktop screens. It opens a keyboard-navigable list of
 * markets and confirms the change with a toast. Hidden while the region is
 * still being detected, on the checkout page, and on phones (the first
 * visit dialog and the header selector cover those).
 */
export default function MarketSelector() {
  const pathname = usePathname() ?? "";
  const { region, isDetectingRegion, setRegionCode } = useCurrency();
  const { showToast } = useCart();

  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);
  const listboxId = useId();

  const visible = !(pathname.startsWith("/checkout") || isDetectingRegion);

  /* While the pill is on screen, the recent-review card lifts above it
   * (see .msel-on in globals.css) so the two never overlap. */
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("msel-on", visible);
    return () => root.classList.remove("msel-on");
  }, [visible]);

  /** Focus the option at `index` (wrapping), keeping it in view. */
  const focusOption = (index: number) => {
    const options = listRef.current?.querySelectorAll<HTMLElement>('[role="option"]');
    const option = options?.[(index + MARKETS.length) % MARKETS.length];
    option?.focus({ preventScroll: true });
    option?.scrollIntoView?.({ block: "nearest" });
  };

  const close = () => {
    setOpen(false);
    triggerRef.current?.focus({ preventScroll: true });
  };

  // Close on outside pointer or focus while the list is open.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false);
    };
    const onFocusIn = (event: FocusEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("focusin", onFocusIn);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("focusin", onFocusIn);
    };
  }, [open]);

  const choose = (market: Market) => {
    const changed = market.code !== region.code;
    setRegionCode(market.code);
    close();
    if (changed) {
      showToast(`Country and currency changed to ${market.name}.`);
    }
  };

  const onKeyDown = (event: ReactKeyboardEvent) => {
    if (event.key === "Escape" && open) {
      event.preventDefault();
      event.stopPropagation();
      close();
      return;
    }
    if (event.key === "Tab") {
      setOpen(false);
      return;
    }
    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    if (!open) {
      setOpen(true);
      requestAnimationFrame(() =>
        focusOption(event.key === "ArrowUp" || event.key === "End" ? MARKETS.length - 1 : 0)
      );
      return;
    }
    const options = [...(listRef.current?.querySelectorAll<HTMLElement>('[role="option"]') ?? [])];
    const current = options.indexOf(document.activeElement as HTMLElement);
    if (current < 0 && ["ArrowDown", "ArrowUp"].includes(event.key)) {
      focusOption(event.key === "ArrowUp" ? MARKETS.length - 1 : 0);
    } else {
      focusOption(
        event.key === "Home"
          ? 0
          : event.key === "End"
            ? MARKETS.length - 1
            : current + (event.key === "ArrowUp" ? -1 : 1)
      );
    }
  };

  if (!visible) return null;

  return (
    <div ref={containerRef} data-country-selector="" onKeyDown={onKeyDown} className="msel">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-label={`Country and currency: ${region.name}. Change`}
        className="msel-trigger"
      >
        <img src={`https://flagcdn.com/w40/${region.flag}.png`} alt="" aria-hidden="true" />
        <span className="msel-trigger-code">{region.currency}</span>
        <ChevronDown
          size={16}
          strokeWidth={2.2}
          aria-hidden="true"
          className={open ? "msel-chevron is-open" : "msel-chevron"}
        />
      </button>

      {open ? (
        <ul ref={listRef} id={listboxId} role="listbox" aria-label="Choose a country" className="msel-list">
          {MARKETS.map((market) => {
            const isSelected = market.code === region.code;
            return (
              <li key={market.code} role="none">
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  tabIndex={-1}
                  onClick={() => choose(market)}
                  className="msel-option"
                >
                  <img src={`https://flagcdn.com/w40/${market.flag}.png`} alt="" aria-hidden="true" />
                  <span className="msel-option-label">{market.name}</span>
                  {isSelected ? <Check size={16} strokeWidth={2.4} aria-hidden="true" /> : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
