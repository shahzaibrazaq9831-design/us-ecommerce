"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { MARKETS } from "@/lib/markets";
import { useCurrency } from "@/context/CurrencyContext";
import { useCart } from "@/context/CartContext";

type CurrencySelectorVariant = "header" | "drawer";

export default function CurrencySelector({ variant = "header" }: { variant?: CurrencySelectorVariant }) {
  const { region, setRegionCode } = useCurrency();
  const { showToast } = useCart();
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showActive, setShowActive] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* The header dropdown is a *market* picker — exactly like the premium site:
     the visitor picks the country they are billed in and the currency follows. */
  const activeMarket = region ?? MARKETS[0];
  const filtered = MARKETS;

  const resetList = useCallback(() => {
    setActiveIndex(0);
    setShowActive(false);
  }, []);

  const closePanel = useCallback(() => {
    if (!open) return;
    setOpen(false);
    setClosing(true);
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => {
      setClosing(false);
      resetList();
      closeTimer.current = null;
    }, 160);
  }, [open, resetList]);

  const openPanel = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    // Ensure no stale closing state leaves an empty/lingering panel behind.
    setClosing(false);
    resetList();
    setActiveIndex(Math.max(MARKETS.findIndex((m) => m.code === activeMarket.code), 0));
    setShowActive(false);
    setOpen(true);
  }, [activeMarket.code, resetList]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        closePanel();
      }
    };
    const onKey = (e: KeyboardEvent) => {
      // Only swallow Escape while the panel is actually open, so the mobile
      // drawer can still be dismissed with Escape when the panel is closed.
      if (e.key === "Escape" && open) {
        e.preventDefault();
        closePanel();
      }
    };
    document.addEventListener("mousedown", onClick);
    // Capture phase: the panel has to claim Escape before the mobile drawer
    // (which listens on the bubble phase) can close itself.
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [closePanel, open]);

  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  // Safety: never keep the panel in a "closing" (hidden-but-mounted) state once
  // it is no longer open. This prevents a stuck white popup on the right side.
  useEffect(() => {
    if (open || !closing) return;
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => {
      setClosing(false);
      resetList();
      closeTimer.current = null;
    }, 160);
  }, [open, closing, resetList]);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => listRef.current?.focus(), 40);
    // Keep the current selection visible without scrolling the page.
    const frame = requestAnimationFrame(() => {
      const list = listRef.current;
      const selected = list?.querySelector<HTMLElement>('[data-selected="true"]');
      if (!list || !selected) return;
      const top = selected.offsetTop;
      const bottom = top + selected.offsetHeight;
      if (top < list.scrollTop) {
        list.scrollTop = top;
      } else if (bottom > list.scrollTop + list.clientHeight) {
        list.scrollTop = bottom - list.clientHeight;
      }
    });
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(frame);
    };
  }, [open]);

  const toggleOpen = () => {
    if (open) {
      closePanel();
    } else {
      openPanel();
    }
  };

  const selectMarket = (code: string) => {
    const market = MARKETS.find((m) => m.code === code);
    if (!market) return;
    // Build the message from the market that was just picked (never from
    // state, which hasn't updated yet), so the toast always names it.
    const changed = market.code !== activeMarket.code;
    setRegionCode(market.code);
    if (changed) {
      showToast(`Country and currency changed to ${market.name}.`);
    }
    // A deliberate market choice is also a deliberate currency choice: the
    // first-visit region dialog never interrupts this visitor again.
    closePanel();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || filtered.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setShowActive(true);
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setShowActive(true);
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[activeIndex]) {
        selectMarket(filtered[activeIndex].code);
      }
    }
  };

  const isDrawer = variant === "drawer";

  return (
    <div
      ref={ref}
      className={`relative z-[1200] ${isDrawer ? "currency-selector--drawer" : ""}`}
      onKeyDown={handleKeyDown}
    >
      <button
        type="button"
        onClick={toggleOpen}
        className={`flex h-[35px] items-center gap-[6px] rounded-[8px] border-[1.5px] border-[#8B6B2E] bg-[#FBF7F1] px-[9px] text-[#1A1A1A] [transition:background-color_var(--transition-fast),box-shadow_var(--transition-fast)] hover:bg-[#F6F0E6] focus-visible:[outline:2px_solid_rgba(139,107,46,0.45)] focus-visible:outline-offset-2 ${
          isDrawer ? " currency-trigger--drawer" : ""
        }`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Country and currency: ${activeMarket.name}. Change`}
      >
        <img
          src={`/flags/${activeMarket.flag}.svg`}
          alt=""
          aria-hidden="true"
          width={20}
          height={14}
          decoding="async"
          className="h-[14px] w-[20px] flex-none rounded-[2px] object-cover shadow-[0_0_0_1px_rgba(0,0,0,0.07)]"
        />
        {isDrawer ? (
          <span className="currency-trigger-label">
            {activeMarket.name}
          </span>
        ) : (
          <span className="text-[11.5px] font-semibold uppercase leading-none tracking-[0.02em]">{activeMarket.currency}</span>
        )}
        <ChevronDown
          size={12}
          strokeWidth={2}
          aria-hidden="true"
          className={`text-[#6E5A2E] [transition:transform_0.2s_ease] ${
            open ? " [transform:rotate(180deg)]" : ""
          }`}
        />
      </button>

      {open || closing ? (
        <div
          className={`currency-panel absolute right-0 top-[calc(100%_+_7px)] z-[1200] w-[20rem] max-w-[calc(100vw_-_1.5rem)] origin-top-right overflow-hidden rounded-[12px] border border-[rgba(23,23,23,0.12)] bg-white shadow-[0_18px_44px_rgba(23,60,53,0.12)] [--currency-row-height:44px] ${
            closing
              ? "is-closing pointer-events-none animate-currency-panel-out"
              : "animate-currency-panel-in"
          }`}
          data-open={open ? "true" : "false"}
          role="dialog"
          aria-label="Choose a country and currency"
        >
          <ul
            ref={listRef}
            tabIndex={-1}
            className="currency-list relative max-h-[min(22rem,55dvh)] overflow-y-auto overscroll-contain py-[0.25rem] [scrollbar-color:#8f8f8f_transparent] [scrollbar-width:thin]"
            role="listbox"
            aria-label="Countries"
          >
            {filtered.length === 0 ? (
              <li className="p-[12px] text-[12.5px] text-[#767676]">No currencies found</li>
            ) : (
              filtered.map((m, idx) => {
                const isSelected = m.code === activeMarket.code;
                const isActive = idx === activeIndex;
                return (
                  <li
                    key={m.code}
                    role="option"
                    aria-selected={isSelected}
                    data-selected={isSelected || undefined}
                    onMouseEnter={() => {
                      setActiveIndex(idx);
                      setShowActive(false);
                    }}
                    onClick={() => selectMarket(m.code)}
                    className={`currency-option flex min-h-[var(--currency-row-height)] cursor-pointer items-center gap-[0.75rem] p-[0.75rem] text-[0.875rem] font-normal leading-[1.4286] text-[#171717] hover:bg-[rgba(23,23,23,0.05)] ${
                      isActive && showActive ? " is-active bg-[rgba(23,23,23,0.05)]" : ""
                    }`}
                    title={m.name}
                  >
                    <img
                      src={`/flags/${m.flag}.svg`}
                      alt=""
                      aria-hidden="true"
                      width={24}
                      height={16}
                      decoding="async"
                      className="h-[16px] w-[24px] flex-none rounded-[2px] object-cover shadow-[0_0_0_1px_rgba(0,0,0,0.05)]"
                    />
                    <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                      {m.name}
                    </span>
                    {isSelected ? (
                      <Check
                        size={14}
                        strokeWidth={2.5}
                        aria-hidden="true"
                        className="flex-none text-[#8a6a2f]"
                      />
                    ) : null}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
