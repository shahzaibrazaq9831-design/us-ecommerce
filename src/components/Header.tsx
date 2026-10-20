"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { navItems } from "@/data/site";
import { useCart } from "@/context/CartContext";
import SearchOverlay from "./SearchOverlay";

const countries = [
  { code: "US", name: "United States", flag: "🇺🇸" },
  { code: "PK", name: "Pakistan", flag: "🇵🇰" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
  { code: "CA", name: "Canada", flag: "🇨🇦" },
  { code: "AU", name: "Australia", flag: "🇦🇺" },
  { code: "AE", name: "United Arab Emirates", flag: "🇦🇪" },
  { code: "SA", name: "Saudi Arabia", flag: "🇸🇦" },
  { code: "FR", name: "France", flag: "🇫🇷" },
  { code: "DE", name: "Germany", flag: "🇩🇪" },
];

export default function Header() {
  const pathname = usePathname();
  const { cartCount, wishlist } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState("US");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setSearchOpen(false);
  }, [pathname]);

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
            <div className="country-selector">
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                aria-label="Select country"
              >
                {countries.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.code}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <Link href="/" className="logo">
            Premium Pakistani Dresses
          </Link>
          <div className="header-actions">
            <button className="header-icon" onClick={() => setSearchOpen(true)} aria-label="Search">
              <i className="fas fa-search" />
            </button>
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
