"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { countries, type Country } from "@/data/countries";
import { formatCurrency } from "@/lib/currency";

interface CurrencyContextType {
  country: Country;
  currency: string;
  setCountry: (country: Country) => void;
  formatPrice: (priceInPKR: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const DEFAULT_COUNTRY = countries[0]; // Pakistan
const STORAGE_KEY = "selectedCountry";

function findByCode(code?: string): Country | undefined {
  return countries.find((c) => c.code === code);
}

function readCookie(): Country | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.split("; ").find((row) => row.startsWith(`${STORAGE_KEY}=`));
  if (!match) return undefined;
  try {
    const parsed = JSON.parse(decodeURIComponent(match.slice(STORAGE_KEY.length + 1)));
    return findByCode(parsed?.code);
  } catch {
    return undefined;
  }
}

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [country, setCountryState] = useState<Country>(DEFAULT_COUNTRY);

  // Restore the visitor's previous selection (localStorage first, cookie as fallback).
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const found = findByCode(parsed?.code);
        if (found) {
          setCountryState(found);
          return;
        }
      }
    } catch {}
    const fromCookie = readCookie();
    if (fromCookie) setCountryState(fromCookie);
  }, []);

  const setCountry = useCallback((c: Country) => {
    setCountryState(c);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
      document.cookie = `${STORAGE_KEY}=${encodeURIComponent(JSON.stringify(c))}; path=/; max-age=31536000`;
    } catch {}
  }, []);

  const formatPrice = useCallback(
    (priceInPKR: number) => formatCurrency(priceInPKR, country.currency),
    [country.currency]
  );

  const value = useMemo(
    () => ({ country, currency: country.currency, setCountry, formatPrice }),
    [country, setCountry, formatPrice]
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
}
