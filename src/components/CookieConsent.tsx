"use client";

import { useEffect, useState } from "react";
import { useHydrated } from "@/hooks/useHydrated";

/**
 * Cookie consent.
 *
 * The rules this banner keeps:
 *
 *   - It is a fixed overlay, so it never moves the page and never
 *     changes how long the page is. Nothing is pushed down and the
 *     scroll is never locked — the visitor can carry on reading while
 *     they decide.
 *   - The choice is saved, so the banner is asked for once and not
 *     again.
 *   - No analytics is loaded until the visitor says yes. The script is
 *     only added to the page after the choice has been made and saved,
 *     so a visitor who says no is never measured.
 *
 * The analytics address comes from `NEXT_PUBLIC_ANALYTICS_SRC`. When
 * that variable is not set there is nothing to load, and the banner
 * simply records the choice.
 */

/** Where the choice is kept in the browser. */
const STORAGE_KEY = "ppd_cookie_consent";

/** The choice a visitor can make. */
type Consent = "accepted" | "rejected";

/** The choice that was made before, if there was one. */
let cachedRaw: string | null = null;
let cachedChoice: Consent | null = null;

function readConsent(): Consent | null {
  if (typeof window === "undefined") return null;

  let raw: string | null = null;

  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }

  // The same text means the same choice — keep the old value so the
  // answer stays the same between renders.
  if (raw === cachedRaw) return cachedChoice;

  cachedRaw = raw;
  cachedChoice = raw === "accepted" || raw === "rejected" ? raw : null;

  return cachedChoice;
}

/** Save the choice, in the browser and in a cookie. */
function saveConsent(choice: Consent): void {
  cachedRaw = choice;
  cachedChoice = choice;

  try {
    window.localStorage.setItem(STORAGE_KEY, choice);
  } catch {
    // The browser refused to store it — the choice still holds for this
    // visit, it just gets asked for again next time.
  }

  try {
    window.document.cookie = `${STORAGE_KEY}=${choice}; path=/; max-age=${60 * 60 * 24 * 180}; samesite=lax`;
  } catch {
    // Cookies can be unavailable in private browsing.
  }
}

/**
 * Put the analytics script on the page.
 *
 * Nothing happens until this is called, and it is only called after
 * the visitor has accepted.
 */
function loadAnalytics(): void {
  const src = process.env.NEXT_PUBLIC_ANALYTICS_SRC;
  if (!src) return;

  if (document.querySelector("script[data-analytics='true']")) return;

  const script = document.createElement("script");
  script.async = true;
  script.src = src;
  script.dataset.analytics = "true";
  document.head.appendChild(script);
}

export default function CookieConsent() {
  /** True once the browser has taken over from the server. */
  const hydrated = useHydrated();

  /** The choice, once the browser is able to tell us. */
  const consent = hydrated ? readConsent() : null;

  /** Set once the visitor has answered, so the banner can go. */
  const [answered, setAnswered] = useState(false);

  // A visitor who accepted on an earlier visit is measured as usual.
  useEffect(() => {
    if (hydrated && consent === "accepted") loadAnalytics();
  }, [hydrated, consent]);

  const choose = (choice: Consent) => {
    saveConsent(choice);
    setAnswered(true);

    if (choice === "accepted") loadAnalytics();
  };

  if (!hydrated || consent !== null || answered) return null;

  return (
    <div className="cookie-consent" role="region" aria-label="Cookie preferences">
      <div className="cookie-consent__inner">
        <p className="cookie-consent__text">
          We use cookies to make the shop work and to see how it is used. You
          can accept them or carry on without — nothing is measured until you
          accept. Read our{" "}
          <a href="/privacy" className="cookie-consent__link">
            privacy policy
          </a>
          .
        </p>

        <div className="cookie-consent__actions">
          <button
            type="button"
            className="btn btn-outline cookie-consent__button"
            onClick={() => choose("rejected")}
          >
            Continue without
          </button>
          <button
            type="button"
            className="btn btn-primary cookie-consent__button"
            onClick={() => choose("accepted")}
          >
            Accept cookies
          </button>
        </div>
      </div>
    </div>
  );
}
