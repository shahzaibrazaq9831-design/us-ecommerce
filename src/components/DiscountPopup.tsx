"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check, Copy, X } from "lucide-react";
import { siteConfig } from "@/data/site";
import { lockPageScroll, unlockPageScroll } from "@/lib/scrollLock";
import { hasOpenModal } from "@/lib/overlay";

const SEEN_KEY = "ppd_discount_popup_seen";
const CLAIMED_KEY = "ppd_discount_popup_claimed";
const OPEN_DELAY = 2000;
const CLOSE_MS = 280;
/** The offer waits for this much scroll-free time before it may open. */
const SCROLL_IDLE_MS = 900;

type PopupState = "closed" | "open" | "closing";

/**
 * Welcome offer shown after the page finishes loading.
 *
 * It appears once per browser session (and never again once the visitor has
 * claimed the code), uses a blurred page backdrop only while the popup is open,
 * and locks scrolling / focus while open. It must never open during scroll.
 */
export default function DiscountPopup() {
  const pathname = usePathname();
  const [state, setState] = useState<PopupState>("closed");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [claimed, setClaimed] = useState(false);
  const [copied, setCopied] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    let alreadyClaimed = false;
    try {
      seen = sessionStorage.getItem(SEEN_KEY) === "1";
      alreadyClaimed = localStorage.getItem(CLAIMED_KEY) === "1";
    } catch {
      // Treat storage errors as "not seen" so the offer still has a chance.
    }
    if (seen || alreadyClaimed) return;

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

  /* Keep focus inside the dialog when the form swaps to the success view. */
  useEffect(() => {
    if (!claimed || state !== "open") return;
    const timer = setTimeout(() => cardRef.current?.focus({ preventScroll: true }), 40);
    return () => clearTimeout(timer);
  }, [claimed, state]);

  useEffect(
    () => () => {
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    },
    []
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = email.trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setError("Please enter a valid email address.");
      inputRef.current?.focus();
      return;
    }

    setError("");
    try {
      localStorage.setItem(CLAIMED_KEY, "1");
    } catch {
      // The code is still displayed even if storage is blocked.
    }
    setClaimed(true);
  };

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(siteConfig.promoCode);
    } catch {
      const field = document.createElement("textarea");
      field.value = siteConfig.promoCode;
      field.setAttribute("readonly", "");
      field.style.position = "fixed";
      field.style.opacity = "0";
      document.body.appendChild(field);
      field.select();
      document.execCommand("copy");
      document.body.removeChild(field);
    }

    setCopied(true);
    if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    copiedTimerRef.current = setTimeout(() => setCopied(false), 2000);
  };

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
        className={`dp-card${claimed ? " is-success" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dp-title"
        aria-describedby={claimed ? "dp-success-desc" : "dp-desc"}
        tabIndex={-1}
      >
        <button
          type="button"
          className="dp-close"
          onClick={close}
          aria-label="Close discount offer"
        >
          <X size={17} aria-hidden="true" />
        </button>

        {claimed ? (
          <div className="dp-success">
            <span className="dp-success-icon" aria-hidden="true">
              <Check size={26} strokeWidth={2.2} />
            </span>

            <p className="dp-eyebrow">Welcome to Rung E Bahar</p>
            <h2 id="dp-title" className="dp-title">
              Your 10% off is ready
            </h2>
            <p id="dp-success-desc" className="dp-desc">
              Use this code at checkout on your first order.
            </p>

            <button
              type="button"
              className="dp-code"
              onClick={copyCode}
              aria-label={
                copied
                  ? "Discount code copied"
                  : `Copy discount code ${siteConfig.promoCode}`
              }
            >
              <span className="dp-code-value">{siteConfig.promoCode}</span>
              <span className="dp-code-action" aria-live="polite">
                {copied ? (
                  <>
                    <Check size={14} aria-hidden="true" /> Copied
                  </>
                ) : (
                  <>
                    <Copy size={14} aria-hidden="true" /> Copy
                  </>
                )}
              </span>
            </button>

            <Link href="/shop" className="dp-submit" onClick={close}>
              Shop the collection
            </Link>

            <button type="button" className="dp-decline" onClick={close}>
              Maybe later
            </button>
          </div>
        ) : (
          <>
            <Image
              src="/images/logo-damsa.webp"
              alt="Rung E Bahar"
              width={889}
              height={220}
              className="dp-logo"
              sizes="180px"
            />

            <p className="dp-eyebrow">Welcome to Rung E Bahar</p>
            <h2 id="dp-title" className="dp-title">
              Get 10% off your first order
            </h2>
            <p id="dp-desc" className="dp-desc">
              Join our community and enjoy exclusive offers, early access and
              style inspiration.
            </p>

            <form className="dp-form" onSubmit={handleSubmit} noValidate>
              <input
                ref={inputRef}
                className="dp-input"
                type="email"
                name="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  if (error) setError("");
                }}
                placeholder="Your email address"
                aria-label="Email address"
                aria-invalid={error ? "true" : undefined}
                aria-describedby={error ? "dp-error" : undefined}
                autoComplete="email"
                inputMode="email"
                required
              />
              <p
                id="dp-error"
                className={`dp-error${error ? " is-visible" : ""}`}
                role="alert"
              >
                {error}
              </p>
              <button type="submit" className="dp-submit">
                Claim my discount
              </button>
            </form>

            <button type="button" className="dp-decline" onClick={close}>
              No thanks, I&apos;ll pay full price
            </button>
          </>
        )}
      </div>
    </div>
  );
}
