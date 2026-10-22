/**
 * Site-wide content & configuration — single source of truth.
 * Edit this file to update the store name, contact details, navigation,
 * occasions, categories, reviews and gallery across the whole site.
 */

export const siteConfig = {
  name: "Damsa Coture",
  tagline: "Luxury Designer-Inspired Dresses",
  company: "PPD GLOBAL LLC",
  email: "support@premiumpakistanidresses.com",
  phone: "+92 320 0909666",
  whatsapp:
    "https://wa.me/923200909666?text=Hello%20Premium%20Pakistani%20Dresses%2C%20I%20would%20like%20some%20styling%20assistance.",
  promoCode: "PPD10",
  promoDiscount: "10%",
  copyrightYear: "2026",
  social: {
    instagram: "https://www.instagram.com/premium.pakistani.dresses/",
    threads: "https://www.threads.com/@premium.pakistani.dresses",
    facebook: "https://www.facebook.com/61592077179870",
    tiktok: "https://www.tiktok.com/@premiumpakistanidresses",
  },
};

export interface NavChild {
  label: string;
  href: string;
}

export interface NavItem {
  label: string;
  href: string;
  children?: NavChild[];
  /** Shows a small "NEW" badge next to the label (mobile drawer only). */
  isNew?: boolean;
  /** Keeps the entry out of the desktop navigation bar (mobile drawer only). */
  desktopHidden?: boolean;
}

export const navItems: NavItem[] = [
  { label: "Shop All", href: "/shop" },
  { label: "Best Sellers", href: "/shop" },
  { label: "New Arrivals", href: "/shop" },
  { label: "ETHNC", href: "/shop", isNew: true, desktopHidden: true },
  {
    label: "Occasions",
    href: "/collections",
    children: [
      { label: "Barat", href: "/collections" },
      { label: "Mehndi", href: "/collections" },
      { label: "Nikkah", href: "/collections" },
      { label: "Walima", href: "/collections" },
      { label: "Mayun", href: "/collections" },
      { label: "Dholki", href: "/collections" },
      { label: "Engagement", href: "/collections" },
      { label: "Eid", href: "/collections" },
    ],
  },
  {
    label: "Wedding",
    href: "/shop",
    children: [
      { label: "Wedding Dresses", href: "/shop" },
      { label: "Wedding Shawls", href: "/shop" },
      { label: "Lehenga Choli", href: "/shop" },
      { label: "Sharara Dresses", href: "/shop" },
      { label: "Maxi Lehenga", href: "/shop" },
      { label: "Gharara Dresses", href: "/shop" },
      { label: "Velvet Dresses", href: "/shop" },
      { label: "Nikkah Dresses", href: "/shop" },
    ],
  },
  {
    label: "Bridal",
    href: "/shop",
    desktopHidden: true,
    children: [
      { label: "Pakistani Bridal Dresses", href: "/shop" },
      { label: "Luxury Bridal Wear", href: "/shop" },
      { label: "Bridal Maxi", href: "/shop" },
      { label: "Bridal Gown", href: "/shop" },
      { label: "Bridal Lehenga Choli", href: "/shop" },
    ],
  },
  { label: "Formals", href: "/shop" },
  { label: "Chiffon", href: "/shop" },
  {
    label: "Designers",
    href: "/shop",
    children: [
      { label: "Abeera Usman", href: "/shop" },
      { label: "Aisha Imran", href: "/shop" },
      { label: "Bunto Kazmi", href: "/shop" },
      { label: "Crimson", href: "/shop" },
      { label: "Eman Adeel", href: "/shop" },
      { label: "Farah Talib Aziz", href: "/shop" },
      { label: "Haseens Official", href: "/shop" },
      { label: "Hassan Sheheryar Yasin", href: "/shop" },
      { label: "Mahira Khan", href: "/shop" },
      { label: "Sana Safinaz", href: "/shop" },
      { label: "Zaroon Zahid", href: "/shop" },
    ],
  },
  { label: "Reviews", href: "/reviews" },
];

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
    title: "New Arrivals — Flat 50% Off",
    subtitle: "Freshly dropped designs from our latest collection",
    cta: "Shop Now",
    href: "/shop",
    image: "/images/hero1.png",
    mobileImage: "/images/mobile1.png",
  },
  {
    eyebrow: "Best Sellers",
    title: "Best Sellers — Flat 50% Off",
    subtitle: "Our most loved pieces, back by popular demand",
    cta: "Shop Now",
    href: "/shop",
    image: "/images/hero2.png",
    mobileImage: "/images/mobile2.png",
  },
  {
    eyebrow: "Formal Collection",
    title: "Formal Collection — Flat 50% Off",
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
  text: string;
  author: string;
  initial: string;
  rating: number;
}

export const reviews: Review[] = [
  {
    text: "Absolutely stunning dress! The quality exceeded my expectations and the stitching was perfect. Got so many compliments at my sister's wedding.",
    author: "Ayesha K.",
    initial: "A",
    rating: 5,
  },
  {
    text: "Ordered for my daughter's mehndi — the color was exactly as shown and delivery was faster than expected. Will definitely order again!",
    author: "Fatima R.",
    initial: "F",
    rating: 5,
  },
  {
    text: "Beautiful fabric and elegant design. The custom stitching option was a lifesaver. Customer service was very helpful throughout.",
    author: "Zainab M.",
    initial: "Z",
    rating: 4.5,
  },
];

export const gallery: string[] = [
  "/images/01.png",
  "/images/02.png",
  "/images/03.png",
  "/images/04.png",
  "/images/05.png",
  "/images/06.png",
];
