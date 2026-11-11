/**
 * Product catalogue — the single source of truth for the whole store.
 *
 * Every product, category, occasion and designer lives in this one file.
 * Pages never build their own lists: they ask this module for the products
 * they need, which keeps the storefront honest (a page can never promise a
 * product that the catalogue does not have) and makes the later swap to a
 * database a one-file change — keep the same exported names and the rest of
 * the app keeps working.
 *
 * Prices are stored in PKR (the store's base currency). The currency layer
 * converts them for display, so nothing here needs to know about currencies.
 */

/* ------------------------------------------------------------------ *
 * Types
 * ------------------------------------------------------------------ */

export type Badge = "new" | "sale" | "bestseller";

/** How a piece can be made for the customer. */
export type StitchingOption = "unstitched" | "standard" | "custom";

/** The four shop-by-category shelves. */
export type CategorySlug = "bridal" | "wedding" | "formals" | "chiffon";

/** The eight celebrations we dress for. */
export type OccasionSlug =
  | "barat"
  | "mehndi"
  | "nikkah"
  | "walima"
  | "mayun"
  | "dholki"
  | "engagement"
  | "eid";

/** Designer houses (placeholder names — swap for your own labels). */
export type BrandSlug =
  | "rung-e-bahar"
  | "gulshan-studios"
  | "mehran-labels"
  | "zoya-collective"
  | "heer-and-co"
  | "neel-khaki"
  | "rooh-fashion";

export type Availability = "in_stock" | "out_of_stock";

export interface Product {
  id: number;
  slug: string;
  name: string;
  /** Category slug — see `categories`. */
  category: CategorySlug;
  /** Human label for the category, shown on cards. */
  categoryLabel: string;
  /** Every celebration this piece is made for. */
  occasions: OccasionSlug[];
  /** Designer house this piece belongs to. */
  brand: BrandSlug;
  /** Selling price in PKR. */
  price: number;
  /** Compare-at price in PKR, or null when the piece is not reduced. */
  originalPrice: number | null;
  /** Main image (the first gallery shot). */
  image: string;
  /** Full gallery — images[0] is the main view. */
  images: string[];
  /** Editorial badge: "new" for fresh pieces, "bestseller" for the movers. */
  badge?: Badge;
  /** True when the piece landed in the latest drop. */
  isNew: boolean;
  /** True when the piece is one of our most-ordered designs. */
  isBestSeller: boolean;
  /** Ways this piece can be made for the customer. */
  stitching: StitchingOption[];
  rating: number;
  reviews: number;
  description: string;
  /** Stock code used on invoices and in structured data. */
  sku: string;
  availability: Availability;
  /** Selected options from the buy section (made-to-order items). */
  size?: string;
  lining?: string;
  notes?: string;
}

export interface Category {
  slug: CategorySlug;
  name: string;
  href: string;
  image: string;
  /** Short line shown on the shelf card. */
  description: string;
}

export interface Occasion {
  slug: OccasionSlug;
  name: string;
  href: string;
  image: string;
  /** Lookbook artwork used on the occasion tiles. */
  photo: string;
  /** The product that leads this occasion on the home page. */
  featuredSlug: string;
  description: string;
}

export interface Brand {
  slug: BrandSlug;
  name: string;
  href: string;
  description: string;
}

/* ------------------------------------------------------------------ *
 * Taxonomy
 * ------------------------------------------------------------------ */

export const categories: Category[] = [
  {
    slug: "bridal",
    name: "Bridal Dresses",
    href: "/categories/bridal",
    image: "/images/01.png",
    description: "Red and pink bridal wear for nikkah, walima and the big day.",
  },
  {
    slug: "wedding",
    name: "Wedding Dresses",
    href: "/categories/wedding",
    image: "/images/06.png",
    description: "Heavy embroidery and festive colour for every wedding function.",
  },
  {
    slug: "formals",
    name: "Formals",
    href: "/categories/formals",
    image: "/images/02.png",
    description: "Evening formals that stay comfortable from guest list to dinner.",
  },
  {
    slug: "chiffon",
    name: "Chiffon",
    href: "/categories/chiffon",
    image: "/images/05.png",
    description: "Light, flowing chiffon pieces for daytime celebrations.",
  },
];

export const occasions: Occasion[] = [
  {
    slug: "barat",
    name: "Barat",
    href: "/collections/barat",
    image: "/images/06.png",
    photo: "/occasions/barat-sarang.webp",
    featuredSlug: "sarang",
    description: "Regal looks for the groom's wedding day and the baraat entry.",
  },
  {
    slug: "mehndi",
    name: "Mehndi",
    href: "/collections/mehndi",
    image: "/images/07.png",
    photo: "/occasions/mehndi-kesar.webp",
    featuredSlug: "kesar",
    description: "Bright, playful colour for the henna night.",
  },
  {
    slug: "nikkah",
    name: "Nikkah",
    href: "/collections/nikkah",
    image: "/images/04.png",
    photo: "/occasions/nikkah-opulent.webp",
    featuredSlug: "opulent",
    description: "Graceful, well-cut attire for the nikkah ceremony.",
  },
  {
    slug: "walima",
    name: "Walima",
    href: "/collections/walima",
    image: "/images/01.png",
    photo: "/occasions/walima-iriana.webp",
    featuredSlug: "iriana",
    description: "Reception looks that photograph well and stay easy to wear.",
  },
  {
    slug: "mayun",
    name: "Mayun",
    href: "/collections/mayun",
    image: "/images/05.png",
    photo: "/occasions/mayun-arasti.webp",
    featuredSlug: "arasti-mustard-yellow",
    description: "Soft pastels and traditional mayun outfits.",
  },
  {
    slug: "dholki",
    name: "Dholki",
    href: "/collections/dholki",
    image: "/images/08.png",
    photo: "/occasions/dholki-shocking.webp",
    featuredSlug: "shocking-bridal",
    description: "Fun, festive outfits built for a loud musical night.",
  },
  {
    slug: "engagement",
    name: "Engagement",
    href: "/collections/engagement",
    image: "/images/02.png",
    photo: "/occasions/engagement-zeena.webp",
    featuredSlug: "zeena",
    description: "Romantic looks to celebrate the engagement.",
  },
  {
    slug: "eid",
    name: "Eid",
    href: "/collections/eid",
    image: "/images/03.png",
    photo: "/occasions/eid-noreen.webp",
    featuredSlug: "noreen",
    description: "Joyful festive wear for Eid at home and at the table.",
  },
];

export const brands: Brand[] = [
  {
    slug: "rung-e-bahar",
    name: "Rung E Bahar Atelier",
    href: "/brands/rung-e-bahar",
    description: "Our house line — the pieces we make first and restock most.",
  },
  {
    slug: "gulshan-studios",
    name: "Gulshan Studios",
    href: "/brands/gulshan-studios",
    description: "Festive colour work with heavy borders and a bold dupatta.",
  },
  {
    slug: "mehran-labels",
    name: "Mehran Labels",
    href: "/brands/mehran-labels",
    description: "Soft bridal and walima pieces with fine, delicate stitching.",
  },
  {
    slug: "zoya-collective",
    name: "Zoya Collective",
    href: "/brands/zoya-collective",
    description: "Contemporary cuts for mehndi nights and evening receptions.",
  },
  {
    slug: "heer-and-co",
    name: "Heer & Co.",
    href: "/brands/heer-and-co",
    description: "Formalwear built for long evenings and warm venues.",
  },
  {
    slug: "neel-khaki",
    name: "Neel Khaki",
    href: "/brands/neel-khaki",
    description: "Light, airy fabrics that move well in warm weather.",
  },
  {
    slug: "rooh-fashion",
    name: "Rooh Fashion",
    href: "/brands/rooh-fashion",
    description: "Colour-first designs for dholkis, mayuns and Eid.",
  },
];

/** Human labels for the stitching options shown on cards. */
export const stitchingLabels: Record<StitchingOption, string> = {
  unstitched: "Unstitched",
  standard: "Standard",
  custom: "Custom",
};

/* ------------------------------------------------------------------ *
 * Products
 * ------------------------------------------------------------------ */

/** The three photos saved for every product under /public/images/rungebahar. */
const gallery = (handle: string): string[] => [
  `/images/rungebahar/${handle}-1.webp`,
  `/images/rungebahar/${handle}-2.webp`,
  `/images/rungebahar/${handle}-3.webp`,
];

interface ProductSeed {
  slug: string;
  name: string;
  category: CategorySlug;
  occasions: OccasionSlug[];
  brand: BrandSlug;
  price: number;
  /** Compare-at price — null means the piece is not on offer. */
  originalPrice: number | null;
  rating: number;
  reviews: number;
  isNew?: boolean;
  isBestSeller?: boolean;
  /** Extra stitching options on top of the standard + custom pair. */
  unstitched?: boolean;
  availability?: Availability;
  description: string;
}

/**
 * The catalogue. Prices are the store's own numbers in PKR; the copy is
 * written for this shop and describes the piece in front of you.
 */
const SEEDS: ProductSeed[] = [
  {
    slug: "sarang",
    name: "Sarang",
    category: "bridal",
    occasions: ["barat"],
    brand: "rung-e-bahar",
    price: 91600,
    originalPrice: 130900,
    rating: 4.9,
    reviews: 268,
    unstitched: true,
    description:
      "A deep-toned bridal three-piece with dense zardozi across the bodice and a wide embroidered dupatta that reaches the floor.",
  },
  {
    slug: "darya",
    name: "Darya",
    category: "bridal",
    occasions: ["barat", "engagement"],
    brand: "mehran-labels",
    price: 67300,
    originalPrice: 96100,
    rating: 4.7,
    reviews: 124,
    isNew: true,
    description:
      "Soft rose bridal wear with pearl-dotted sleeves and a long, worked dupatta that carries the whole look.",
  },
  {
    slug: "hyacinth",
    name: "Hyacinth",
    category: "bridal",
    occasions: ["barat"],
    brand: "gulshan-studios",
    price: 89400,
    originalPrice: 127700,
    rating: 4.6,
    reviews: 88,
    unstitched: true,
    description:
      "A structured bridal ensemble in cool ivory, cut long for the evening and finished with sequins along the border.",
  },
  {
    slug: "kiara",
    name: "Kiara",
    category: "bridal",
    occasions: ["walima"],
    brand: "mehran-labels",
    price: 85300,
    originalPrice: 121800,
    rating: 4.6,
    reviews: 91,
    isNew: true,
    description:
      "Regal bridal wear with a full flare, mirror work on the bodice and a dupatta with a scalloped edge.",
  },
  {
    slug: "sabyasachi",
    name: "Sabyasachi",
    category: "bridal",
    occasions: ["barat"],
    brand: "zoya-collective",
    price: 73400,
    originalPrice: 105000,
    rating: 4.7,
    reviews: 149,
    isNew: true,
    description:
      "A wedding-day classic with antique gold embroidery down the front and a matching straight trouser.",
  },
  {
    slug: "shocking-bridal",
    name: "Shocking Bridal",
    category: "bridal",
    occasions: ["dholki"],
    brand: "rooh-fashion",
    price: 62600,
    originalPrice: 89500,
    rating: 4.7,
    reviews: 183,
    isBestSeller: true,
    description:
      "Bright magenta bridal wear with heavy dabka work and a bold dupatta that reads well from across the room.",
  },
  {
    slug: "zeena",
    name: "Zeena",
    category: "bridal",
    occasions: ["engagement"],
    brand: "gulshan-studios",
    price: 78600,
    originalPrice: 112300,
    rating: 4.6,
    reviews: 94,
    description:
      "A soft pink engagement three-piece with an embroidered sheer neckline and a light, floaty dupatta.",
  },
  {
    slug: "kesar",
    name: "Kesar",
    category: "wedding",
    occasions: ["mehndi"],
    brand: "rung-e-bahar",
    price: 72500,
    originalPrice: 103600,
    rating: 4.7,
    reviews: 158,
    isBestSeller: true,
    unstitched: true,
    description:
      "Warm turmeric tones for the henna night, with mirror work on the sleeves and a playful frilled hem.",
  },
  {
    slug: "mariyam",
    name: "Mariyam",
    category: "wedding",
    occasions: ["mehndi"],
    brand: "mehran-labels",
    price: 55900,
    originalPrice: null,
    rating: 4.6,
    reviews: 112,
    isNew: true,
    unstitched: true,
    description:
      "A bright mehndi look in leafy green, embroidered down the front with a dupatta in the same shade.",
  },
  {
    slug: "ishani",
    name: "Ishani",
    category: "wedding",
    occasions: ["mehndi"],
    brand: "zoya-collective",
    price: 55900,
    originalPrice: null,
    rating: 4.5,
    reviews: 64,
    isNew: true,
    description:
      "Coral and gold mehndi wear, light enough for a long dance floor and detailed enough for the photos.",
  },
  {
    slug: "offwhite-red",
    name: "Offwhite & Red",
    category: "wedding",
    occasions: ["mehndi"],
    brand: "neel-khaki",
    price: 62500,
    originalPrice: null,
    rating: 4.4,
    reviews: 58,
    unstitched: true,
    description:
      "An off-white base with deep red panels, made for mehndi functions where the colour needs to stay loud.",
  },
  {
    slug: "opulent",
    name: "Opulent",
    category: "wedding",
    occasions: ["nikkah"],
    brand: "rung-e-bahar",
    price: 96300,
    originalPrice: 137600,
    rating: 4.9,
    reviews: 241,
    isNew: true,
    unstitched: true,
    description:
      "A nikkah-day three-piece in deep wine, densely embroidered with pearls and finished with a matching dupatta.",
  },
  {
    slug: "iriana",
    name: "Iriana",
    category: "wedding",
    occasions: ["nikkah", "walima"],
    brand: "rung-e-bahar",
    price: 74500,
    originalPrice: 106300,
    rating: 4.8,
    reviews: 176,
    isBestSeller: true,
    unstitched: true,
    description:
      "Graceful nikkah and walima wear in cool ivory, with fine thread work and a softly pleated trouser.",
  },
  {
    slug: "naheed",
    name: "Naheed",
    category: "wedding",
    occasions: ["nikkah"],
    brand: "heer-and-co",
    price: 84300,
    originalPrice: null,
    rating: 4.6,
    reviews: 85,
    availability: "out_of_stock",
    description:
      "A formal nikkah look in deep plum with tonal embroidery that stays elegant under evening light.",
  },
  {
    slug: "mira-elegant",
    name: "Mira Elegant",
    category: "formals",
    occasions: ["nikkah", "eid"],
    brand: "heer-and-co",
    price: 90500,
    originalPrice: null,
    rating: 4.9,
    reviews: 197,
    availability: "out_of_stock",
    description:
      "Minimal formalwear for a reception dinner — clean lines, restrained thread work, an easy drape.",
  },
  {
    slug: "elia",
    name: "Elia",
    category: "chiffon",
    occasions: ["walima"],
    brand: "mehran-labels",
    price: 59200,
    originalPrice: 84600,
    rating: 4.9,
    reviews: 208,
    isNew: true,
    description:
      "A flowy chiffon walima look with a light, sheer layer that moves as you walk.",
  },
  {
    slug: "minahil",
    name: "Minahil",
    category: "formals",
    occasions: ["walima"],
    brand: "heer-and-co",
    price: 63900,
    originalPrice: null,
    rating: 4.7,
    reviews: 134,
    description:
      "A soft formal three-piece with muted gold accents, made for a walima that runs late into the night.",
  },
  {
    slug: "noreen",
    name: "Noreen",
    category: "formals",
    occasions: ["eid"],
    brand: "gulshan-studios",
    price: 67300,
    originalPrice: 96100,
    rating: 4.8,
    reviews: 165,
    unstitched: true,
    description:
      "Our Eid favourite — a festive three-piece with a flowing dupatta and bright, cheerful detailing.",
  },
  {
    slug: "lucent",
    name: "Lucent",
    category: "formals",
    occasions: ["engagement", "eid"],
    brand: "neel-khaki",
    price: 65600,
    originalPrice: 93700,
    rating: 4.4,
    reviews: 73,
    description:
      "A light formal look that moves well, finished with a clean neckline and delicate beadwork.",
  },
  {
    slug: "saxe",
    name: "Saxe",
    category: "formals",
    occasions: ["engagement", "eid"],
    brand: "zoya-collective",
    price: 63900,
    originalPrice: null,
    rating: 4.3,
    reviews: 47,
    isBestSeller: true,
    description:
      "A sleek engagement outfit in a soft neutral, minimal work, easy to wear through a long reception.",
  },
  {
    slug: "sevgi",
    name: "Sevgi",
    category: "formals",
    occasions: ["dholki"],
    brand: "zoya-collective",
    price: 63900,
    originalPrice: 91300,
    rating: 4.6,
    reviews: 121,
    isBestSeller: true,
    description:
      "Deep dholki colour with gold detailing at the neck and cuffs — made for loud, happy nights.",
  },
  {
    slug: "arasti-mustard-yellow",
    name: "Arasti",
    category: "wedding",
    occasions: ["mayun"],
    brand: "gulshan-studios",
    price: 75900,
    originalPrice: 108400,
    rating: 4.8,
    reviews: 186,
    isBestSeller: true,
    description:
      "Mustard yellow mayun wear, embroidered in warm thread with a matching statement dupatta.",
  },
  {
    slug: "pista-embroidered",
    name: "Pista Embroidered",
    category: "chiffon",
    occasions: ["mayun"],
    brand: "neel-khaki",
    price: 65600,
    originalPrice: 93700,
    rating: 4.6,
    reviews: 104,
    description:
      "Soft green mayun wear with fine tonal work along the neckline and hem.",
  },
  {
    slug: "melodic-tassels",
    name: "Melodic Tassels",
    category: "chiffon",
    occasions: ["mayun", "eid"],
    brand: "neel-khaki",
    price: 69800,
    originalPrice: 99800,
    rating: 4.5,
    reviews: 52,
    availability: "out_of_stock",
    description:
      "A light festive look built around tassel detail, made for a mayun or an Eid gathering.",
  },
  {
    slug: "pink-embroidered",
    name: "Pink Embroidered",
    category: "chiffon",
    occasions: ["mayun"],
    brand: "rooh-fashion",
    price: 71500,
    originalPrice: 102100,
    rating: 4.5,
    reviews: 69,
    description:
      "Blush pink festive wear with an all-over fine embroidery and a sheer, draping dupatta.",
  },
  {
    slug: "char-06",
    name: "Char -06",
    category: "wedding",
    occasions: ["dholki"],
    brand: "heer-and-co",
    price: 48400,
    originalPrice: 69100,
    rating: 4.6,
    reviews: 97,
    isNew: true,
    description:
      "A bright dholki number in warm coral, cut for dancing and paired with a short, easy dupatta.",
  },
  {
    slug: "embroidered-mcp-106",
    name: "Embroidered MCP 106",
    category: "chiffon",
    occasions: ["dholki"],
    brand: "rooh-fashion",
    price: 61900,
    originalPrice: 88100,
    rating: 4.5,
    reviews: 143,
    isBestSeller: true,
    availability: "out_of_stock",
    description:
      "A festive embroidered set that works for dholki evenings and family get-togethers alike.",
  },
  {
    slug: "surajmukhi",
    name: "Surajmukhi",
    category: "chiffon",
    occasions: ["eid"],
    brand: "rooh-fashion",
    price: 75000,
    originalPrice: 107200,
    rating: 4.8,
    reviews: 159,
    isBestSeller: true,
    description:
      "Sunlit yellow festive wear with an embroidered front, made for Eid mornings at home.",
  },
];

/** Stable numeric id — the position in the catalogue, plus one. */
export const products: Product[] = SEEDS.map((seed, index) => {
  const images = gallery(seed.slug === "char-06" ? "char" : seed.slug);
  const stitching: StitchingOption[] = seed.unstitched
    ? ["unstitched", "standard", "custom"]
    : ["standard", "custom"];

  const product: Product = {
    id: index + 1,
    slug: seed.slug,
    name: seed.name,
    category: seed.category,
    categoryLabel:
      categories.find((category) => category.slug === seed.category)?.name ?? seed.category,
    occasions: seed.occasions,
    brand: seed.brand,
    price: seed.price,
    originalPrice: seed.originalPrice,
    image: images[0],
    images,
    isNew: Boolean(seed.isNew),
    isBestSeller: Boolean(seed.isBestSeller),
    stitching,
    rating: seed.rating,
    reviews: seed.reviews,
    description: seed.description,
    sku: `REB-${seed.category.slice(0, 3).toUpperCase()}-${String(index + 1).padStart(3, "0")}`,
    availability: seed.availability ?? "in_stock",
  };

  if (seed.isNew) product.badge = "new";
  else if (seed.isBestSeller) product.badge = "bestseller";

  return product;
});

/* ------------------------------------------------------------------ *
 * Look-ups
 * ------------------------------------------------------------------ */

export function getProductBySlug(slug: string): Product | undefined {
  const clean = slug.replace(/^new-arrival-/, "");
  return products.find((product) => product.slug === clean);
}

export function getProductsByCategory(category: CategorySlug): Product[] {
  return products.filter((product) => product.category === category);
}

export function getProductsByOccasion(occasion: OccasionSlug): Product[] {
  return products.filter((product) => product.occasions.includes(occasion));
}

export function getProductsByBrand(brand: BrandSlug): Product[] {
  return products.filter((product) => product.brand === brand);
}

export function getNewArrivals(): Product[] {
  return products.filter((product) => product.isNew);
}

export function getBestSellers(): Product[] {
  return products.filter((product) => product.isBestSeller);
}

/** Everything currently reduced — a compare-at price means it is on offer. */
export function getSaleProducts(): Product[] {
  return products.filter(
    (product) => product.originalPrice !== null && product.originalPrice > product.price
  );
}

export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find((category) => category.slug === slug);
}

export function getOccasionBySlug(slug: string): Occasion | undefined {
  return occasions.find((occasion) => occasion.slug === slug);
}

export function getBrandBySlug(slug: string): Brand | undefined {
  return brands.find((brand) => brand.slug === slug);
}

/**
 * The "Luxury Formals" shelf on the home page — a curated mix of our
 * heaviest formal pieces. Slugs only, so the shelf can be re-arranged
 * without touching any prices or copy.
 */
export const luxuryFormalShelf: string[] = [
  "hyacinth",
  "lucent",
  "mira-elegant",
  "minahil",
  "naheed",
  "noreen",
  "offwhite-red",
  "pista-embroidered",
];

/** Products in the order given, skipping any slug that is not in the catalogue. */
export function getProductsBySlugs(slugs: string[]): Product[] {
  return slugs
    .map((slug) => getProductBySlug(slug))
    .filter((product): product is Product => Boolean(product));
}

/**
 * Search across the fields a shopper actually types: the product name, the
 * category, the celebration it is made for and the designer.
 */
export function searchProducts(query: string): Product[] {
  const term = query.trim().toLowerCase();
  if (!term) return [];

  return products.filter((product) => {
    const haystack = [
      product.name,
      product.categoryLabel,
      product.category,
      product.brand,
      ...product.occasions,
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(term);
  });
}

/** How much is taken off, as a whole percentage (0 when the piece is full price). */
export function getDiscountPercent(product: Product): number {
  if (product.originalPrice === null || product.originalPrice <= product.price) return 0;
  return Math.round((1 - product.price / product.originalPrice) * 100);
}

export interface CardBadge {
  label: string;
  kind: "new" | "bestseller" | "sale";
}

/**
 * The badge shown on a product card: a fresh arrival wins, then our best
 * seller, then the saving. Everything else shows no badge.
 */
export function getCardBadge(product: Product): CardBadge | null {
  if (product.isNew) return { label: "New", kind: "new" };
  if (product.isBestSeller) return { label: "Best Seller", kind: "bestseller" };

  const discount = getDiscountPercent(product);
  if (discount > 0) return { label: `-${discount}%`, kind: "sale" };

  return null;
}

/** The stitching line printed under the product name. */
export function getStitchingLabel(product: Product): string {
  return product.stitching.map((option) => stitchingLabels[option]).join(" · ");
}

/** Products that share a shelf with this one, without repeating it. */
export function getRelatedProducts(slug: string, limit = 4): Product[] {
  const product = getProductBySlug(slug);
  if (!product) return products.slice(0, limit);

  const scored = products
    .filter((candidate) => candidate.slug !== product.slug)
    .map((candidate) => {
      let score = 0;
      if (candidate.category === product.category) score += 3;
      if (candidate.occasions.some((occasion) => product.occasions.includes(occasion))) score += 2;
      if (candidate.brand === product.brand) score += 1;
      return { candidate, score };
    })
    .sort((a, b) => b.score - a.score || a.candidate.id - b.candidate.id);

  return scored.slice(0, limit).map((entry) => entry.candidate);
}

/* ------------------------------------------------------------------ *
 * Counts — the homepage and the listing pages read these, so a shelf
 * can never advertise more products than the catalogue holds.
 * ------------------------------------------------------------------ */

export function getCategoryCounts(): Record<string, number> {
  return categories.reduce<Record<string, number>>((counts, category) => {
    counts[category.slug] = getProductsByCategory(category.slug).length;
    return counts;
  }, {});
}

export function getOccasionCounts(): Record<string, number> {
  return occasions.reduce<Record<string, number>>((counts, occasion) => {
    counts[occasion.slug] = getProductsByOccasion(occasion.slug).length;
    return counts;
  }, {});
}

export function getBrandCounts(): Record<string, number> {
  return brands.reduce<Record<string, number>>((counts, brand) => {
    counts[brand.slug] = getProductsByBrand(brand.slug).length;
    return counts;
  }, {});
}

/** Every product page the sitemap and the static params need. */
export function getAllProductSlugs(): string[] {
  return products.map((product) => product.slug);
}
