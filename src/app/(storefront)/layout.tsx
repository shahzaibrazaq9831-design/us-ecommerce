import { cookies } from "next/headers";
import { Suspense } from "react";
import { CartProvider } from "@/context/CartContext";
import { CurrencyProvider } from "@/context/CurrencyContext";
import { ProductRatingsProvider } from "@/components/ProductRatingsProvider";
import { StoreCatalogProvider } from "@/components/StoreCatalogProvider";
import { getExchangeRates, resolveCurrency } from "@/lib/currency";
import { getStorefrontProducts } from "@/lib/storefront-catalog";
import AnnouncementBar from "@/components/AnnouncementBar";
import Header from "@/components/Header";
import Breadcrumbs from "@/components/Breadcrumbs";
import Footer from "@/components/Footer";
import FloatingElements from "@/components/FloatingElements";
import FloatingWhatsApp from "@/components/FloatingWhatsApp";
import CartDrawer from "@/components/CartDrawer";
import CookieConsent from "@/components/CookieConsent";
import { getStorefrontSettings } from "@/lib/storefront-settings";

/**
 * Everything a customer sees around a page — including the announcement bar —
 * belongs to this group only. Admin screens use the root layout directly, so
 * there is no flash of storefront chrome on login or refresh.
 */
export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <StorefrontShell>{children}</StorefrontShell>
    </Suspense>
  );
}

async function StorefrontShell({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  // The region provider writes `ppd_currency`; `currency` is the legacy name.
  const initialCurrency = resolveCurrency(
    cookieStore.get("ppd_currency")?.value ?? cookieStore.get("currency")?.value
  );
  const [rates, settings, catalog] = await Promise.all([
    getExchangeRates(),
    getStorefrontSettings(),
    getStorefrontProducts(),
  ]);

  return (
    <CurrencyProvider initialCurrency={initialCurrency} rates={rates}>
      <StoreCatalogProvider products={catalog}>
      <CartProvider>
        {/* The real ratings, from the approved reviews only. */}
        <ProductRatingsProvider>
          {/* Keyboard users can jump straight past the header and nav. */}
          <a className="skip-link" href="#main-content">
            Skip to content
          </a>
          {/* The announcement bar sits in the normal flow, above the sticky
              header block, so scrolling a little slides it out of view the way
              it does on the reference store. */}
          <AnnouncementBar text={settings.announcementText} />
          <div className="site-topbar sticky top-0 z-[1000] bg-white">
            <Suspense
              fallback={
                <header
                  className="header header--placeholder h-[var(--header-total-height)] [border-bottom:none]! [box-shadow:none]!"
                  aria-hidden="true"
                />
              }
            >
              <Header />
            </Suspense>
          </div>
          <Suspense fallback={null}>
            <Breadcrumbs />
          </Suspense>
          <main id="main-content">{children}</main>
          <Footer />
          <FloatingElements />
          <FloatingWhatsApp />
          <CartDrawer />
          {/* The cookie banner sits over the page: it never pushes the
              content down and never locks the scroll. */}
          <CookieConsent />
        </ProductRatingsProvider>
      </CartProvider>
      </StoreCatalogProvider>
    </CurrencyProvider>
  );
}
