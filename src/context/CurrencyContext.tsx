"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { formatPrice as formatCurrencyAmount, isSupportedCurrency, resolveCurrency, STATIC_RATES } from "@/lib/currency";

export interface CurrencyContextType {
  /** Currently selected currency code (e.g. "USD"). */
  currency: string;
  /** Switch the storefront currency (persisted to localStorage + cookie). */
  setCurrency: (currency: string) => void;
  /** Active conversion rates (base currency → target currency). */
  rates: Record<string, number>;
  /** Format a base-currency amount in the given (or the active) currency. */
  formatPrice: (amount: number, currencyCode?: string) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const STORAGE_KEY = "currency";
const FALLBACK_CURRENCY = "PKR";

function readCookieCurrency(): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.split("; ").find((row) => row.startsWith("currency="));
  if (!match) return undefined;
  try {
    const value = decodeURIComponent(match.slice("currency=".length));
    return resolveCurrency(value);
  } catch {
    return undefined;
  }
}

interface CurrencyProviderProps {
  children: React.ReactNode;
  /** Currency resolved on the server from the `currency` cookie (first paint). */
  initialCurrency?: string;
  /** Conversion rates from the base currency (server-fetched, cached 12h). */
  rates?: Record<string, number>;
}

export function CurrencyProvider({ children, initialCurrency, rates }: CurrencyProviderProps) {
  const [currency, setCurrencyState] = useState<string>(initialCurrency ?? FALLBACK_CURRENCY);
  const activeRates = rates ?? STATIC_RATES;

  // Restore the visitor's saved currency after mount: localStorage first, cookie as fallback.
  // Read client-side only so server and first client render agree (no hydration mismatch).
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && isSupportedCurrency(saved)) {
        setCurrencyState(saved);
        return;
      }
    } catch {}
    const fromCookie = readCookieCurrency();
    if (fromCookie) setCurrencyState(fromCookie);
  }, []);

  const setCurrency = useCallback((code: string) => {
    const next = isSupportedCurrency(code) ? code.trim().toUpperCase() : FALLBACK_CURRENCY;
    setCurrencyState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {}
    try {
      document.cookie = `${STORAGE_KEY}=${next}; path=/; max-age=31536000; samesite=lax`;
    } catch {}
  }, []);

  const formatPrice = useCallback(
    (amount: number, currencyCode?: string) => formatCurrencyAmount(amount, currencyCode ?? currency, activeRates),
    [currency, activeRates]
  );

  const value = useMemo(
    () => ({ currency, setCurrency, rates: activeRates, formatPrice }),
    [currency, setCurrency, activeRates, formatPrice]
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
}
