"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Product } from "@/lib/products";

/**
 * The catalogue the server read for this request, handed to the client
 * components that need to search it or add a piece to the cart. Keeping it in
 * one provider means every surface uses the same database prices.
 */
const CatalogContext = createContext<Product[]>([]);

export function StoreCatalogProvider({
  products,
  children,
}: {
  products: Product[];
  children: ReactNode;
}) {
  return <CatalogContext.Provider value={products}>{children}</CatalogContext.Provider>;
}

/** The live storefront catalogue. Empty only outside the storefront layout. */
export function useCatalogProducts(): Product[] {
  return useContext(CatalogContext);
}
