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
import { hasOpenModal } from "@/lib/overlay";

const SEEN_KEY = "ppd_discount_popup_seen";
const CLAIMED_KEY = "ppd_discount_popup_claimed";
const OPEN_DELAY = 2000;
const CLOSE_MS = 280;

type PopupState = "closed" | "open" | "closing";

/**
 * Welcome offer shown two seconds after the page finishes loading.
 *
 * It appears once per browser session (and never again once the visitor has
 * claimed the code), uses a blurred page backdrop, and locks scrolling /
 * focus while open so the offer behaves like a real modal on phones,
 * tablets and desktops.
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

  /* Reveal the offer once the page has loaded, then wait two seconds. */
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

    const tryOpen = () => {
      if (cancelled) return;

      // Stop if this visit has already been offered the discount (including
      // after the load event reschedules the fallback timer).
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

      open();
    };

    const schedule = (delay: number) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(tryOpen, delay);
    };

    // Normal case: two seconds after the load event. The fallback keeps the
    // offer alive when a slow third-party asset (font, flag, analytics) holds
    // the load event open indefinitely.
    const onLoad = () => schedule(OPEN_DELAY);
    window.addEventListener("load", onLoad, { once: true });
    schedule(OPEN_DELAY);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      window.removeEventListener("load", onLoad);
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

  /* Prevent the page behind the offer from scrolling while it is open. */
  useEffect(() => {
    if (!active) return;

    const body = document.body;
    const previousOverflow = body.style.overflow;
    const previousPaddingRight = body.style.paddingRight;
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPaddingRight;
    };
  }, [active]);

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
