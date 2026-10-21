"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { countries, type Country } from "@/data/countries";
import { exchangeRates } from "@/lib/currency";

interface CurrencyContextType {
  country: Country;
  currency: string;
  setCountry: (country: Country) => void;
  formatPrice: (priceInPKR: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const DEFAULT_COUNTRY = countries[0]; // Pakistan

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [country, setCountryState] = useState<Country>(DEFAULT_COUNTRY);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("selectedCountry");
      if (saved) {
        const parsed = JSON.parse(saved);
        const found = countries.find((c) => c.code === parsed.code);
        if (found) {
          setCountryState(found);
        }
      }
    } catch {}
  }, []);

  const setCountry = (c: Country) => {
    setCountryState(c);
    try {
      localStorage.setItem("selectedCountry", JSON.stringify(c));
      document.cookie = `selectedCountry=${encodeURIComponent(JSON.stringify(c))}; path=/; max-age=31536000`;
    } catch {}
  };

  const formatPrice = (priceInPKR: number) => {
    const rate = exchangeRates[country.currency] || 1;
    const converted = priceInPKR * rate;
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: country.currency,
        maximumFractionDigits: country.currency === "JPY" || country.currency === "PKR" ? 0 : 2,
      }).format(converted);
    } catch {
      return `${country.currency} ${converted.toFixed(2)}`;
    }
  };

  return (
    <CurrencyContext.Provider value={{ country, currency: country.currency, setCountry, formatPrice }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
}
