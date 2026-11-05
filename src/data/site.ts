/**
 * Site-wide content & configuration — single source of truth.
 * Edit this file to update the store name, contact details, navigation,
 * occasions, categories, reviews and gallery across the whole site.
 */

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
    href: "/collections/new-arrivals",
    image: "/images/hero1.png",
    mobileImage: "/images/mobile1.png",
  },
  {
    eyebrow: "Best Sellers",
    title: "Best Sellers — Flat 30% Off",
    subtitle: "Our most loved pieces, back by popular demand",
    cta: "Shop Now",
    href: "/shop",
    image: "/images/hero2.png",
    mobileImage: "/images/mobile2.png",
  },
  {
    eyebrow: "Formal Collection",
    title: "Formal Collection — Flat 30% Off",
    subtitle: "Statement outfits for weddings, Eid and evening events",
    cta: "Shop Now",
    href: "/shop",
    image: "/images/hero3.png",
    mobileImage: "/images/mobile3.png",
  },
];

export interface Occasion {
  name: string;
  href: string;
  image: string;
  /** Lookbook index shown on the image (matches the image file number). */
  number: string;
}

export const occasions: Occasion[] = [
  { name: "Barat", href: "/collections", image: "/images/06.png", number: "06" },
  { name: "Mehndi", href: "/collections", image: "/images/07.png", number: "07" },
  { name: "Nikkah", href: "/collections", image: "/images/04.png", number: "04" },
  { name: "Walima", href: "/collections", image: "/images/01.png", number: "01" },
  { name: "Mayun", href: "/collections", image: "/images/05.png", number: "05" },
  { name: "Dholki", href: "/collections", image: "/images/08.png", number: "08" },
  { name: "Engagement", href: "/collections", image: "/images/02.png", number: "02" },
  { name: "Eid", href: "/collections", image: "/images/03.png", number: "03" },
];

export const occasionDescriptions: Record<string, string> = {
  Barat: "Regal ensembles for the groom's wedding day",
  Mehndi: "Vibrant and festive looks for the mehndi night",
  Nikkah: "Elegant and graceful attire for your nikkah",
  Walima: "Stunning reception looks for the newlyweds",
  Mayun: "Soft pastels and traditional mayun outfits",
  Dholki: "Fun and festive outfits for musical nights",
  Engagement: "Romantic looks to celebrate your engagement",
  Eid: "Joyful festive wear for Eid celebrations",
};

export interface Category {
  name: string;
  count: number;
  href: string;
  image: string;
}

export const categories: Category[] = [
  {
    name: "Bridal Dresses",
    count: 24,
    href: "/shop",
    image: "/images/01.png",
  },
  {
    name: "Wedding Dresses",
    count: 36,
    href: "/shop",
    image: "/images/06.png",
  },
  { name: "Formals", count: 48, href: "/shop", image: "/images/02.png" },
  { name: "Chiffon", count: 32, href: "/shop", image: "/images/05.png" },
];

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

