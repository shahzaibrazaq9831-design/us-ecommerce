/**
 * Site-wide content & configuration — single source of truth.
 * Edit this file to update the store name, contact details, navigation,
 * reviews and gallery across the whole site.
 *
 * Product data (products, categories, occasions, designers) lives in
 * `@/lib/products` so it stays in one place.
 */

import { occasions as catalogueOccasions } from "@/lib/products";
import type { Review } from "@/lib/products";
import { DEFAULT_DISCOUNT_CODE, DISCOUNT_CODES } from "@/lib/discounts";

export const stylingAssistanceMessage =
  "Hello Rung E Bahar, I would like some styling assistance.";

export const siteConfig = {
  name: "Rung E Bahar",
  tagline: "Luxury Designer-Inspired Dresses",
  company: "Rung E Bahar",
  email: "rungebahar@gmail.com",
  phone: "+447476469395",
  whatsapp: `https://wa.me/447476469395?text=${encodeURIComponent(stylingAssistanceMessage)}`,
  /* The discount code lives in `@/lib/discounts` — that is the one place a
     code is defined and checked. */
  promoCode: DEFAULT_DISCOUNT_CODE,
  promoDiscount: `${DISCOUNT_CODES[DEFAULT_DISCOUNT_CODE].percent}%`,
  copyrightYear: "2026",
  social: {
    instagram: "https://www.instagram.com/rungebahar/",
    threads: "https://www.threads.com/@rungebahar",
    facebook: "https://www.facebook.com/rungebahar",
    tiktok: "https://www.tiktok.com/@rungebahar",
  },
};

export interface HeroSlide {
  eyebrow: string;
  title: string;
  subtitle: string;
  cta: string;
  href: string;
  /** Landscape artwork used from 1024px up. */
  image: string;
  /** Portrait artwork (427 x 534) used by the phone hero. */
  mobileImage: string;
}

export const heroSlides: HeroSlide[] = [
  {
    eyebrow: "New Arrivals",
    title: "New Arrivals — Flat 30% Off",
    subtitle: "Freshly dropped designs from our latest collection",
    cta: "Shop Now",
    href: "/new-arrivals",
    image: "/images/hero1.png",
    mobileImage: "/images/mobile1.png",
  },
  {
    eyebrow: "Best Sellers",
    title: "Best Sellers — Flat 30% Off",
    subtitle: "Our most loved pieces, back by popular demand",
    cta: "Shop Now",
    href: "/best-sellers",
    image: "/images/hero2.png",
    mobileImage: "/images/mobile2.png",
  },
  {
    eyebrow: "Formal Collection",
    title: "Formal Collection — Flat 30% Off",
    subtitle: "Statement outfits for weddings, Eid and evening events",
    cta: "Shop Now",
    href: "/categories/formals",
    image: "/images/hero3.png",
    mobileImage: "/images/mobile3.png",
  },
];

/** The eight celebrations we dress for — the copy lives with the catalogue. */
export const occasions = catalogueOccasions;

/**
 * The shape of a customer review. The reviews themselves live in
 * `@/lib/reviews` — the shape is shared with the catalogue so both sides
 * agree on what a review is.
 */
export type { Review };

/**
 * Reviews shown by the review notification popup.
 *
 * The list is empty on purpose: the popup is a static notification and
 * must never show a review that has not been approved. Reviews are read
 * from `@/lib/reviews` by the pages that list them.
 */
export const reviews: Review[] = [];

export const gallery: string[] = [
  "/images/01.png",
  "/images/02.png",
  "/images/03.png",
  "/images/04.png",
  "/images/05.png",
  "/images/06.png",
];

