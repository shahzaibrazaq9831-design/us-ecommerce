"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { heroSlides } from "@/data/site";

export default function HeroSlider() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % heroSlides.length);
    }, 5500);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="hero">
      <div className="hero-slider">
        {heroSlides.map((slide, index) => (
          <div
            key={slide.title}
            className={`hero-slide${index === current ? " active" : ""}`}
            style={{ backgroundImage: `url('${slide.image}')` }}
          >
            <div className="hero-content">
              <span className="hero-eyebrow">{slide.eyebrow}</span>
              <h1 className="hero-title">{slide.title}</h1>
              <p className="hero-subtitle">{slide.subtitle}</p>
              <Link href={slide.href} className="btn btn-primary">
                {slide.cta}
              </Link>
            </div>
          </div>
        ))}
      </div>
      <div className="hero-dots">
        {heroSlides.map((_, index) => (
          <button
            key={index}
            className={`dot${index === current ? " active" : ""}`}
            onClick={() => setCurrent(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
