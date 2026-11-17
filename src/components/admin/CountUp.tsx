"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

/** An animated number that respects the visitor's reduced-motion setting. */
export default function CountUp({
  value,
  format,
  duration = 1100,
}: {
  value: number;
  format?: (value: number) => string;
  duration?: number;
}) {
  const [display, setDisplay] = useState(0);
  const frame = useRef<number | null>(null);
  const reduce = useReducedMotion();
  const formatter = format ?? ((number: number) => Math.round(number).toLocaleString("en-US"));

  useEffect(() => {
    if (reduce) return;

    const start = performance.now();
    const from = 0;

    const step = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(from + (value - from) * eased);
      if (progress < 1) frame.current = requestAnimationFrame(step);
    };

    frame.current = requestAnimationFrame(step);
    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, [value, duration, reduce]);

  return <>{formatter(reduce ? value : display)}</>;
}
