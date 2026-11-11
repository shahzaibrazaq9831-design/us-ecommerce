"use client";

import { useEffect, useRef, type ReactNode } from "react";

export default function Reveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("visible");
          observer.disconnect();
        }
      },
      // `threshold` is a ratio of the *target*, not of the viewport. A block
      // taller than ~8x the viewport can never reach 0.12 of itself, so a
      // whole product grid would stay at opacity 0 forever. Reveal as soon
      // as any part of the block crosses into view instead.
      { threshold: 0, rootMargin: "0px 0px -10% 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`scroll-animate ${className}`.trim()}>
      {children}
    </div>
  );
}
