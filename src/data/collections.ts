/**
 * Home-page product rails — mirror of the reference storefront's home sections.
 *
 * Prices are stored in PKR (the store base currency) and converted at display
 * time by CurrencyContext. Every card keeps its own gallery in the same order
 * as the reference product page; `images[0]` is the card's main image.
 */

export interface CollectionProduct {
  /** Unique key for the rail. */
  id: string;
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

/**
 * Shop by Occasion — the same eight occasion photos as before, now paired with
 * the matching reference product name, price and a small gallery of extra shots.
 */
export const occasionProducts: CollectionProduct[] = [
  {
    id: "barat",
    label: "Barat",
    name: "Sarang",
    images: ["/occasions/barat-sarang.webp", ...gallery("sarang").slice(1)],
    price: 91600,
    originalPrice: 130900,
    href: "/collections",
  },
  {
    id: "mehndi",
    label: "Mehndi",
    name: "Kesar",
    images: ["/occasions/mehndi-kesar.webp", ...gallery("kesar").slice(1)],
    price: 72500,
    originalPrice: 103600,
    href: "/collections",
  },
  {
    id: "nikkah",
    label: "Nikkah",
    name: "Opulent",
    images: ["/occasions/nikkah-opulent.webp", ...gallery("opulent").slice(1)],
    price: 96300,
    originalPrice: 137600,
    href: "/collections",
  },
  {
    id: "walima",
    label: "Walima",
    name: "Iriana",
    images: ["/occasions/walima-iriana.webp", ...gallery("iriana").slice(1)],
    price: 74500,
    originalPrice: 106300,
    href: "/collections",
  },
  {
    id: "mayun",
    label: "Mayun",
    name: "Arasti",
    images: [
      "/occasions/mayun-arasti.webp",
      ...gallery("arasti-mustard-yellow").slice(1),
    ],
    price: 75900,
    originalPrice: 108400,
    href: "/collections",
  },
  {
    id: "dholki",
    label: "Dholki",
    name: "Shocking Bridal",
    images: [
      "/occasions/dholki-shocking.webp",
      ...gallery("shocking-bridal").slice(1),
    ],
    price: 62600,
    originalPrice: 89500,
    href: "/collections",
  },
  {
    id: "engagement",
    label: "Engagement",
    name: "Zeena",
    images: ["/occasions/engagement-zeena.webp", ...gallery("zeena").slice(1)],
    price: 78600,
    originalPrice: 112300,
    href: "/collections",
  },
  {
    id: "eid",
    label: "Eid",
    name: "Noreen",
    images: ["/occasions/eid-noreen.webp", ...gallery("noreen").slice(1)],
    price: 67300,
    originalPrice: 96100,
    href: "/collections",
  },
];

/** New Arrivals — eight products, same sequence as the reference. */
export const newArrivalProducts: CollectionProduct[] = [
  {
    id: "mehrshah",
    name: "Mehrshah",
    images: gallery("mariyam"),
    price: 67500,
    originalPrice: 96700,
    href: "/shop",
  },
  {
    id: "zarbaft",
    name: "Zarbaft",
    images: gallery("embroidered-mcp-106"),
    price: 61900,
    originalPrice: 88100,
    href: "/shop",
  },
  {
    id: "glory",
    name: "Glory",
    images: gallery("ishani"),
    price: 78700,
    originalPrice: 112400,
    href: "/shop",
  },
  {
    id: "rangrez",
    name: "Rangrez",
    images: gallery("sabyasachi"),
    price: 97400,
    originalPrice: 139400,
    href: "/shop",
  },
  {
    id: "shabnam",
    name: "Shabnam",
    images: gallery("pink-embroidered"),
    price: 54400,
    originalPrice: 78000,
    href: "/shop",
  },
  {
    id: "mehrgul",
    name: "Mehrgul",
    images: gallery("pista-embroidered"),
    price: 65600,
    originalPrice: 93700,
    href: "/shop",
  },
  {
    id: "naqshzar",
    name: "Naqshzar",
    images: gallery("naheed"),
    price: 84300,
    originalPrice: 120700,
    href: "/shop",
  },
  {
    id: "zargulbadan",
    name: "Zargulbadan",
    images: gallery("surajmukhi"),
    price: 75000,
    originalPrice: 107200,
    href: "/shop",
  },
];

/** Luxury Formals — eight products, same sequence as the reference. */
export const luxuryFormalProducts: CollectionProduct[] = [
  {
    id: "elia",
    name: "Elia",
    images: gallery("elia"),
    price: 78600,
    originalPrice: 112300,
    href: "/shop",
  },
  {
    id: "char-06",
    name: "Char -06",
    images: gallery("char"),
    price: 64200,
    originalPrice: 91700,
    href: "/shop",
  },
  {
    id: "lucent",
    name: "Lucent",
    images: gallery("lucent"),
    price: 65600,
    originalPrice: 93700,
    href: "/shop",
  },
  {
    id: "mira-elegant",
    name: "Mira Elegant",
    images: gallery("mira-elegant"),
    price: 90500,
    originalPrice: 129300,
    href: "/shop",
  },
  {
    id: "nuriyya",
    name: "Nuriyya",
    images: gallery("kiara"),
    price: 85300,
    originalPrice: 121800,
    href: "/shop",
  },
  {
    id: "gulafza",
    name: "Gulafza",
    images: gallery("hyacinth"),
    price: 89400,
    originalPrice: 127700,
    href: "/shop",
  },
  {
    id: "offwhite-red",
    name: "Offwhite & red",
    images: gallery("offwhite-red"),
    price: 62500,
    originalPrice: 89300,
    href: "/shop",
  },
  {
    id: "minahil",
    name: "Minahil",
    images: gallery("minahil"),
    price: 63900,
    originalPrice: 91300,
    href: "/shop",
  },
];

/** Best Selling — eight products, same sequence as the reference. */
export const bestSellingProducts: CollectionProduct[] = [
  {
    id: "best-elia",
    name: "Elia",
    images: gallery("elia"),
    price: 78600,
    originalPrice: 112300,
    href: "/shop",
  },
  {
    id: "sevgi",
    name: "Sevgi",
    images: gallery("sevgi"),
    price: 63900,
    originalPrice: 91300,
    href: "/shop",
  },
  {
    id: "best-char-06",
    name: "Char -06",
    images: gallery("char"),
    price: 64200,
    originalPrice: 91700,
    href: "/shop",
  },
  {
    id: "saxe",
    name: "Saxe",
    images: gallery("saxe"),
    price: 63900,
    originalPrice: 91300,
    href: "/shop",
  },
  {
    id: "darya",
    name: "Darya",
    images: gallery("darya"),
    price: 67300,
    originalPrice: 96100,
    href: "/shop",
  },
  {
    id: "best-noreen",
    name: "Noreen",
    images: gallery("noreen"),
    price: 67300,
    originalPrice: 96100,
    href: "/shop",
  },
  {
    id: "best-kesar",
    name: "Kesar",
    images: gallery("kesar"),
    price: 72500,
    originalPrice: 103600,
    href: "/shop",
  },
  {
    id: "melodic-tassels",
    name: "Melodic Tassels",
    images: gallery("melodic-tassels"),
    price: 74500,
    originalPrice: 106300,
    href: "/shop",
  },
];
