"use client";

import { useEffect, useState } from "react";

/** Length of the rolling "5-hour offer" window. */
const OFFER_WINDOW_MS = 5 * 60 * 60 * 1000;
const STORAGE_KEY = "ppd-offer-deadline";

/**
 * The value rendered on the server and on the very first client render.
 *
 * It is always a full window so both renders produce identical markup — the
 * countdown then swaps in the visitor's real value from an effect. Because
 * the digits sit in a fixed-width, tabular-number box, that swap cannot
 * reflow the page.
 */
const INITIAL_REMAINING_MS = OFFER_WINDOW_MS;

/**
 * Resolve the deadline for this visitor.
 * Once the 5-hour window expires, a new window is created so the offer
 * can re-appear instead of staying hidden forever.
 */
function readDeadline(): number {
  const now = Date.now();

  const read = (storage: Storage): number => {
    const raw = storage.getItem(STORAGE_KEY);
    if (raw) {
      const stored = Number(raw);
      if (Number.isFinite(stored) && stored > now) return stored;
      // Expired — clear and re-arm for a new 5-hour window.
      storage.removeItem(STORAGE_KEY);
      const deadline = now + OFFER_WINDOW_MS;
      storage.setItem(STORAGE_KEY, String(deadline));
      return deadline;
    }
    const deadline = now + OFFER_WINDOW_MS;
    storage.setItem(STORAGE_KEY, String(deadline));
    return deadline;
  };

  try {
    return read(window.localStorage);
  } catch {
    // Storage can be unavailable (private browsing). Fall back to
    // sessionStorage so the offer still appears at most once per session.
    try {
      return read(window.sessionStorage);
    } catch {
      return now + OFFER_WINDOW_MS;
    }
  }
}

function formatRemaining(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

/**
 * One-time 5-hour welcome offer.
 *
 * The strip is intentionally always rendered — including in the server HTML —
 * with the full-width countdown. Only the digits change after hydration, so
 * the banner never pops in and never changes the page height while scrolling.
 */
export default function OfferStrip() {
  const [remaining, setRemaining] = useState(INITIAL_REMAINING_MS);

  useEffect(() => {
    const deadline = readDeadline();

    const tick = () => setRemaining(Math.max(0, deadline - Date.now()));
    tick();

    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="offer-strip">
      <p className="offer-strip-main">
        <span>Your 5-hour offer</span>
        <span className="offer-strip-sep" aria-hidden="true">
          -
        </span>
        <span>Extra 10% off automatically</span>
        <span className="offer-strip-divider" aria-hidden="true">
          |
        </span>
        <span className="offer-strip-timer" role="timer" aria-live="off">
          {formatRemaining(remaining)}
        </span>
      </p>
      <p className="offer-strip-sub">Order before the timer ends to get this discount price.</p>
    </div>
  );
}
