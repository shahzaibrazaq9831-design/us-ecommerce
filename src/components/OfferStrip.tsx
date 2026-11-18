"use client";

import { useEffect, useMemo, useState } from "react";

export interface OfferStripProps {
  /** Set to false in admin settings to hide the strip entirely. */
  enabled: boolean;
  /** ISO timestamp for the end of the campaign. Empty means no countdown. */
  endDate: string;
  /** The one discount code advertised across the storefront. */
  discountCode: string;
  /** Percentage taken off by that code. */
  discountPercent: number;
}

function formatRemaining(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Campaign strip driven by admin settings.
 *
 * When a campaign end date is saved we render a live countdown. Without one
 * the strip still advertises the one discount code, but never invents a fake
 * timer. Both states are decided on the server so the markup is stable through
 * hydration; only the digits change once the clock starts ticking.
 */
export default function OfferStrip({
  enabled,
  endDate,
  discountCode,
  discountPercent,
}: OfferStripProps) {
  const deadline = useMemo(() => {
    if (!endDate?.trim()) return 0;
    const parsed = Date.parse(endDate);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [endDate]);

  const [remaining, setRemaining] = useState(() =>
    deadline > 0 ? Math.max(0, deadline - Date.now()) : 0
  );

  useEffect(() => {
    if (!enabled || deadline <= 0) return;
    const tick = () => setRemaining(Math.max(0, deadline - Date.now()));
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [deadline, enabled]);

  if (!enabled) return null;
  if (deadline > 0 && remaining <= 0) return null;

  return (
    <div className="offer-strip">
      <p className="offer-strip-main">
        <span>{deadline > 0 ? "Your limited-time offer" : "Your welcome offer"}</span>
        <span className="offer-strip-sep" aria-hidden="true">
          -
        </span>
        <span>Extra {discountPercent}% off with code {discountCode}</span>
        {deadline > 0 ? (
          <>
            <span className="offer-strip-divider" aria-hidden="true">
              |
            </span>
            <span
              className="offer-strip-timer"
              role="timer"
              aria-live="off"
              suppressHydrationWarning
            >
              {formatRemaining(remaining)}
            </span>
          </>
        ) : null}
      </p>
      <p className="offer-strip-sub">
        Use code {discountCode} at checkout{deadline > 0 ? " before the timer ends" : ""}.
      </p>
    </div>
  );
}
