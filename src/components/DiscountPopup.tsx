"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { lockPageScroll, unlockPageScroll } from "@/lib/scrollLock";
import { hasOpenModal } from "@/lib/overlay";
import { FREE_SHIPPING_LABEL, multiBuy, MULTI_BUY_LABEL } from "@/lib/offers";

const SEEN_KEY = "ppd_offer_popup_seen";
const OPEN_DELAY = 2000;
const CLOSE_MS = 280;
/** The offer waits for this much scroll-free time before it may open. */
const SCROLL_IDLE_MS = 900;

type PopupState = "closed" | "open" | "closing";

/**
 * The shop's two real offers, shown once after the page finishes loading.
 *
 * There is no code and no email gate: both offers are applied automatically
 * at checkout. The popup appears once per browser session, uses a blurred
 * page backdrop only while it is open, and locks scrolling / focus while open.
 * It must never open during scroll.
 */
export default function DiscountPopup() {
  const pathname = usePathname();
  const [state, setState] = useState<PopupState>("closed");
  const cardRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const active = state !== "closed";

  const open = useCallback(() => {
    try {
      sessionStorage.setItem(SEEN_KEY, "1");
    } catch {
      // Storage can be unavailable in private browsing; the popup still works.
    }
    setState("open");
  }, []);

  const close = useCallback(() => {
    setState((current) => (current === "open" ? "closing" : current));
  }, []);

  /* Reveal the offer after load, but never while the user is scrolling. */
  useEffect(() => {
    if (pathname.startsWith("/checkout")) return;

    let seen = false;
    try {
      seen = sessionStorage.getItem(SEEN_KEY) === "1";
    } catch {
      // Treat storage errors as "not seen" so the offer still has a chance.
    }
    if (seen) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let attempts = 0;
    let lastScrollAt = 0;

    const markScrolling = () => {
      lastScrollAt = Date.now();
    };

    const tryOpen = () => {
      if (cancelled) return;

      try {
        if (sessionStorage.getItem(SEEN_KEY) === "1") return;
      } catch {
        // Continue when storage is unavailable.
      }

      // Let a visible modal (quick view, search, mobile menu, etc.) finish
      // first, then try again shortly after.
      if (hasOpenModal()) {
        if (attempts++ < 20) timer = setTimeout(tryOpen, 1200);
        return;
      }

      // Popups must never open during scroll (including touch/two-finger scroll).
      if (Date.now() - lastScrollAt < SCROLL_IDLE_MS) {
        if (attempts++ < 40) timer = setTimeout(tryOpen, 250);
        return;
      }

      open();
    };

    const schedule = (delay: number) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(tryOpen, delay);
    };

    window.addEventListener("scroll", markScrolling, { passive: true });
    window.addEventListener("touchmove", markScrolling, { passive: true });
    window.addEventListener("wheel", markScrolling, { passive: true });

    const onLoad = () => schedule(OPEN_DELAY);
    window.addEventListener("load", onLoad, { once: true });
    schedule(OPEN_DELAY);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      window.removeEventListener("load", onLoad);
      window.removeEventListener("scroll", markScrolling);
      window.removeEventListener("touchmove", markScrolling);
      window.removeEventListener("wheel", markScrolling);
    };
  }, [open, pathname]);

  /* Finish the closing animation, then unmount. */
  useEffect(() => {
    if (state !== "closing") return;
    closeTimerRef.current = setTimeout(() => setState("closed"), CLOSE_MS);
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, [state]);

  /* Scroll lock — whole-site scrolling is disabled while the offer is open.
   * A ref tracks whether THIS component owns the lock, so we never restore a
   * "hidden" value captured from another modal (which would leave the page
   * unscrollable after nested opens/closes, refreshes, or interrupted exits).
   * The lock targets the root scroller, never <body>: locking the body both
   * fails to stop the page from scrolling and breaks the sticky header. */
  const lockRef = useRef(false);

  const applyLock = useCallback(() => {
    if (lockRef.current) return; // already locked by this instance
    lockPageScroll();
    lockRef.current = true;
  }, []);

  const releaseLock = useCallback(() => {
    if (!lockRef.current) return; // we don't own the lock — don't touch it
    unlockPageScroll();
    lockRef.current = false;
  }, []);

  // Apply the lock when the offer opens, release it when it closes.
  useEffect(() => {
    if (!active) {
      releaseLock();
      return;
    }
    applyLock();
  }, [active, applyLock, releaseLock]);

  // Release immediately when the exit animation starts, so the page is never
  // left unscrollable while the modal fades out.
  useEffect(() => {
    if (state !== "closing") return;
    releaseLock();
  }, [state, releaseLock]);

  // Guarantee scroll is restored the moment this component leaves the DOM,
  // even if the modal was still open (hard refresh / mid-animation navigation).
  useEffect(() => {
    return () => {
      releaseLock();
    };
  }, [releaseLock]);

  /* Focus management: move focus into the dialog, trap Tab and close on Esc. */
  useEffect(() => {
    if (state !== "open") return;

    const node = cardRef.current;
    if (!node) return;

    const previouslyFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    node.focus({ preventScroll: true });

    const getFocusable = () =>
      Array.from(
        node.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((element) => element.offsetParent !== null);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }

      if (event.key !== "Tab") return;

      const focusable = getFocusable();
      if (focusable.length === 0) {
        event.preventDefault();
        node.focus({ preventScroll: true });
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (
        event.shiftKey &&
        (document.activeElement === first || document.activeElement === node)
      ) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus({ preventScroll: true });
    };
  }, [close, state]);

  if (!active) return null;

  return (
    <div
      className={`dp-overlay${state === "closing" ? " is-closing" : ""}`}
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <div
        ref={cardRef}
        className="dp-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dp-title"
        aria-describedby="dp-desc"
        tabIndex={-1}
      >
        <button
          type="button"
          className="dp-close"
          onClick={close}
          aria-label="Close offer"
        >
          <X size={17} aria-hidden="true" />
        </button>

        <Image
          src="/images/logo-rung-e-bahar.webp"
          alt="Rung E Bahar"
          width={889}
          height={220}
          className="dp-logo"
          sizes="180px"
        />

        <p className="dp-eyebrow">A little more from Rung E Bahar</p>
        <h2 id="dp-title" className="dp-title">
          {MULTI_BUY_LABEL}
        </h2>
        <p id="dp-desc" className="dp-desc">
          Add any {multiBuy.minItems} dresses to your cart and the extra{" "}
          {multiBuy.percentOff}% comes off automatically at checkout. No code
          needed.
        </p>
        <p className="dp-desc">{FREE_SHIPPING_LABEL}.</p>

        <Link href="/shop" className="dp-submit" onClick={close}>
          Shop the collection
        </Link>

        <button type="button" className="dp-decline" onClick={close}>
          Maybe later
        </button>
      </div>
    </div>
  );
}
