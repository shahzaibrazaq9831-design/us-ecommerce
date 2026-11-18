"use client";

import { useEffect } from "react";

/**
 * Smooth scrolling for same-page links only.
 *
 * Keeping `scroll-behavior: smooth` on <html> would also make every route
 * transition and every programmatic `scrollTo({ behavior: "auto" })` animate.
 * Next 16 can opt back into its old per-navigation override with
 * `data-scroll-behavior="smooth"`, but that override is deliberately expensive.
 * Opting in per link keeps navigation instant and leaves one small, explicit
 * path for the smooth behaviour visitors actually see.
 */
export default function SmoothScrollLinks() {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const node = event.target;
      if (!(node instanceof Element)) return;

      const anchor = node.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      const rawHref = anchor.getAttribute("href");
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const behavior = reduced ? "instant" : "smooth";

      // A bare "#" means "top", which has no element to scroll into view.
      if (rawHref === "#") {
        event.preventDefault();
        window.scrollTo({ top: 0, behavior });
        window.history.replaceState(
          null,
          "",
          `${window.location.pathname}${window.location.search}`
        );
        return;
      }

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin || !url.hash) return;

      const currentPath = window.location.pathname.replace(/\/+$/, "") || "/";
      const targetPath = url.pathname.replace(/\/+$/, "") || "/";
      if (targetPath !== currentPath) return;

      let id: string;
      try {
        id = decodeURIComponent(url.hash.slice(1));
      } catch {
        return;
      }

      const target = id ? document.getElementById(id) : document.body;
      if (!target) return;

      event.preventDefault();

      // `scroll-padding-top` on <html> keeps the sticky header from covering
      // the target. The explicit behavior is unaffected by the root's `auto`.
      target.scrollIntoView({ behavior, block: "start" });

      // Mirror a native hash click without adding a history entry for it.
      window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);

      // Move sequential focus too, but do not let focus trigger a second jump.
      if (target instanceof HTMLElement) {
        if (!target.hasAttribute("tabindex")) {
          target.setAttribute("tabindex", "-1");
        }
        target.focus({ preventScroll: true });
      }
    };

    // Capture before Next's <Link> handler; it checks `defaultPrevented`.
    document.addEventListener("click", onClick, { capture: true, passive: false });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);

  return null;
}
