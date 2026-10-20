"use client";

import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { occasions } from "@/data/site";

export default function OccasionsCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const delta = dir === "left" ? -240 : 240;
    scrollRef.current.scrollBy({ left: delta, behavior: "smooth" });
  };

  return (
    <div className="occasions-wrapper">
      <button className="scroll-btn scroll-left" onClick={() => scroll("left")} aria-label="Scroll left">
        <i className="fas fa-chevron-left" />
      </button>
      <div className="occasions-grid" ref={scrollRef}>
        {occasions.map((o) => (
          <Link key={o.name} href={o.href} className="occasion-card">
            <div className="occasion-image" style={{ position: "relative" }}>
              <Image src={o.image} alt={o.name} fill sizes="200px" style={{ objectFit: "cover" }} />
            </div>
            <span className="occasion-name">Shop {o.name}</span>
          </Link>
        ))}
      </div>
      <button className="scroll-btn scroll-right" onClick={() => scroll("right")} aria-label="Scroll right">
        <i className="fas fa-chevron-right" />
      </button>
    </div>
  );
}
