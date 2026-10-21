"use client";

import { useEffect, useRef, useState } from "react";
import { Search, ChevronDown, Check } from "lucide-react";
import { countries, type Country } from "@/data/countries";
import { useCurrency } from "@/context/CurrencyContext";

export default function CurrencySelector() {
  const { country, setCountry } = useCurrency();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const filtered = countries.filter((c) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.currency.toLowerCase().includes(q) || c.code.toLowerCase().includes(q);
  });

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
        setActiveIndex(0);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setQuery("");
        setActiveIndex(0);
      }
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setActiveIndex(0);
    } else {
      setQuery("");
    }
  }, [open]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[activeIndex]) {
        setCountry(filtered[activeIndex]);
        setOpen(false);
        setQuery("");
        setActiveIndex(0);
      }
    }
  };

  const selectCountry = (c: Country) => {
    setCountry(c);
    setOpen(false);
    setQuery("");
    setActiveIndex(0);
  };

  return (
    <div ref={ref} className="relative z-[1200]" onKeyDown={handleKeyDown}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 h-[40px] px-[14px] rounded-[10px] border-2 border-[#8B6B2E] bg-[#FBF7F1] text-[#1A1A1A] text-[14px] font-medium hover:bg-[#FBF7F1]"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <img
          src={`https://flagcdn.com/w40/${country.iso2}.png`}
          alt={country.name}
          className="w-[22px] h-[16px] rounded-[2px] object-cover"
        />
        <span className="uppercase">{country.currency}</span>
        <ChevronDown size={12} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-[calc(100%+8px)] w-[290px] max-[640px]:w-[min(92vw,320px)] bg-white border border-[#E5E0D8] rounded-[14px] shadow-[0_8px_30px_rgba(0,0,0,0.15)] overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150"
          role="combobox"
          aria-expanded={open}
        >
          <div className="p-3 border-b border-[#EEE9E2] bg-white sticky top-0 z-10">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6B6B]" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActiveIndex(0);
                }}
                placeholder="Search countries"
                className="w-full h-[40px] pl-9 pr-3 border border-[#D9D4CC] rounded-[12px] bg-[#FAF8F5] text-[14px] placeholder:text-[#6B6B6B] focus:outline-none focus:ring-1 focus:ring-[#8B6B2E]/40"
              />
            </div>
          </div>

          <ul
            ref={listRef}
            role="listbox"
            className="max-h-[340px] max-[640px]:max-h-[60vh] overflow-y-auto currency-selector-scroll"
          >
            {filtered.length === 0 ? (
              <li className="h-[40px] flex items-center justify-center text-[14px] text-[#6B6B6B]">No countries found</li>
            ) : (
              filtered.map((c, idx) => {
                const isSelected = c.code === country.code;
                const isActive = idx === activeIndex;
                return (
                  <li
                    key={c.code}
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => selectCountry(c)}
                    className={`h-[40px] px-4 flex items-center gap-[14px] cursor-pointer ${
                      isActive || isSelected ? "bg-[#F1EEE9]" : ""
                    } hover:bg-[#F1EEE9]`}
                  >
                    <img
                      src={`https://flagcdn.com/w40/${c.iso2}.png`}
                      alt={c.name}
                      className="w-[28px] h-[20px] rounded-[2px] object-cover"
                    />
                    <span className={`text-[15px] flex-1 ${isSelected ? "text-[#1A1A1A] font-medium" : "text-[#333]"}`}>
                      {c.name} ({c.currency})
                    </span>
                    {isSelected && <Check size={16} className="text-[#8B6B2E]" />}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
      <style jsx global>{`
        .currency-selector-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .currency-selector-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .currency-selector-scroll::-webkit-scrollbar-thumb {
          background: #9a9a9a;
          border-radius: 9999px;
        }
        .currency-selector-scroll {
          scrollbar-width: thin;
          scrollbar-color: #9a9a9a transparent;
        }
      `}</style>
    </div>
  );
}
