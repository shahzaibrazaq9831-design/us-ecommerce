/**
 * Site-wide content & configuration — single source of truth.
 * Edit this file to update the store name, contact details, navigation,
 * occasions, categories, reviews and gallery across the whole site.
 */

export const siteConfig = {
  name: "Premium Pakistani Dresses",
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
}

export const navItems: NavItem[] = [
  { label: "Shop All", href: "/shop" },
  { label: "Best Sellers", href: "/shop" },
  { label: "New Arrivals", href: "/shop" },
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
      { label: "Bridal", href: "/shop" },
      { label: "Wedding", href: "/shop" },
    ],
  },
  { label: "Formals", href: "/shop" },
  { label: "Chiffon", href: "/shop" },
  {
    label: "Designers",
    href: "/shop",
    children: [{ label: "ETHNC", href: "/shop" }],
  },
  { label: "Reviews", href: "/reviews" },
];

export interface HeroSlide {
  eyebrow: string;
  title: string;
  subtitle: string;
  cta: string;
  href: string;
  image: string;
}

export const heroSlides: HeroSlide[] = [
  {
    eyebrow: "New Collection 2026",
    title: "Luxury Pakistani Designer-Inspired Dresses",
    subtitle:
      "Discover timeless elegance with our exclusive collection of premium Pakistani dresses",
    cta: "Shop New Arrivals",
    href: "/shop",
    image: "/images/dress-1.jpg",
  },
  {
    eyebrow: "Bridal Season",
    title: "Stunning Bridal Collection",
    subtitle:
      "Make your special day unforgettable with our exquisite bridal wear",
    cta: "Shop Bridal",
    href: "/shop",
    image: "/images/dress-2.jpg",
  },
  {
    eyebrow: "Eid Special",
    title: "Celebrate in Style",
    subtitle: "Eid collection now available with worldwide free delivery",
    cta: "Shop Eid Collection",
    href: "/collections",
    image: "/images/dress-3.jpg",
  },
];

export interface Occasion {
  name: string;
  href: string;
  image: string;
}

export const occasions: Occasion[] = [
  { name: "Barat", href: "/collections", image: "/images/dress-3.jpg" },
  { name: "Mehndi", href: "/collections", image: "/images/dress-1.jpg" },
  { name: "Nikkah", href: "/collections", image: "/images/dress-2.jpg" },
  { name: "Walima", href: "/collections", image: "/images/dress-4.jpg" },
  { name: "Mayun", href: "/collections", image: "/images/dress-5.jpg" },
  { name: "Dholki", href: "/collections", image: "/images/dress-6.jpg" },
  { name: "Engagement", href: "/collections", image: "/images/dress-7.jpg" },
  { name: "Eid", href: "/collections", image: "/images/dress-8.jpg" },
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
  { name: "Bridal Dresses", count: 24, href: "/shop", image: "/images/dress-2.jpg" },
  { name: "Wedding Dresses", count: 36, href: "/shop", image: "/images/dress-3.jpg" },
  { name: "Formals", count: 48, href: "/shop", image: "/images/dress-4.jpg" },
  { name: "Chiffon", count: 32, href: "/shop", image: "/images/dress-1.jpg" },
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
  "/images/dress-1.jpg",
  "/images/dress-2.jpg",
  "/images/dress-3.jpg",
  "/images/dress-4.jpg",
  "/images/dress-5.jpg",
  "/images/dress-6.jpg",
];
