"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatPrice as formatCurrencyAmount, isSupportedCurrency, STATIC_RATES } from "@/lib/currency";
import { FALLBACK_MARKET, getMarketByCode, getMarketByCurrency, isSupportedMarketCode, MARKETS, Market } from "@/lib/markets";

export interface CurrencyContextType {
  /** Currently selected currency code (e.g. "USD"). */
  currency: string;
  /** Switch the storefront currency (persisted to localStorage + cookies). */
  setCurrency: (currency: string) => void;
  /** Active conversion rates (base currency → target currency). */
  rates: Record<string, number>;
  /** Format a base-currency amount in the given (or the active) currency. */
  formatPrice: (amount: number, currencyCode?: string) => string;
  /** Current price market (country) the visitor is browsing in. */
  region: Market;
  /** True once the visitor deliberately picked a country or currency. */
  hasManualRegionPreference: boolean;
  /** True while the visitor's market is still being auto-detected. */
  isDetectingRegion: boolean;
  /** Switch the storefront country (market); the currency follows. */
  setRegionCode: (code: string) => void;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const STORAGE_KEY = "currency";
const FALLBACK_CURRENCY = "PKR";
/** Region cookies — names and lifetime match the live site. */
const REGION_COOKIE = "ppd_region";
const CURRENCY_COOKIE = "ppd_currency";
const REGION_SOURCE_COOKIE = "ppd_region_source";
const LEGACY_CURRENCY_COOKIE = "currency";
const COOKIE_MAX_AGE = 31536000; // one year
/** sessionStorage cache for the region lookup (30 minutes, like the live site). */
const REGION_CACHE_KEY = "ppd-region-detection";
const REGION_CACHE_MS = 18e5;
const REGION_FETCH_TIMEOUT_MS = 5000;

function readCookie(name: string): string {
  const match = document.cookie.split("; ").find((row) => row.startsWith(`${name}=`));
  if (!match) return "";
  try {
    return decodeURIComponent(match.slice(name.length + 1)).trim().toUpperCase();
  } catch {
    return "";
  }
}

function writeCookie(name: string, value: string) {
  try {
    document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
  } catch {
    // Cookies can be unavailable in private browsing; in-memory state still works.
  }
}

interface CurrencyProviderProps {
  children: React.ReactNode;
  /** Currency resolved on the server from the region cookies (first paint). */
  initialCurrency?: string;
  /** Conversion rates from the base currency (server-fetched, cached 12h). */
  rates?: Record<string, number>;
}

export function CurrencyProvider({ children, initialCurrency, rates }: CurrencyProviderProps) {
  const router = useRouter();
  const [currency, setCurrencyState] = useState<string>(initialCurrency ?? FALLBACK_CURRENCY);
  const [hasManualRegionPreference, setHasManualRegionPreference] = useState(false);
  const [isDetectingRegion, setIsDetectingRegion] = useState(true);
  const activeRates = rates ?? STATIC_RATES;

  const region = useMemo(
    () => getMarketByCurrency(currency) ?? MARKETS[0],
    [currency]
  );

  /** Apply a market everywhere: state, localStorage (manual only) and cookies. */
  const applyRegion = useCallback((market: Market, source: "manual" | "auto") => {
    setCurrencyState(market.currency);
    setHasManualRegionPreference(source === "manual");
    setIsDetectingRegion(false);
    writeCookie(REGION_COOKIE, market.code);
    writeCookie(CURRENCY_COOKIE, market.currency);
    writeCookie(REGION_SOURCE_COOKIE, source);
    // The legacy cookie is what the server reads for the first paint.
    writeCookie(LEGACY_CURRENCY_COOKIE, market.currency);
    if (source === "manual") {
      try {
        localStorage.setItem(STORAGE_KEY, market.currency);
      } catch {}
    }
  }, []);

  /** Server-rendered prices on cart/checkout follow the cookies — refresh them. */
  const refreshCartPages = useCallback(() => {
    if (/^\/(?:cart|checkout)(?:\/|$)/.test(window.location.pathname)) router.refresh();
  }, [router]);

  /*
   * Restore the visitor's market after mount (client-side only, in a timer
   * callback so server and first client render stay identical):
   * 1. a deliberate choice stored by an earlier visit (localStorage or the
   *    manual region cookie),
   * 2. a ?currency=… URL parameter (also counts as a deliberate choice),
   * 3. auto-detection through /api/region, cached for 30 minutes.
   * When nothing can be resolved the store falls back to the United States,
   * exactly like the live site.
   */
  useEffect(() => {
    let cancelled = false;

    const restore = async () => {
      // 1) A deliberate market/currency choice from an earlier visit.
      let manual: Market | undefined;
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved && isSupportedCurrency(saved)) manual = getMarketByCurrency(saved);
      } catch {}
      if (!manual) {
        const code = readCookie(REGION_COOKIE);
        if (readCookie(REGION_SOURCE_COOKIE) === "manual" && isSupportedMarketCode(code)) {
          manual = getMarketByCode(code);
        }
      }
      if (manual) {
        applyRegion(manual, "manual");
        return;
      }

      // 2) ?currency=… on the URL counts as a deliberate choice.
      try {
        const param = new URLSearchParams(window.location.search).get("currency");
        if (param && isSupportedCurrency(param)) {
          applyRegion(getMarketByCurrency(param) ?? FALLBACK_MARKET, "manual");
          return;
        }
      } catch {}

      // 3) Auto-detect via the region API, cached for 30 minutes.
      let detected: string | null = null;
      try {
        const cached = sessionStorage.getItem(REGION_CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached) as { ts?: number; detected?: string | null };
          if (
            parsed &&
            typeof parsed.ts === "number" &&
            typeof parsed.detected === "string" &&
            Date.now() - parsed.ts <= REGION_CACHE_MS
          ) {
            detected = parsed.detected;
          }
        }
      } catch {}

      if (!detected) {
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), REGION_FETCH_TIMEOUT_MS);
          try {
            const response = await fetch("/api/region", { cache: "no-store", signal: controller.signal });
            if (response.ok) {
              const data = (await response.json()) as { regionCode?: string | null };
              const code = typeof data?.regionCode === "string" ? data.regionCode : "";
              if (code) {
                detected = code;
                try {
                  sessionStorage.setItem(
                    REGION_CACHE_KEY,
                    JSON.stringify({ detected: code, ts: Date.now() })
                  );
                } catch {}
              }
            }
          } finally {
            clearTimeout(timer);
          }
        } catch {
          // Offline, blocked or timed out → fall through to the fallback market.
        }
      }

      if (cancelled) return;
      applyRegion(getMarketByCode(detected ?? "") ?? FALLBACK_MARKET, "auto");
    };

    const timer = setTimeout(() => {
      void restore();
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [applyRegion]);

  const setRegionCode = useCallback(
    (code: string) => {
      const market = getMarketByCode(code);
      if (!market) return;
      applyRegion(market, "manual");
      refreshCartPages();
    },
    [applyRegion, refreshCartPages]
  );

  const setCurrency = useCallback(
    (currencyCode: string) => {
      const next = isSupportedCurrency(currencyCode) ? currencyCode.trim().toUpperCase() : FALLBACK_CURRENCY;
      applyRegion(getMarketByCurrency(next) ?? MARKETS[0], "manual");
      refreshCartPages();
    },
    [applyRegion, refreshCartPages]
  );

  const formatPrice = useCallback(
    (amount: number, currencyCode?: string) => formatCurrencyAmount(amount, currencyCode ?? currency, activeRates),
    [currency, activeRates]
  );

  const value = useMemo(
    () => ({
      currency,
      setCurrency,
      rates: activeRates,
      formatPrice,
      region,
      hasManualRegionPreference,
      isDetectingRegion,
      setRegionCode,
    }),
    [currency, setCurrency, activeRates, formatPrice, region, hasManualRegionPreference, isDetectingRegion, setRegionCode]
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
}
