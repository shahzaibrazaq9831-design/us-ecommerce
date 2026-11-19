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

/**
 * How far the page must be scrolled before the header switches to its
 * compact look. The reference store reacts after a few pixels of scrolling.
 */
const SCROLL_THRESHOLD = 10;

export default function Header() {
  const pathname = usePathname();
  const { cartCount, wishlist, openCart } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [lastPathname, setLastPathname] = useState(pathname);
  const [collectionsOpen, setCollectionsOpen] = useState(false);
  const [collectionsClosing, setCollectionsClosing] = useState(false);
  const collectionsCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const collectionsPanelRef = useRef<HTMLUListElement>(null);
  const headerRef = useRef<HTMLElement>(null);

  // Close any open menus when navigating (adjusted during render, not in an effect).
  if (lastPathname !== pathname) {
    setLastPathname(pathname);
    setMobileOpen(false);
    setSearchOpen(false);
    setCollectionsOpen(false);
    setCollectionsClosing(false);
  }

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

  /**
   * Compact header while the page is scrolled.
   *
   * The state is written straight to the DOM through `data-scrolled` instead
   * of React state, so scrolling never re-renders the header (and its
   * currency selector, cart badge and dropdowns). The listener is passive and
   * coalesced into one animation frame, which keeps the scroll smooth.
   */
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;

    let frame = 0;
    const apply = () => {
      frame = 0;
      el.dataset.scrolled = window.scrollY > SCROLL_THRESHOLD ? "true" : "false";
    };
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(apply);
    };

    // Handles the browser restoring a scroll position on back/forward.
    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

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
      <header
        className="header group relative z-[1] border-b border-[rgba(23,23,23,0.12)] bg-white shadow-[var(--shadow-sm)] [transition:box-shadow_var(--duration-base)_var(--ease-luxe)] data-[scrolled=true]:shadow-[0_10px_30px_rgba(23,60,53,0.12)]"
        data-scrolled="false"
        ref={headerRef}
      >
        {/* Desktop bar */}
        <div className="header-top mx-auto grid h-[var(--header-height)] max-w-[var(--container-max)] grid-cols-[1fr_auto_1fr] items-center gap-[var(--spacing-md)] px-[var(--container-padding)]">
          <div className="header-top-left flex flex-none items-center justify-self-start gap-[var(--spacing-sm)]">
            <button
              className="header-search-btn relative flex h-[44px] w-[44px] items-center justify-center rounded-[var(--radius-sm)] bg-transparent p-[var(--spacing-sm)] text-[1.1rem] text-secondary [transition:color_var(--transition-fast)] hover:bg-[rgba(0,0,0,0.04)] hover:text-primary"
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
            >
              <i className="fas fa-search" />
            </button>
          </div>
          <Link
            href="/#hero"
            className="logo header-logo flex items-center justify-center leading-[0]"
            aria-label="Damsa Coture"
          >
            <Image
              src="/images/logo-damsa.webp"
              alt="Damsa Coture"
              width={889}
              height={220}
              priority
              className="header-logo-img block h-[50px] w-auto [transition:height_var(--duration-base)_var(--ease-luxe)] group-data-[scrolled=true]:h-[38px]"
            />
          </Link>
          <div className="header-actions flex items-center justify-self-end gap-[var(--spacing-md)]">
            <CurrencySelector />
            <Link
              href="/account"
              className="header-icon relative flex items-center justify-center p-[var(--spacing-sm)] text-[1.2rem] text-secondary [transition:color_var(--transition-fast)] hover:text-primary"
              aria-label="Account"
            >
              <i className="far fa-user" />
            </Link>
            <Link
              href="/wishlist"
              className="header-icon relative flex items-center justify-center p-[var(--spacing-sm)] text-[1.2rem] text-secondary [transition:color_var(--transition-fast)] hover:text-primary"
              aria-label="Wishlist"
            >
              <i className="far fa-heart" />
              {wishlist.length > 0 ? (
                <span className="absolute -right-[4px] -top-[2px] flex h-[18px] min-w-[18px] animate-badge-pop items-center justify-center rounded-[var(--radius-full)] bg-primary px-[4px] text-[0.65rem] font-semibold text-white">
                  {wishlist.length}
                </span>
              ) : null}
            </Link>
            <button
              type="button"
              className="header-icon relative flex items-center justify-center p-[var(--spacing-sm)] text-[1.2rem] text-secondary [transition:color_var(--transition-fast)] hover:text-primary"
              onClick={openCart}
              aria-label="Cart"
            >
              <i className="fas fa-shopping-bag" />
              {cartCount > 0 ? (
                <span className="absolute -right-[4px] -top-[2px] flex h-[18px] min-w-[18px] animate-badge-pop items-center justify-center rounded-[var(--radius-full)] bg-primary px-[4px] text-[0.65rem] font-semibold text-white">
                  {cartCount}
                </span>
              ) : null}
            </button>
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
            <button
              type="button"
              className="m-header-btn tap-target"
              onClick={openCart}
              aria-label="Cart"
            >
              <ShoppingBag size={22} strokeWidth={1.5} aria-hidden="true" />
              {cartCount > 0 ? (
                <span className="m-header-badge absolute -right-[4px] -top-[2px] flex h-[18px] min-w-[18px] animate-badge-pop items-center justify-center rounded-[var(--radius-full)] bg-primary px-[4px] text-[0.65rem] font-semibold text-white">
                  {cartCount}
                </span>
              ) : null}
            </button>
          </div>
        </div>

        <nav className="main-nav h-[var(--nav-height)] border-t border-t-[rgba(23,23,23,0.12)]">
          <ul className="nav-list mx-auto flex h-full max-w-[var(--container-max)] items-center justify-center gap-[var(--spacing-xs)] px-[var(--container-padding)]">
            {navItems.map((item) => {
              const isCollections = Boolean(item.children && item.children.length > 0);
              const isItemActive = isActive(item.href);

              return (
                <li
                  key={item.label}
                  className={`group relative ${isCollections ? "nav-dropdown" : ""}${
                    isItemActive ? " active" : ""
                  }${isCollections && collectionsOpen ? " open" : ""}${
                    isCollections && collectionsClosing ? " closing" : ""
                  }`}
                  onMouseEnter={isCollections ? openCollections : undefined}
                  onMouseLeave={isCollections ? closeCollections : undefined}
                  onFocus={isCollections ? openCollections : undefined}
                  onBlur={isCollections ? handleCollectionsBlur : undefined}
                >
                  <Link
                    href={item.href}
                    aria-haspopup={isCollections ? "true" : undefined}
                    aria-expanded={isCollections ? collectionsOpen : undefined}
                    className="relative flex items-center gap-[4px] px-[var(--spacing-lg)] py-[var(--spacing-md)] text-[0.9rem] font-medium text-secondary [transition:color_var(--duration-fast)_var(--ease-luxe)] after:absolute after:bottom-0 after:left-1/2 after:h-[2px] after:w-0 after:bg-primary after:content-[''] after:[transform:translateX(-50%)] after:[transition:width_var(--duration-base)_var(--ease-luxe),transform_var(--duration-base)_var(--ease-luxe)] hover:text-primary hover:after:w-[60%] group-[.active]:text-primary group-[.active]:after:w-[60%]"
                  >
                    {item.label}
                    {isCollections ? (
                      <i
                        className="fas fa-chevron-down [transition:transform_var(--duration-fast)_var(--ease-luxe)] group-[.open]:[transform:rotate(180deg)]"
                        style={{ fontSize: "0.7rem" }}
                      />
                    ) : null}
                  </Link>
                  {isCollections && item.children ? (
                    <ul
                      className="dropdown invisible absolute left-0 top-full min-w-[200px] origin-top rounded-b-[var(--radius-md)] bg-white py-[var(--spacing-sm)] opacity-0 shadow-[var(--shadow-lg)] pointer-events-none [transform:translateY(10px)_scale(0.98)] [transition:opacity_var(--duration-base)_var(--ease-luxe),transform_var(--duration-base)_var(--ease-luxe),visibility_0s_linear_var(--duration-base)] group-[.closing]:animate-currency-panel-out group-[.open]:visible group-[.open]:animate-currency-panel-in group-[.open]:opacity-100 group-[.open]:pointer-events-auto group-[.open]:[transform:translateY(0)_scale(1)] group-[.open]:[transition-delay:0s]"
                      ref={collectionsPanelRef}
                    >
                      {item.children.map((child) => (
                        <li key={child.label}>
                          <Link
                            href={child.href}
                            className="block px-[var(--spacing-lg)] py-[var(--spacing-sm)] text-[0.85rem] text-gray-700 [transition:all_var(--transition-fast)] hover:bg-cream hover:pl-[calc(var(--spacing-lg)_+_4px)] hover:text-primary"
                          >
                            {child.label}
                          </Link>
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
