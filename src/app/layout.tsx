import type { Metadata } from "next";
import { cookies } from "next/headers";
import {
  Playfair_Display,
  Inter,
  Plus_Jakarta_Sans,
} from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { CurrencyProvider } from "@/context/CurrencyContext";
import { getExchangeRates, resolveCurrency } from "@/lib/currency";
import AnnouncementBar from "@/components/AnnouncementBar";
import Header from "@/components/Header";
import OfferStrip from "@/components/OfferStrip";
import Footer from "@/components/Footer";
import FloatingElements from "@/components/FloatingElements";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";
import { Suspense } from "react";

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
  title: "Premium Pakistani Dresses | Luxury Designer-Inspired Collection",
  description:
    "Shop luxury Pakistani designer-inspired dresses. Free worldwide delivery, 7-day returns and made-to-order stitching.",
};

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
        <Suspense fallback={null}>
          <CurrencyInit>{children}</CurrencyInit>
        </Suspense>
      </body>
    </html>
  );
}

async function CurrencyInit({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const initialCurrency = resolveCurrency(cookieStore.get("currency")?.value);
  const rates = await getExchangeRates();
  return (
    <CurrencyProvider initialCurrency={initialCurrency} rates={rates}>
      <CartProvider>
        <AnnouncementBar />
        <Suspense fallback={<header className="header" />}>
          <Header />
        </Suspense>
        <OfferStrip />
        <main>{children}</main>
        <Footer />
        <FloatingElements />
        <FloatingWhatsApp />
      </CartProvider>
    </CurrencyProvider>
  );
}
