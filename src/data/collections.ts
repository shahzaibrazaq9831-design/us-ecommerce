/**
 * Home-page product rails — mirror of the reference storefront's home sections.
 *
 * Prices are stored in PKR (the store base currency) and converted at display
 * time by CurrencyContext. Every card keeps its own gallery in the same order
 * as the reference product page; `images[0]` is the card's main image.
 *
 * `slug` links the card to its product (buy) page at `/products/<slug>`.
 * Rails may feature the same ensemble more than once; those entries share a slug.
 */

export interface CollectionProduct {
  /** Unique key for the rail. */
  id: string;
  /** Product-page slug (shared when the same ensemble appears in two rails). */
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

/** Fallback image handles for products whose gallery files are not yet
 *  saved under /public/images/rungebahar/. Points to an existing handle so
 *  the site still shows a product photo instead of a 404. */
const IMAGE_FALLBACK: Record<string, string> = {
  avisa: "elia",
  zarzevar: "char",
  amnaa: "mariyam",
  nainaa: "ishani",
  rangsatrang: "sabyasachi",
  shahkaar: "opulent",
  mahrooh: "kiara",
  aatish: "darya",
  gulzaar: "surajmukhi",
  mehrab: "hyacinth",
};

/** Resolve a gallery handle, falling back to an existing handle when needed. */
const resolveGallery = (handle: string): string[] =>
  gallery(IMAGE_FALLBACK[handle] ?? handle);

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

/** New Arrivals — eight products, same sequence and prices as rungebahar.com. */
export const newArrivalProducts: CollectionProduct[] = [
  {
    id: "amnaa",
    slug: "amnaa",
    name: "Amnaa",
    images: resolveGallery("amnaa"),
    price: 55900,
    originalPrice: 79900,
    href: href("amnaa"),
  },
  {
    id: "nainaa",
    slug: "nainaa",
    name: "Nainaa",
    images: resolveGallery("nainaa"),
    price: 55900,
    originalPrice: 79900,
    href: href("nainaa"),
  },
  {
    id: "rangsatrang",
    slug: "rangsatrang",
    name: "Rangsatrang",
    images: resolveGallery("rangsatrang"),
    price: 53700,
    originalPrice: 76800,
    href: href("rangsatrang"),
  },
  {
    id: "zarzevar",
    slug: "zarzevar",
    name: "Zarzevar",
    images: resolveGallery("zarzevar"),
    price: 53700,
    originalPrice: 76800,
    href: href("zarzevar"),
  },
  {
    id: "shahkaar",
    slug: "shahkaar",
    name: "Shahkaar",
    images: resolveGallery("shahkaar"),
    price: 53700,
    originalPrice: 76800,
    href: href("shahkaar"),
  },
  {
    id: "mahrooh",
    slug: "mahrooh",
    name: "Mahrooh",
    images: resolveGallery("mahrooh"),
    price: 53700,
    originalPrice: 76800,
    href: href("mahrooh"),
  },
  {
    id: "aatish",
    slug: "aatish",
    name: "Aatish",
    images: resolveGallery("aatish"),
    price: 53700,
    originalPrice: 76800,
    href: href("aatish"),
  },
  {
    id: "gulzaar",
    slug: "gulzaar",
    name: "Gulzaar",
    images: resolveGallery("gulzaar"),
    price: 53700,
    originalPrice: 76800,
    href: href("gulzaar"),
  },
];

/** Luxury Formals — eight products, same sequence and prices as rungebahar.com. */
export const luxuryFormalProducts: CollectionProduct[] = [
  {
    id: "avisa",
    slug: "avisa",
    name: "Avisa",
    images: resolveGallery("avisa"),
    price: 48000,
    originalPrice: 68600,
    href: href("avisa"),
  },
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
    id: "lux-amnaa",
    slug: "amnaa",
    name: "Amnaa",
    images: resolveGallery("amnaa"),
    price: 55900,
    originalPrice: 79900,
    href: href("amnaa"),
  },
  {
    id: "lux-nainaa",
    slug: "nainaa",
    name: "Nainaa",
    images: resolveGallery("nainaa"),
    price: 55900,
    originalPrice: 79900,
    href: href("nainaa"),
  },
  {
    id: "lux-shahkaar",
    slug: "shahkaar",
    name: "Shahkaar",
    images: resolveGallery("shahkaar"),
    price: 53700,
    originalPrice: 76800,
    href: href("shahkaar"),
  },
  {
    id: "lux-mahrooh",
    slug: "mahrooh",
    name: "Mahrooh",
    images: resolveGallery("mahrooh"),
    price: 53700,
    originalPrice: 76800,
    href: href("mahrooh"),
  },
  {
    id: "mehrab",
    slug: "mehrab",
    name: "Mehrab",
    images: resolveGallery("mehrab"),
    price: 53700,
    originalPrice: 76800,
    href: href("mehrab"),
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
];

/** Best Selling — eight products, same sequence and prices as rungebahar.com. */
export const bestSellingProducts: CollectionProduct[] = [
  {
    id: "best-avisa",
    slug: "avisa",
    name: "Avisa",
    images: resolveGallery("avisa"),
    price: 48000,
    originalPrice: 68600,
    href: href("avisa"),
  },
  {
    id: "best-elia",
    slug: "elia",
    name: "Elia",
    images: gallery("elia"),
    price: 59200,
    originalPrice: 84600,
    href: href("elia"),
  },
  {
    id: "best-amnaa",
    slug: "amnaa",
    name: "Amnaa",
    images: resolveGallery("amnaa"),
    price: 55900,
    originalPrice: 79900,
    href: href("amnaa"),
  },
  {
    id: "best-nainaa",
    slug: "nainaa",
    name: "Nainaa",
    images: resolveGallery("nainaa"),
    price: 55900,
    originalPrice: 79900,
    href: href("nainaa"),
  },
  {
    id: "best-rangsatrang",
    slug: "rangsatrang",
    name: "Rangsatrang",
    images: resolveGallery("rangsatrang"),
    price: 53700,
    originalPrice: 76800,
    href: href("rangsatrang"),
  },
  {
    id: "best-zarzevar",
    slug: "zarzevar",
    name: "Zarzevar",
    images: resolveGallery("zarzevar"),
    price: 53700,
    originalPrice: 76800,
    href: href("zarzevar"),
  },
  {
    id: "best-shahkaar",
    slug: "shahkaar",
    name: "Shahkaar",
    images: resolveGallery("shahkaar"),
    price: 53700,
    originalPrice: 76800,
    href: href("shahkaar"),
  },
  {
    id: "best-mahrooh",
    slug: "mahrooh",
    name: "Mahrooh",
    images: resolveGallery("mahrooh"),
    price: 53700,
    originalPrice: 76800,
    href: href("mahrooh"),
  },
];
