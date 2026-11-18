import type { Metadata } from "next";
import {
  Playfair_Display,
  Inter,
  Plus_Jakarta_Sans,
} from "next/font/google";
import "./globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { SITE_NAME, SITE_URL } from "@/lib/seo";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-review",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Rung E Bahar | Luxury Designer-Inspired Dresses",
    template: "%s",
  },
  description:
    "Shop luxury Pakistani designer-inspired dresses. Free worldwide delivery, made-to-order stitching and a clear returns process for eligible items.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: "Rung E Bahar | Luxury Designer-Inspired Collection",
    description:
      "Bridal, wedding, formal and chiffon dresses made to order. Free worldwide shipping and three stitching options.",
    url: SITE_URL,
    locale: "en_GB",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — Luxury Designer-Inspired Dresses`,
    description:
      "Bridal, wedding, formal and chiffon dresses made to order. Free worldwide shipping and three stitching options.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

/**
 * Keep the root layout limited to document-level concerns. The storefront
 * chrome lives in the (storefront) layout so it never wraps /admin.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${playfair.variable} ${inter.variable} ${plusJakarta.variable}`}
    >
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"
        />
      </head>
      <body>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
