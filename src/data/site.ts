/**
 * Site-wide content & configuration — single source of truth.
 * Edit this file to update the store name, contact details, navigation,
 * occasions, categories, reviews and gallery across the whole site.
 */

export const stylingAssistanceMessage =
  "Hello Damsa Coture, I would like some styling assistance.";

export const siteConfig = {
  name: "Damsa Coture",
  tagline: "Luxury Designer-Inspired Dresses",
  company: "PPD GLOBAL LLC",
  email: "support@premiumpakistanidresses.com",
  phone: "+92 320 0909666",
  whatsapp: `https://wa.me/923200909666?text=${encodeURIComponent(stylingAssistanceMessage)}`,
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

export const reviews: Review[] = [
  {
    id: "fiza-zafar",
    rating: 5,
    text: "I wore this dress on my brother's wedding and honestly everyone asked me where i bought this dress from. i am very happy with the dress and its quality.",
    author: "Fiza Zafar",
    verified: true,
    date: "2026-10-21",
    image: "/images/reviews/review-01.png",
    product: "Maria.B - Elaria Style",
    productHref: "/shop",
  },
  {
    id: "shiza-iqbal",
    rating: 5,
    text: "Absolutely love thiss dress. the color and the design and the quality is exceptional and very good customer service. i highly recommend buying from here",
    author: "Shiza Iqbal",
    verified: true,
    date: "2026-10-19",
    image: "/images/reviews/review-02.jpg",
    product: "Ahlah",
    productHref: "/shop",
  },
  {
    id: "meera-patel",
    rating: 5,
    text: "I am surprised they stitched it according to my requirement without charging me extra. The dress turned out be very beautiful. I am satisfied with their work.",
    author: "Meera Patel",
    verified: true,
    date: "2026-10-15",
    image: "/images/reviews/review-03.jpg",
    product: "Ronaq Jahan",
    productHref: "/shop",
  },
  {
    id: "muskaan-ali",
    rating: 5,
    text: "Mein order krne se pehle dar rhi thi ke scam na ho jaye kyun ke mere sath pehle bhi huwa tha photo mein dikhate kuch or hain bhejte kuch or lekin is brand ne jo dikhaya hai wohi bheja hai bilkul original jaisi quality hai is dress ki",
    author: "Muskaan Ali",
    verified: true,
    date: "2026-10-15",
    image: "/images/reviews/review-04.jpg",
    product: "Gul-e-khaas",
    productHref: "/shop",
  },
  {
    id: "ayesha-noor",
    rating: 5,
    text: "They got the best replicas in the market\nreally loved the stitching and the finishing of the dress. it fits me perfectly.",
    author: "Ayesha Noor",
    verified: true,
    date: "2026-10-15",
    image: "/images/reviews/review-05.jpg",
    product: "3-Piece Embroidered Suit",
    productHref: "/shop",
  },
  {
    id: "malaika-khan",
    rating: 5,
    text: "I have purchased alot of Ethnc dreses but these Ethnc copies are unbelievable.\nI cannot figure out if these are copies or original and you are getting 3 piece outfit at half the price of Ethnc 1 piece suit price omg",
    author: "Malaika Khan",
    verified: true,
    date: "2026-10-13",
    image: "/images/reviews/review-06.jpg",
    product: "3-Piece Embroidered Suit",
    productHref: "/shop",
  },
  {
    id: "anonymous",
    rating: 5,
    text: "Bought vintage zohra from premium pakistani dresses. The quality is amazing and the fabric feels very soft and high quality. Highly recommended",
    author: "Anonymous",
    verified: true,
    date: "2026-10-03",
    image: "/images/reviews/review-07.jpg",
    product: "Zohra",
    productHref: "/shop",
  },
  {
    id: "sania-amin",
    rating: 5,
    text: "The color the design the work! I cannot believe it's exactly same as the original designer dress. I am never wasting money on original now",
    author: "Sania Amin",
    verified: true,
    date: "2026-10-01",
    image: "/images/reviews/review-08.jpg",
    product: "Nawal",
    productHref: "/shop",
  },
  {
    id: "fatima-ijaz",
    rating: 5,
    text: "I loved this dress . The look is exactly like the model pictures everyone complimented me \u{1F60D}",
    author: "Fatima Ijaz",
    verified: true,
    date: "2026-10-01",
    image: "/images/reviews/review-09.jpg",
    product: "Dark Emerald",
    productHref: "/shop",
  },
  {
    id: "zoya-ali",
    rating: 5,
    text: "Satisfied with their custom stitching \u2764\uFE0F",
    author: "Zoya Ali",
    verified: true,
    date: "2026-10-01",
    image: "/images/reviews/review-10.jpg",
    product: "Reverie",
    productHref: "/shop",
  },
  {
    id: "sana-malik",
    rating: 5,
    text: "Parcel time pe mil gaya aur dress bohat achi condition mein thi. Satisfied with my order.",
    author: "Sana Malik",
    verified: true,
    date: "2026-10-01",
    image: "/images/reviews/review-11.jpg",
    product: "Ciel",
    productHref: "/shop",
  },
  {
    id: "ananya-kapoor",
    rating: 5,
    text: "Kafi he clean dres hai mujhe to personally bhot acha laga hai oper se inki service bhi bhot achi hai",
    author: "Ananya Kapoor",
    verified: true,
    date: "2026-10-01",
    image: "/images/reviews/review-12.jpg",
    product: "Aurea",
    productHref: "/shop",
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
