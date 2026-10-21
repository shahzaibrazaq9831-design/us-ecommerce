"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { navItems } from "@/data/site";
import { useCart } from "@/context/CartContext";
import { useCurrency } from "@/context/CurrencyContext";
import SearchOverlay from "./SearchOverlay";
import { countries } from "@/data/countries";
import { Search, Check, ChevronDown } from "lucide-react";

export default function Header() {
  const pathname = usePathname();
  const { cartCount, wishlist } = useCart();
  const { country: selected, setCountry } = useCurrency();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [countryOpen, setCountryOpen] = useState(false);
  const [countryQuery, setCountryQuery] = useState("");
  const countryRef = useRef<HTMLDivElement>(null);
  const countryInputRef = useRef<HTMLInputElement>(null);

  const selectCountry = (c: (typeof countries)[number]) => {
    setCountry(c);
    setCountryOpen(false);
    setCountryQuery("");
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setSearchOpen(false);
    setCountryOpen(false);
    setCountryQuery("");
  }, [pathname]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (countryRef.current && !countryRef.current.contains(e.target as Node)) {
        setCountryOpen(false);
        setCountryQuery("");
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setCountryOpen(false);
        setCountryQuery("");
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
    if (countryOpen) {
      setTimeout(() => countryInputRef.current?.focus(), 30);
    } else {
      setCountryQuery("");
    }
  }, [countryOpen]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <>
      <header className={`header${scrolled ? " scrolled" : ""}`}>
        <div className="header-top">
          <div className="header-top-left">
            <button className="menu-toggle" onClick={() => setMobileOpen(true)} aria-label="Open menu">
              <i className="fas fa-bars" />
            </button>
            <button className="header-search-btn" onClick={() => setSearchOpen(true)} aria-label="Search">
              <i className="fas fa-search" />
            </button>
          </div>
          <Link href="/" className="logo">
            Premium Pakistani Dresses
          </Link>
          <div className="header-actions">
            <div ref={countryRef} className="relative z-[1200]">
              <button
                type="button"
                onClick={() => setCountryOpen((v) => !v)}
                className="flex items-center gap-2 h-[40px] px-[14px] rounded-[10px] border-2 border-[#8B6B2E] bg-[#FBF7F1] text-[#1A1A1A] text-[14px] font-medium"
                aria-haspopup="listbox"
                aria-expanded={countryOpen}
              >
                <img
                  src={`https://flagcdn.com/w40/${selected.iso2}.png`}
                  alt={selected.name}
                  className="w-[22px] h-[16px] rounded-[2px] object-cover"
                />
                <span className="uppercase">{selected.currency}</span>
                <ChevronDown size={12} className={`transition-transform ${countryOpen ? "rotate-180" : ""}`} />
              </button>

              {countryOpen && (
                <div className="absolute right-0 top-[calc(100%+8px)] w-[290px] max-[640px]:w-[min(92vw,320px)] bg-white border border-[#E5E0D8] rounded-[14px] shadow-[0_8px_30px_rgba(0,0,0,0.15)] overflow-hidden">
                  <div className="p-3 border-b border-[#EEE9E2] bg-white sticky top-0 z-10">
                    <div className="relative">
                      <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6B6B]" />
                      <input
                        ref={countryInputRef}
                        type="text"
                        value={countryQuery}
                        onChange={(e) => setCountryQuery(e.target.value)}
                        placeholder="Search countries"
                        className="w-full h-[40px] pl-9 pr-3 border border-[#D9D4CC] rounded-[12px] bg-[#FAF8F5] text-[14px] placeholder:text-[#6B6B6B] focus:outline-none"
                      />
                    </div>
                  </div>
                  <ul className="max-h-[340px] max-[640px]:max-h-[60vh] overflow-y-auto header-country-scroll">
                    {countries
                      .filter((c) => {
                        if (!countryQuery) return true;
                        const q = countryQuery.toLowerCase();
                        return (
                          c.name.toLowerCase().includes(q) ||
                          c.currency.toLowerCase().includes(q) ||
                          c.code.toLowerCase().includes(q) ||
                          (c.label || "").toLowerCase().includes(q)
                        );
                      })
                      .map((c) => {
                        const isSelected = c.code === selected.code;
                        return (
                          <li
                            key={c.code}
                            onClick={() => selectCountry(c)}
                            title={c.label || `${c.name} (${c.currency})`}
                            className={`h-[40px] px-4 flex items-center gap-[10px] cursor-pointer hover:bg-[#F1EEE9] ${isSelected ? "bg-[#F1EEE9]" : ""}`}
                          >
                            <img
                              src={`https://flagcdn.com/w40/${c.iso2}.png`}
                              alt={c.name}
                              className="w-[28px] h-[20px] rounded-[2px] object-cover shrink-0"
                            />
                            <span
                              className={`text-[15px] flex-1 min-w-0 truncate ${isSelected ? "text-[#1A1A1A] font-medium" : "text-[#333]"}`}
                            >
                              {c.name}
                            </span>
                            <span className="text-[12px] uppercase tracking-wide text-[#8A8175] shrink-0">
                              {c.currency}
                            </span>
                            {isSelected && <Check size={16} className="text-[#8B6B2E] shrink-0" />}
                          </li>
                        );
                      })}
                  </ul>
                </div>
              )}
              <style jsx global>{`
                .header-country-scroll::-webkit-scrollbar {
                  width: 6px;
                }
                .header-country-scroll::-webkit-scrollbar-track {
                  background: transparent;
                }
                .header-country-scroll::-webkit-scrollbar-thumb {
                  background: #9a9a9a;
                  border-radius: 9999px;
                }
                .header-country-scroll {
                  scrollbar-width: thin;
                  scrollbar-color: #9a9a9a transparent;
                }
              `}</style>
            </div>
            <Link href="/account" className="header-icon" aria-label="Account">
              <i className="far fa-user" />
            </Link>
            <Link href="/wishlist" className="header-icon" aria-label="Wishlist">
              <i className="far fa-heart" />
              {wishlist.length > 0 ? <span className="badge">{wishlist.length}</span> : null}
            </Link>
            <Link href="/cart" className="header-icon" aria-label="Cart">
              <i className="fas fa-shopping-bag" />
              {cartCount > 0 ? <span className="badge">{cartCount}</span> : null}
            </Link>
          </div>
        </div>
        <nav className="main-nav">
          <ul className="nav-list">
            {navItems.map((item) => (
              <li key={item.label} className={`${item.children ? "nav-dropdown" : ""}${isActive(item.href) ? " active" : ""}`}>
                <Link href={item.href}>
                  {item.label}
                  {item.children ? <i className="fas fa-chevron-down" style={{ fontSize: "0.7rem" }} /> : null}
                </Link>
                {item.children ? (
                  <ul className="dropdown">
                    {item.children.map((child) => (
                      <li key={child.label}>
                        <Link href={child.href}>{child.label}</Link>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <div className={`mobile-menu${mobileOpen ? " active" : ""}`}>
        <div className="mobile-menu-header">
          <Link href="/" className="logo">
            Premium Pakistani Dresses
          </Link>
          <button className="close-menu" onClick={() => setMobileOpen(false)} aria-label="Close menu">
            <i className="fas fa-times" />
          </button>
        </div>
        <ul className="mobile-nav-list">
          {navItems.map((item) => (
            <li key={item.label}>
              <Link href={item.href}>{item.label}</Link>
            </li>
          ))}
        </ul>
      </div>
      <div className={`overlay${mobileOpen ? " active" : ""}`} onClick={() => setMobileOpen(false)} />

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
