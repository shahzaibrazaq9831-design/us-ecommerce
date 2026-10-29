"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { CURRENCIES, getCurrencyByCode } from "@/lib/currency";
import { useCurrency } from "@/context/CurrencyContext";
import { useCart } from "@/context/CartContext";

type CurrencySelectorVariant = "header" | "drawer";

export default function CurrencySelector({ variant = "header" }: { variant?: CurrencySelectorVariant }) {
  const { currency, setCurrency } = useCurrency();
  const { showToast } = useCart();
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showActive, setShowActive] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeCurrency = getCurrencyByCode(currency) ?? CURRENCIES[0];
  const filtered = CURRENCIES;

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
    }, 160);
  }, [open, resetList]);

  const openPanel = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setClosing(false);
    setActiveIndex(Math.max(CURRENCIES.findIndex((c) => c.code === currency), 0));
    setShowActive(false);
    setOpen(true);
  }, [currency]);

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

  const selectCurrency = (code: string) => {
    const c = getCurrencyByCode(code);
    if (!c) return;
    // Build the message from the currency that was just picked (never from state,
    // which hasn't updated yet), so the toast always names the new currency.
    const changed = c.code !== currency;
    setCurrency(c.code);
    if (changed) {
      showToast(`Currency changed to ${c.name} (${c.code}).`);
    }
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
        selectCurrency(filtered[activeIndex].code);
      }
    }
  };

  const isDrawer = variant === "drawer";

  return (
    <div
      ref={ref}
      className={`currency-selector${isDrawer ? " currency-selector--drawer" : ""}`}
      onKeyDown={handleKeyDown}
    >
      <button
        type="button"
        onClick={toggleOpen}
        className={`currency-trigger${isDrawer ? " currency-trigger--drawer" : ""}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Change currency. Current: ${activeCurrency.code} (${activeCurrency.name})`}
      >
        <img src={`https://flagcdn.com/w40/${activeCurrency.flag}.png`} alt="" aria-hidden="true" />
        {isDrawer ? (
          <span className="currency-trigger-label">
            {activeCurrency.name} ({activeCurrency.code})
          </span>
        ) : (
          <span className="currency-trigger-code">{activeCurrency.code}</span>
        )}
        <ChevronDown size={12} strokeWidth={2} aria-hidden="true" className={open ? "currency-chevron is-open" : "currency-chevron"} />
      </button>

      {open || closing ? (
        <div
          className={`currency-panel${closing ? " is-closing" : ""}`}
          data-open={open ? "true" : "false"}
          role="dialog"
          aria-label="Choose a country and currency"
        >
          <ul ref={listRef} tabIndex={-1} className="currency-list" role="listbox" aria-label="Countries">
            {filtered.length === 0 ? (
              <li className="currency-empty">No currencies found</li>
            ) : (
              filtered.map((c, idx) => {
                const isSelected = c.code === currency;
                const isActive = idx === activeIndex;
                return (
                  <li
                    key={c.code}
                    role="option"
                    aria-selected={isSelected}
                    data-selected={isSelected || undefined}
                    onMouseEnter={() => {
                      setActiveIndex(idx);
                      setShowActive(false);
                    }}
                    onClick={() => selectCurrency(c.code)}
                    className={`currency-option${isActive && showActive ? " is-active" : ""}`}
                    title={`${c.name} (${c.code})`}
                  >
                    <img src={`https://flagcdn.com/w40/${c.flag}.png`} alt="" aria-hidden="true" />
                    <span className="currency-option-label">
                      {c.name} ({c.code})
                    </span>
                    {isSelected ? <Check size={12} strokeWidth={2.5} aria-hidden="true" /> : null}
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
