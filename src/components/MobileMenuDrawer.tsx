"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Heart, MessageCircle, Search, User, X } from "lucide-react";
import CurrencySelector from "./CurrencySelector";
import { navItems, siteConfig, type NavItem } from "@/data/site";

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function slugify(label: string) {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function DrawerAccordion({
  item,
  expanded,
  onToggle,
}: {
  item: NavItem;
  expanded: boolean;
  onToggle: () => void;
}) {
  const innerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  // Measure the panel so the height transition is exact (no max-height guesswork).
  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    setHeight(el.scrollHeight);
  }, [item.children]);

  const panelId = `m-drawer-panel-${slugify(item.label)}`;

  return (
    <li className="m-drawer-item">
      <div className="m-drawer-row">
        <Link href={item.href} className="m-drawer-link">
          {item.label}
        </Link>
        <button
          type="button"
          className="m-drawer-caret tap-target"
          aria-expanded={expanded}
          aria-controls={panelId}
          aria-label={`${item.label} menu`}
          onClick={onToggle}
        >
          <ChevronDown size={16} strokeWidth={1.5} aria-hidden="true" />
        </button>
      </div>
      <div
        id={panelId}
        className="m-drawer-panel"
        style={{ height: expanded ? height : 0 }}
        aria-hidden={!expanded}
        inert={!expanded}
      >
        <div ref={innerRef} className="m-drawer-panel-inner">
          {item.children?.map((child) => (
            <Link key={child.label} href={child.href} className="m-drawer-sublink">
              {child.label}
            </Link>
          ))}
        </div>
      </div>
    </li>
  );
}

export default function MobileMenuDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const drawerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  // Close the drawer whenever the route changes.
  useEffect(() => {
    if (open) onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Lock the page behind the drawer without losing the scroll position.
  useEffect(() => {
    if (!open) return;
    const { body } = document;
    const previousOverflow = body.style.overflow;
    const previousPaddingRight = body.style.paddingRight;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;

    body.style.overflow = "hidden";
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;

    return () => {
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPaddingRight;
    };
  }, [open]);

  // Move focus into the drawer, trap it, and close on Escape.
  useEffect(() => {
    if (!open) return;
    const node = drawerRef.current;
    if (!node) return;

    const focusable = () =>
      Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (el) => el.offsetWidth > 0 || el.offsetHeight > 0 || el === document.activeElement
      );

    const closeButton = node.querySelector<HTMLElement>(".m-drawer-close");
    closeButton?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      // A nested popup (country list) already handled Escape.
      if (event.defaultPrevented) return;

      if (event.key === "Escape") {
        // The country list is a panel on top of the drawer: the first Escape
        // closes the list, the next one closes the drawer.
        if (node.querySelector('.currency-panel[data-open="true"]')) return;
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      const items = focusable();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const term = query.trim();
    router.push(term ? `/shop?q=${encodeURIComponent(term)}` : "/shop");
    onClose();
  };

  return (
    <>
      <div
        className="m-drawer-overlay"
        data-open={open ? "true" : "false"}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        id="mobile-menu-drawer"
        ref={drawerRef}
        className="m-drawer"
        data-open={open ? "true" : "false"}
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
        aria-hidden={!open}
        inert={!open}
      >
        <div className="m-drawer-head">
          <Link
            href="/"
            className="m-drawer-logo"
            onClick={onClose}
            aria-label="Damsa Coture"
          >
            <Image
              src="/images/logo-damsa.webp"
              alt="Damsa Coture"
              width={889}
              height={220}
              className="m-drawer-logo-img"
            />
          </Link>
          <button
            type="button"
            className="m-drawer-close tap-target"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X size={16} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>

        <div className="m-drawer-body">
          <form className="m-drawer-search" role="search" onSubmit={handleSearch}>
            <Search size={16} strokeWidth={1.5} aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by dress, designer or colour"
              aria-label="Search by dress, designer or colour"
              autoComplete="off"
            />
          </form>

          <p className="m-drawer-eyebrow">Ship to</p>
          <CurrencySelector variant="drawer" />

          <nav className="m-drawer-nav" aria-label="Mobile">
            <ul>
              {navItems.map((item) =>
                item.children && item.children.length > 0 ? (
                  <DrawerAccordion
                    key={item.label}
                    item={item}
                    expanded={expanded === item.label}
                    onToggle={() =>
                      setExpanded((current) => (current === item.label ? null : item.label))
                    }
                  />
                ) : (
                  <li key={item.label} className="m-drawer-item">
                    <div className="m-drawer-row">
                      <Link href={item.href} className="m-drawer-link" onClick={onClose}>
                        {item.label}
                        {item.isNew ? <span className="m-drawer-badge">New</span> : null}
                      </Link>
                    </div>
                  </li>
                )
              )}
            </ul>
          </nav>

          <div className="m-drawer-foot">
            <Link href="/account" className="m-drawer-foot-link" onClick={onClose}>
              <User size={17} strokeWidth={1.4} aria-hidden="true" />
              Account
            </Link>
            <Link href="/wishlist" className="m-drawer-foot-link" onClick={onClose}>
              <Heart size={17} strokeWidth={1.4} aria-hidden="true" />
              Wishlist
            </Link>
            <a
              href={siteConfig.whatsapp}
              className="m-drawer-foot-link"
              target="_blank"
              rel="noopener noreferrer"
              onClick={onClose}
            >
              <MessageCircle size={17} strokeWidth={1.4} aria-hidden="true" />
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </aside>
    </>
  );
}
