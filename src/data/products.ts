/**
 * Products data — single source of truth.
 * Edit this file to add/update products. No API or database yet.
 */

export type Badge = "new" | "sale" | "bestseller";

export interface Product {
  id: number;
  slug: string;
  name: string;
  category: string;
  price: number;
  originalPrice: number | null;
  image: string;
  badge?: Badge;
  rating: number;
  reviews: number;
  description: string;
}

export const products: Product[] = [
  {
    id: 1,
    slug: "royal-blue-chiffon-suit",
    name: "Embroidered Chiffon Suit - Royal Blue",
    category: "Chiffon",
    price: 89.99,
    originalPrice: 119.99,
    image: "/images/dress-1.jpg",
    badge: "bestseller",
    rating: 4.8,
    reviews: 124,
    description:
      "Exquisitely crafted chiffon suit featuring intricate hand-embroidery with gold threadwork. This stunning royal blue ensemble includes a beautifully embroidered kameez, matching dupatta, and comfortable shalwar. Perfect for weddings, formal events, and special occasions.",
  },
  {
    id: 2,
    slug: "maroon-gold-lehenga",
    name: "Bridal Lehenga - Maroon Gold",
    category: "Bridal",
    price: 299.99,
    originalPrice: 399.99,
    image: "/images/dress-2.jpg",
    badge: "sale",
    rating: 4.9,
    reviews: 89,
    description:
      "A show-stopping bridal lehenga in deep maroon with rich gold zardozi work. Layers of luxurious fabric create a dramatic silhouette fit for the bride. Includes the lehenga, dupatta, and unstitched blouse piece for a perfect custom fit.",
  },
  {
    id: 3,
    slug: "emerald-green-silk-formal",
    name: "Silk Formal Dress - Emerald Green",
    category: "Formals",
    price: 149.99,
    originalPrice: null,
    image: "/images/dress-3.jpg",
    badge: "new",
    rating: 4.7,
    reviews: 56,
    description:
      "A refined emerald green silk formal with delicate embellishment along the neckline and sleeves. The fluid drape and rich jewel tone make it ideal for evening gatherings and festive celebrations.",
  },
  {
    id: 4,
    slug: "pastel-pink-anarkali",
    name: "Anarkali Gown - Pastel Pink",
    category: "Formals",
    price: 129.99,
    originalPrice: 159.99,
    image: "/images/dress-4.jpg",
    badge: "sale",
    rating: 4.6,
    reviews: 78,
    description:
      "A graceful pastel pink Anarkali gown with a fitted bodice and flowing flared skirt. Lightweight, comfortable, and finished with subtle sequin detail — a timeless choice for daytime events.",
  },
  {
    id: 5,
    slug: "ivory-gold-sharara",
    name: "Wedding Sharara - Ivory Gold",
    category: "Wedding",
    price: 249.99,
    originalPrice: null,
    image: "/images/dress-5.jpg",
    badge: "new",
    rating: 4.9,
    reviews: 45,
    description:
      "An elegant ivory and gold wedding sharara set with ornate embroidery and a matching dupatta. A regal option for the bride or a close family member on the wedding day.",
  },
  {
    id: 6,
    slug: "mustard-yellow-mehndi",
    name: "Mehndi Outfit - Mustard Yellow",
    category: "Mehndi",
    price: 99.99,
    originalPrice: 129.99,
    image: "/images/dress-6.jpg",
    badge: "bestseller",
    rating: 4.8,
    reviews: 112,
    description:
      "A vibrant mustard yellow mehndi outfit, full of festive energy. Comfortable to wear all night, with playful embroidery and a matching dupatta. A customer favourite for mehndi celebrations.",
  },
  {
    id: 7,
    slug: "white-silver-nikkah",
    name: "Nikkah Dress - White Silver",
    category: "Nikkah",
    price: 179.99,
    originalPrice: null,
    image: "/images/dress-7.jpg",
    badge: "new",
    rating: 4.7,
    reviews: 34,
    description:
      "A serene white and silver nikkah dress with understated shimmer and elegant tailoring. A beautiful, modest choice for your nikkah ceremony.",
  },
  {
    id: 8,
    slug: "teal-blue-eid",
    name: "Eid Collection - Teal Blue",
    category: "Eid",
    price: 119.99,
    originalPrice: 149.99,
    image: "/images/dress-8.jpg",
    badge: "sale",
    rating: 4.5,
    reviews: 67,
    description:
      "Celebrate Eid in style with this teal blue festive ensemble. Featuring delicate embroidery and a matching dupatta, it is a joyful addition to your Eid wardrobe.",
  },
];

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((product) => product.slug === slug);
}

export function getRelatedProducts(slug: string, limit = 4): Product[] {
  return products.filter((product) => product.slug !== slug).slice(0, limit);
}

export function formatPrice(value: number): string {
  return `$${value.toFixed(2)}`;
}
