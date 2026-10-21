"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, Search, ShoppingBag } from "lucide-react";
import { navItems } from "@/data/site";
import { useCart } from "@/context/CartContext";
import SearchOverlay from "./SearchOverlay";
import CurrencySelector from "./CurrencySelector";
import MobileMenuDrawer from "./MobileMenuDrawer";

export default function Header() {
  const pathname = usePathname();
  const { cartCount, wishlist } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [lastPathname, setLastPathname] = useState(pathname);

  // Close any open menus when navigating (adjusted during render, not in an effect).
  if (lastPathname !== pathname) {
    setLastPathname(pathname);
    setMobileOpen(false);
    setSearchOpen(false);
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <>
      <header className={`header${scrolled ? " scrolled" : ""}`}>
        {/* Desktop bar */}
        <div className="header-top">
          <div className="header-top-left">
            <button className="header-search-btn" onClick={() => setSearchOpen(true)} aria-label="Search">
              <i className="fas fa-search" />
            </button>
          </div>
          <Link href="/" className="logo">
            Premium Pakistani Dresses
          </Link>
          <div className="header-actions">
            <CurrencySelector />
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

        {/* Mobile bar */}
        <div className="m-header">
          <button
            type="button"
            className="m-header-btn m-header-menu tap-target"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            aria-haspopup="dialog"
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu-drawer"
          >
            <Menu size={22} strokeWidth={1.5} aria-hidden="true" />
          </button>

          <Link href="/" className="m-header-logo" aria-label="Premium Pakistani Dresses">
            Premium Pakistani Dresses
          </Link>

          <div className="m-header-actions">
            <button
              type="button"
              className="m-header-btn tap-target"
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
            >
              <Search size={22} strokeWidth={1.5} aria-hidden="true" />
            </button>
            <Link href="/cart" className="m-header-btn tap-target" aria-label="Cart">
              <ShoppingBag size={22} strokeWidth={1.5} aria-hidden="true" />
              {cartCount > 0 ? <span className="badge m-header-badge">{cartCount}</span> : null}
            </Link>
          </div>
        </div>

        <nav className="main-nav">
          <ul className="nav-list">
            {navItems
              .filter((item) => !item.desktopHidden)
              .map((item) => (
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

      <MobileMenuDrawer open={mobileOpen} onClose={() => setMobileOpen(false)} />

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
