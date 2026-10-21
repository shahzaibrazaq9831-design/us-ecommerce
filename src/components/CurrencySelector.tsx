"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Search, ChevronDown, Check } from "lucide-react";
import { countries, type Country } from "@/data/countries";
import { useCurrency } from "@/context/CurrencyContext";
import { useCart } from "@/context/CartContext";

export default function CurrencySelector() {
  const { country, setCountry } = useCurrency();
  const { showToast } = useCart();
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [showActive, setShowActive] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const filtered = countries.filter((c) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.currency.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q) ||
      (c.label || "").toLowerCase().includes(q)
    );
  });

  const resetList = useCallback(() => {
    setQuery("");
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
    setActiveIndex(Math.max(countries.findIndex((c) => c.code === country.code), 0));
    setShowActive(false);
    setOpen(true);
  }, [country.code]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        closePanel();
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closePanel();
      }
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [closePanel]);

  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => inputRef.current?.focus(), 40);
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
        selectCountry(filtered[activeIndex]);
      }
    }
  };

  const selectCountry = (c: Country) => {
    // Build the message from the country that was just picked (never from state,
    // which hasn't updated yet), so the toast always names the new country.
    const changed = c.code !== country.code;
    setCountry(c);
    if (changed) {
      showToast(`Country and currency changed to ${c.name} (${c.currency}).`);
    }
    closePanel();
  };

  return (
    <div ref={ref} className="currency-selector" onKeyDown={handleKeyDown}>
      <button
        type="button"
        onClick={toggleOpen}
        className="currency-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Change currency. Current: ${country.currency} (${country.name})`}
      >
        <img src={`https://flagcdn.com/w40/${country.iso2}.png`} alt="" aria-hidden="true" />
        <span className="currency-trigger-code">{country.currency}</span>
        <ChevronDown size={12} strokeWidth={2} aria-hidden="true" className={open ? "currency-chevron is-open" : "currency-chevron"} />
      </button>

      {open || closing ? (
        <div
          className={`currency-panel${closing ? " is-closing" : ""}`}
          role="dialog"
          aria-label="Choose a country and currency"
        >
          <div className="currency-search">
            <div className="currency-search-inner">
              <Search size={14} strokeWidth={2} aria-hidden="true" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActiveIndex(0);
                }}
                placeholder="Search countries"
                aria-label="Search countries"
                autoComplete="off"
                spellCheck={false}
              />
            </div>
          </div>

          <ul ref={listRef} className="currency-list" role="listbox" aria-label="Countries">
            {filtered.length === 0 ? (
              <li className="currency-empty">No countries found</li>
            ) : (
              filtered.map((c, idx) => {
                const isSelected = c.code === country.code;
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
                    onClick={() => selectCountry(c)}
                    className={`currency-option${isActive && showActive ? " is-active" : ""}`}
                    title={c.label || `${c.name} (${c.currency})`}
                  >
                    <img src={`https://flagcdn.com/w40/${c.iso2}.png`} alt="" aria-hidden="true" />
                    <span className="currency-option-label">
                      {c.name} ({c.currency})
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
