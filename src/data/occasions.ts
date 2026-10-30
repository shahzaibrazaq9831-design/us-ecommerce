export interface Occasion {
  title: string;
  slug: string;
  image: string;
  href: string;
}

/**
 * Occasions shown in the home-page carousel, in display order.
 * Artwork lives in /public/occasions; each file is named after the product photo.
 */
export const occasions: Occasion[] = [
  {
    title: "Barat",
    slug: "barat",
    image: "/occasions/barat-sarang.webp",
    href: "/collections/barat",
  },
  {
    title: "Mehndi",
    slug: "mehndi",
    image: "/occasions/mehndi-kesar.webp",
    href: "/collections/mehndi",
  },
  {
    title: "Nikkah",
    slug: "nikkah",
    image: "/occasions/nikkah-opulent.webp",
    href: "/collections/nikkah",
  },
  {
    title: "Walima",
    slug: "walima",
    image: "/occasions/walima-iriana.webp",
    href: "/collections/walima",
  },
  {
    title: "Mayun",
    slug: "mayun",
    image: "/occasions/mayun-arasti.webp",
    href: "/collections/mayun",
  },
  {
    title: "Dholki",
    slug: "dholki",
    image: "/occasions/dholki-shocking.webp",
    href: "/collections/dholki",
  },
  {
    title: "Engagement",
    slug: "engagement",
    image: "/occasions/engagement-zeena.webp",
    href: "/collections/engagement",
  },
  {
    title: "Eid",
    slug: "eid",
    image: "/occasions/eid-noreen.webp",
    href: "/collections/eid",
  },
];
