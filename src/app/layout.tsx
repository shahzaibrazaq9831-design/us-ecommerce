import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { CurrencyProvider } from "@/context/CurrencyContext";
import AnnouncementBar from "@/components/AnnouncementBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FloatingElements from "@/components/FloatingElements";
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

export const metadata: Metadata = {
  title: "Premium Pakistani Dresses | Luxury Designer-Inspired Collection",
  description:
    "Shop luxury Pakistani designer-inspired dresses. Free worldwide delivery, 7-day returns and made-to-order stitching.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"
        />
      </head>
      <body>
        <CurrencyProvider>
          <CartProvider>
            <AnnouncementBar />
            <Suspense fallback={<header className="header" />}>
              <Header />
            </Suspense>
            <main>{children}</main>
            <Footer />
            <FloatingElements />
          </CartProvider>
        </CurrencyProvider>
      </body>
    </html>
  );
}
