"use client";

import { useEffect, useState } from "react";

/** Length of the rolling "5-hour offer" window. */
const OFFER_WINDOW_MS = 5 * 60 * 60 * 1000;
const STORAGE_KEY = "ppd-offer-deadline";

function readDeadline(): number {
  if (typeof window === "undefined") return Date.now() + OFFER_WINDOW_MS;
  try {
    const stored = Number(window.localStorage.getItem(STORAGE_KEY));
    if (Number.isFinite(stored) && stored > Date.now()) return stored;
    const next = Date.now() + OFFER_WINDOW_MS;
    window.localStorage.setItem(STORAGE_KEY, String(next));
    return next;
  } catch {
    return Date.now() + OFFER_WINDOW_MS;
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
  const [remaining, setRemaining] = useState(OFFER_WINDOW_MS);

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
