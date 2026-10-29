"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { Menu, Search, ShoppingBag } from "lucide-react";
import { navItems } from "@/lib/nav";
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
  const [collectionsOpen, setCollectionsOpen] = useState(false);
  const [collectionsClosing, setCollectionsClosing] = useState(false);
  const collectionsCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const collectionsPanelRef = useRef<HTMLUListElement>(null);

  // Close any open menus when navigating (adjusted during render, not in an effect).
  if (lastPathname !== pathname) {
    setLastPathname(pathname);
    setMobileOpen(false);
    setSearchOpen(false);
    setCollectionsOpen(false);
    setCollectionsClosing(false);
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const clearCollectionsCloseTimer = () => {
    if (collectionsCloseTimer.current) {
      clearTimeout(collectionsCloseTimer.current);
      collectionsCloseTimer.current = null;
    }
  };

  const openCollections = () => {
    clearCollectionsCloseTimer();
    setCollectionsClosing(false);
    setCollectionsOpen(true);
  };

  const closeCollections = () => {
    if (!collectionsOpen) return;
    setCollectionsClosing(true);
    clearCollectionsCloseTimer();
    // Small delay so the panel does not flicker when the pointer moves
    // between the trigger and the panel.
    collectionsCloseTimer.current = setTimeout(() => {
      setCollectionsClosing(false);
      setCollectionsOpen(false);
    }, 120);
  };

  useEffect(
    () => () => {
      if (collectionsCloseTimer.current) clearTimeout(collectionsCloseTimer.current);
    },
    []
  );

  useEffect(() => {
    if (!collectionsOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeCollections();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [collectionsOpen, closeCollections]);

  const handleCollectionsBlur = (event: React.FocusEvent<HTMLLIElement>) => {
    const nextTarget = event.relatedTarget as Node | null;
    const panel = collectionsPanelRef.current;
    // Focus moving into the panel itself should not close it.
    if (nextTarget && panel?.contains(nextTarget)) return;
    closeCollections();
  };

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
            <button
              className="header-search-btn"
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
            >
              <i className="fas fa-search" />
            </button>
          </div>
          <Link href="/#hero" className="logo header-logo" aria-label="Damsa Coture">
            <Image
              src="/images/logo-damsa.webp"
              alt="Damsa Coture"
              width={889}
              height={220}
              priority
              className="header-logo-img"
            />
          </Link>
          <div className="header-actions">
            <CurrencySelector />
            <Link href="/account" className="header-icon" aria-label="Account">
              <i className="far fa-user" />
            </Link>
            <Link
              href="/wishlist"
              className="header-icon"
              aria-label="Wishlist"
            >
              <i className="far fa-heart" />
              {wishlist.length > 0 ? (
                <span className="badge">{wishlist.length}</span>
              ) : null}
            </Link>
            <Link href="/cart" className="header-icon" aria-label="Cart">
              <i className="fas fa-shopping-bag" />
              {cartCount > 0 ? (
                <span className="badge">{cartCount}</span>
              ) : null}
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

          <Link href="/#hero" className="m-header-logo" aria-label="Damsa Coture">
            <Image
              src="/images/logo-damsa.webp"
              alt="Damsa Coture"
              width={889}
              height={220}
              className="m-header-logo-img"
            />
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
            <Link
              href="/cart"
              className="m-header-btn tap-target"
              aria-label="Cart"
            >
              <ShoppingBag size={22} strokeWidth={1.5} aria-hidden="true" />
              {cartCount > 0 ? (
                <span className="badge m-header-badge">{cartCount}</span>
              ) : null}
            </Link>
          </div>
        </div>

        <nav className="main-nav">
          <ul className="nav-list">
            {navItems.map((item) => {
              const isCollections = Boolean(item.children && item.children.length > 0);
              const isItemActive = isActive(item.href);

              return (
                <li
                  key={item.label}
                  className={`${isCollections ? "nav-dropdown" : ""}${isItemActive ? " active" : ""}${
                    isCollections && collectionsOpen ? " open" : ""
                  }${isCollections && collectionsClosing ? " closing" : ""}`}
                  onMouseEnter={isCollections ? openCollections : undefined}
                  onMouseLeave={isCollections ? closeCollections : undefined}
                  onFocus={isCollections ? openCollections : undefined}
                  onBlur={isCollections ? handleCollectionsBlur : undefined}
                >
                  <Link
                    href={item.href}
                    aria-haspopup={isCollections ? "true" : undefined}
                    aria-expanded={isCollections ? collectionsOpen : undefined}
                  >
                    {item.label}
                    {isCollections ? (
                      <i
                        className="fas fa-chevron-down"
                        style={{ fontSize: "0.7rem" }}
                      />
                    ) : null}
                  </Link>
                  {isCollections && item.children ? (
                    <ul className="dropdown" ref={collectionsPanelRef}>
                      {item.children.map((child) => (
                        <li key={child.label}>
                          <Link href={child.href}>{child.label}</Link>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </nav>
      </header>

      <MobileMenuDrawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
