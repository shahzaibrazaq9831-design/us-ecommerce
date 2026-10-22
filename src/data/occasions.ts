export interface Occasion {
  title: string;
  slug: string;
  image: string;
  href: string;
}

/**
 * Occasions shown in the home-page carousel, in display order.
 * Artwork lives in /public/occasions and is named after the slug.
 */
export const occasions: Occasion[] = [
  {
    title: "Barat",
    slug: "barat",
    image: "/occasions/barat.webp",
    href: "/collections/barat",
  },
  {
    title: "Mehndi",
    slug: "mehndi",
    image: "/occasions/mehndi.webp",
    href: "/collections/mehndi",
  },
  {
    title: "Nikkah",
    slug: "nikkah",
    image: "/occasions/nikkah.webp",
    href: "/collections/nikkah",
  },
  {
    title: "Walima",
    slug: "walima",
    image: "/occasions/walima.webp",
    href: "/collections/walima",
  },
  {
    title: "Mayun",
    slug: "mayun",
    image: "/occasions/mayun.webp",
    href: "/collections/mayun",
  },
  {
    title: "Dholki",
    slug: "dholki",
    image: "/occasions/dholki.webp",
    href: "/collections/dholki",
  },
  {
    title: "Engagement",
    slug: "engagement",
    image: "/occasions/engagement.webp",
    href: "/collections/engagement",
  },
  {
    title: "Eid",
    slug: "eid",
    image: "/occasions/eid.webp",
    href: "/collections/eid",
  },
];
