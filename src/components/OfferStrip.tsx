"use client";

import { useEffect, useState } from "react";

/** Length of the rolling "5-hour offer" window. */
const OFFER_WINDOW_MS = 5 * 60 * 60 * 1000;
const STORAGE_KEY = "ppd-offer-deadline";

/**
 * Resolve the deadline for this visitor, or `null` when the one-time offer is
 * over. The deadline is set once — on the very first visit — and never
 * re-created, so returning visitors whose window expired never see the strip
 * again (no reset on reload, no second chance).
 */
function readDeadline(): number | null {
  const now = Date.now();

  const read = (storage: Storage): number | null => {
    const raw = storage.getItem(STORAGE_KEY);
    if (raw) {
      const stored = Number(raw);
      if (Number.isFinite(stored) && stored > now) return stored;
      // Expired — the one-time offer is over. Leave the expired value in
      // place so it never re-arms.
      return null;
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

export default function OfferStrip() {
  /** `null` = hidden (first paint, or window already over). */
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    const deadline = readDeadline();
    if (deadline === null) return; // One-time offer is over — stay hidden.

    const tick = () => setRemaining(Math.max(0, deadline - Date.now()));
    const frame = window.requestAnimationFrame(tick);
    const timer = window.setInterval(tick, 1000);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearInterval(timer);
    };
  }, []);

  // One-time offer: hidden until the stored deadline is known, and gone
  // permanently once the 5 hours run out — including live for open tabs.
  if (remaining === null || remaining <= 0) return null;

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
