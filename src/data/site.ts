/**
 * Site-wide content & configuration — single source of truth.
 * Edit this file to update the store name, contact details, navigation,
 * reviews and gallery across the whole site.
 *
 * Product data (products, categories, occasions, designers) lives in
 * `@/lib/products` so it stays in one place.
 */

import { occasions as catalogueOccasions } from "@/lib/products";

export const stylingAssistanceMessage =
  "Hello Rung E Bahar, I would like some styling assistance.";

export const siteConfig = {
  name: "Rung E Bahar",
  tagline: "Luxury Designer-Inspired Dresses",
  company: "Rung E Bahar",
  email: "rungebahar@gmail.com",
  phone: "+447476469395",
  whatsapp: `https://wa.me/447476469395?text=${encodeURIComponent(stylingAssistanceMessage)}`,
  promoCode: "PPD10",
  promoDiscount: "10%",
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

export interface Review {
  id: string;
  rating: number;
  text: string;
  author: string;
  verified: boolean;
  /** ISO date (YYYY-MM-DD) shown under the author name. */
  date: string;
  /** Customer-submitted photo shown at the top of the card. */
  image: string;
  product: string;
  productHref: string;
}

export const reviews: Review[] = [];

export const gallery: string[] = [
  "/images/01.png",
  "/images/02.png",
  "/images/03.png",
  "/images/04.png",
  "/images/05.png",
  "/images/06.png",
];

