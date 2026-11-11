"use client";

import { useEffect, useRef, useState } from "react";

export default function BackToTop() {
  const [visible, setVisible] = useState(false);
  /** Pending animation frame for the scroll check. */
  const frame = useRef<number | undefined>(undefined);

  useEffect(() => {
    // One check per animation frame. A raw scroll handler re-rendered the
    // button on every scroll event, which made the page stutter on phones.
    const onScroll = () => {
      if (frame.current !== undefined) return;
      frame.current = requestAnimationFrame(() => {
        frame.current = undefined;
        setVisible(window.scrollY > 400);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame.current !== undefined) {
        cancelAnimationFrame(frame.current);
        frame.current = undefined;
      }
    };
  }, []);

  const scrollToTop = () => {
    // Honour the OS "reduce motion" setting, the same way the CSS does.
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
  };

  return (
    <button
      className={`back-to-top${visible ? " visible" : ""}`}
      onClick={scrollToTop}
      aria-label="Back to top"
    >
      <i className="fas fa-chevron-up" />
    </button>
  );
}
