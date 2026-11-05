/**
 * Home-page product rails — mirror of the reference storefront's home sections.
 *
 * Prices are stored in PKR (the store base currency) and converted at display
 * time by CurrencyContext. Every card keeps its own gallery in the same order
 * as the reference product page; `images[0]` is the card's main image.
 *
 * `slug` links the card to its product (buy) page at `/products/<slug>`.
 * Each home section has its own distinct products — no repeats across rails.
 * Only image files that exist in /public/images/rungebahar/ are used.
 */

export interface CollectionProduct {
  /** Unique key for the rail. */
  id: string;
  /** Product-page slug. */
  slug: string;
  name: string;
  /** Small optional line above the name (used by the occasion rail). */
  label?: string;
  images: string[];
  /** Current selling price in PKR. */
  price: number;
  /** Compare-at price in PKR (shown grey + struck through). */
  originalPrice: number;
  href: string;
}

/** Build the three gallery image paths saved under /public/images/rungebahar. */
const gallery = (handle: string): string[] => [
  `/images/rungebahar/${handle}-1.webp`,
  `/images/rungebahar/${handle}-2.webp`,
  `/images/rungebahar/${handle}-3.webp`,
];

const href = (slug: string) => `/products/${slug}`;

/**
 * Shop by Occasion — the same eight occasion photos as before, now paired with
 * the matching reference product name, price and a small gallery of extra shots.
 */
export const occasionProducts: CollectionProduct[] = [
  {
    id: "barat",
    slug: "sarang",
    label: "Barat",
    name: "Sarang",
    images: ["/occasions/barat-sarang.webp", ...gallery("sarang").slice(1)],
    price: 91600,
    originalPrice: 130900,
    href: href("sarang"),
  },
  {
    id: "mehndi",
    slug: "kesar",
    label: "Mehndi",
    name: "Kesar",
    images: ["/occasions/mehndi-kesar.webp", ...gallery("kesar").slice(1)],
    price: 72500,
    originalPrice: 103600,
    href: href("kesar"),
  },
  {
    id: "nikkah",
    slug: "opulent",
    label: "Nikkah",
    name: "Opulent",
    images: ["/occasions/nikkah-opulent.webp", ...gallery("opulent").slice(1)],
    price: 96300,
    originalPrice: 137600,
    href: href("opulent"),
  },
  {
    id: "walima",
    slug: "iriana",
    label: "Walima",
    name: "Iriana",
    images: ["/occasions/walima-iriana.webp", ...gallery("iriana").slice(1)],
    price: 74500,
    originalPrice: 106300,
    href: href("iriana"),
  },
  {
    id: "mayun",
    slug: "arasti-mustard-yellow",
    label: "Mayun",
    name: "Arasti",
    images: [
      "/occasions/mayun-arasti.webp",
      ...gallery("arasti-mustard-yellow").slice(1),
    ],
    price: 75900,
    originalPrice: 108400,
    href: href("arasti-mustard-yellow"),
  },
  {
    id: "dholki",
    slug: "shocking-bridal",
    label: "Dholki",
    name: "Shocking Bridal",
    images: [
      "/occasions/dholki-shocking.webp",
      ...gallery("shocking-bridal").slice(1),
    ],
    price: 62600,
    originalPrice: 89500,
    href: href("shocking-bridal"),
  },
  {
    id: "engagement",
    slug: "zeena",
    label: "Engagement",
    name: "Zeena",
    images: ["/occasions/engagement-zeena.webp", ...gallery("zeena").slice(1)],
    price: 78600,
    originalPrice: 112300,
    href: href("zeena"),
  },
  {
    id: "eid",
    slug: "noreen",
    label: "Eid",
    name: "Noreen",
    images: ["/occasions/eid-noreen.webp", ...gallery("noreen").slice(1)],
    price: 67300,
    originalPrice: 96100,
    href: href("noreen"),
  },
];

/**
 * New Arrivals — 8 distinct products, no overlap with other home sections.
 * Prices match rungebahar.com where the reference lists them.
 */
export const newArrivalProducts: CollectionProduct[] = [
  {
    id: "elia",
    slug: "elia",
    name: "Elia",
    images: gallery("elia"),
    price: 59200,
    originalPrice: 84600,
    href: href("elia"),
  },
  {
    id: "char-06",
    slug: "char-06",
    name: "Char -06",
    images: gallery("char"),
    price: 48400,
    originalPrice: 69100,
    href: href("char-06"),
  },
  {
    id: "darya",
    slug: "darya",
    name: "Darya",
    images: gallery("darya"),
    price: 67300,
    originalPrice: 96100,
    href: href("darya"),
  },
  {
    id: "mariyam",
    slug: "mariyam",
    name: "Mariyam",
    images: gallery("mariyam"),
    price: 55900,
    originalPrice: 79900,
    href: href("mariyam"),
  },
  {
    id: "ishani",
    slug: "ishani",
    name: "Ishani",
    images: gallery("ishani"),
    price: 55900,
    originalPrice: 79900,
    href: href("ishani"),
  },
  {
    id: "sabyasachi",
    slug: "sabyasachi",
    name: "Sabyasachi",
    images: gallery("sabyasachi"),
    price: 73400,
    originalPrice: 105000,
    href: href("sabyasachi"),
  },
  {
    id: "opulent",
    slug: "opulent",
    name: "Opulent",
    images: gallery("opulent"),
    price: 96300,
    originalPrice: 137600,
    href: href("opulent"),
  },
  {
    id: "kiara",
    slug: "kiara",
    name: "Kiara",
    images: gallery("kiara"),
    price: 85300,
    originalPrice: 121800,
    href: href("kiara"),
  },
];

/**
 * Luxury Formals — 8 distinct products, no overlap with other home sections.
 */
export const luxuryFormalProducts: CollectionProduct[] = [
  {
    id: "hyacinth",
    slug: "hyacinth",
    name: "Hyacinth",
    images: gallery("hyacinth"),
    price: 89400,
    originalPrice: 127700,
    href: href("hyacinth"),
  },
  {
    id: "lucent",
    slug: "lucent",
    name: "Lucent",
    images: gallery("lucent"),
    price: 65600,
    originalPrice: 93700,
    href: href("lucent"),
  },
  {
    id: "mira-elegant",
    slug: "mira-elegant",
    name: "Mira Elegant",
    images: gallery("mira-elegant"),
    price: 90500,
    originalPrice: 129300,
    href: href("mira-elegant"),
  },
  {
    id: "minahil",
    slug: "minahil",
    name: "Minahil",
    images: gallery("minahil"),
    price: 63900,
    originalPrice: 91300,
    href: href("minahil"),
  },
  {
    id: "naheed",
    slug: "naheed",
    name: "Naheed",
    images: gallery("naheed"),
    price: 84300,
    originalPrice: 120700,
    href: href("naheed"),
  },
  {
    id: "noreen",
    slug: "noreen",
    name: "Noreen",
    images: gallery("noreen"),
    price: 67300,
    originalPrice: 96100,
    href: href("noreen"),
  },
  {
    id: "offwhite-red",
    slug: "offwhite-red",
    name: "Offwhite & Red",
    images: gallery("offwhite-red"),
    price: 62500,
    originalPrice: 89300,
    href: href("offwhite-red"),
  },
  {
    id: "pista-embroidered",
    slug: "pista-embroidered",
    name: "Pista Embroidered",
    images: gallery("pista-embroidered"),
    price: 65600,
    originalPrice: 93700,
    href: href("pista-embroidered"),
  },
];

/**
 * Best Selling — 8 distinct products, no overlap with other home sections.
 */
export const bestSellingProducts: CollectionProduct[] = [
  {
    id: "surajmukhi",
    slug: "surajmukhi",
    name: "Surajmukhi",
    images: gallery("surajmukhi"),
    price: 75000,
    originalPrice: 107200,
    href: href("surajmukhi"),
  },
  {
    id: "sevgi",
    slug: "sevgi",
    name: "Sevgi",
    images: gallery("sevgi"),
    price: 63900,
    originalPrice: 91300,
    href: href("sevgi"),
  },
  {
    id: "saxe",
    slug: "saxe",
    name: "Saxe",
    images: gallery("saxe"),
    price: 63900,
    originalPrice: 91300,
    href: href("saxe"),
  },
  {
    id: "kesar",
    slug: "kesar",
    name: "Kesar",
    images: gallery("kesar"),
    price: 72500,
    originalPrice: 103600,
    href: href("kesar"),
  },
  {
    id: "arasti-mustard-yellow",
    slug: "arasti-mustard-yellow",
    name: "Arasti",
    images: gallery("arasti-mustard-yellow"),
    price: 75900,
    originalPrice: 108400,
    href: href("arasti-mustard-yellow"),
  },
  {
    id: "embroidered-mcp-106",
    slug: "embroidered-mcp-106",
    name: "Embroidered MCP 106",
    images: gallery("embroidered-mcp-106"),
    price: 61900,
    originalPrice: 88100,
    href: href("embroidered-mcp-106"),
  },
  {
    id: "iriana",
    slug: "iriana",
    name: "Iriana",
    images: gallery("iriana"),
    price: 74500,
    originalPrice: 106300,
    href: href("iriana"),
  },
  {
    id: "shocking-bridal",
    slug: "shocking-bridal",
    name: "Shocking Bridal",
    images: gallery("shocking-bridal"),
    price: 62600,
    originalPrice: 89500,
    href: href("shocking-bridal"),
  },
];
