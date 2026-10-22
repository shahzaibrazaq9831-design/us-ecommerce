"use client";

import { useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { occasions } from "@/data/site";

export default function OccasionsCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);

  /** Scrolls the rail two cards at a time, matching the visible card count. */
  const scroll = useCallback((dir: "left" | "right") => {
    const rail = scrollRef.current;
    if (!rail) return;

    const cards = rail.querySelectorAll<HTMLElement>(".occasion-card");
    if (cards.length === 0) return;

    const gap = parseFloat(window.getComputedStyle(rail).columnGap) || 0;
    const first = cards[0].getBoundingClientRect().width;
    const second = cards[1]?.getBoundingClientRect().width ?? 0;
    // Two cards plus the gap that follows each of them, so the rail lands
    // exactly on a card edge (which is also a scroll-snap point).
    const step = first + gap + second + gap;

    rail.scrollBy({ left: dir === "right" ? step : -step, behavior: "smooth" });
  }, []);

  return (
    <div className="occasions-wrapper">
      <button
        className="scroll-btn scroll-left"
        onClick={() => scroll("left")}
        aria-label="Scroll occasions left"
      >
        <i className="fas fa-chevron-left" aria-hidden="true" />
      </button>

      <div className="occasions-grid" ref={scrollRef}>
        {occasions.map((o) => (
          <Link
            key={o.name}
            href={o.href}
            className="occasion-card"
            aria-label={`Shop ${o.name}`}
            title={o.name}
          >
            <div className="occasion-image">
              <Image
                src={o.image}
                alt={o.name}
                fill
                sizes="(max-width: 768px) 46vw, (max-width: 1024px) 32vw, (max-width: 1280px) 24vw, 19vw"
                style={{ objectFit: "cover" }}
              />
              <span className="occasion-number" aria-hidden="true">
                {o.number}
              </span>
            </div>
          </Link>
        ))}
      </div>

      <button
        className="scroll-btn scroll-right"
        onClick={() => scroll("right")}
        aria-label="Scroll occasions right"
      >
        <i className="fas fa-chevron-right" aria-hidden="true" />
      </button>
    </div>
  );
}
