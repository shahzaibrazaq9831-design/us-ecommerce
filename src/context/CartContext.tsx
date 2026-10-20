"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Product } from "@/data/products";

export interface CartItem extends Product {
  quantity: number;
}

export interface ToastItem {
  id: number;
  message: string;
}

interface StoreContextValue {
  cart: CartItem[];
  wishlist: string[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (slug: string) => void;
  updateQuantity: (slug: string, quantity: number) => void;
  clearCart: () => void;
  toggleWishlist: (slug: string) => void;
  isWishlisted: (slug: string) => boolean;
  cartCount: number;
  cartTotal: number;
  quickView: Product | null;
  openQuickView: (product: Product) => void;
  closeQuickView: () => void;
  toast: ToastItem | null;
  showToast: (message: string) => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

const CART_KEY = "ppd_cart";
const WISHLIST_KEY = "ppd_wishlist";

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [quickView, setQuickView] = useState<Product | null>(null);
  const [toast, setToast] = useState<ToastItem | null>(null);

  // Load from localStorage after mount to avoid hydration mismatch
  useEffect(() => {
    setCart(readJson<CartItem[]>(CART_KEY, []));
    setWishlist(readJson<string[]>(WISHLIST_KEY, []));
  }, []);

  // Persist
  useEffect(() => {
    writeJson(CART_KEY, cart);
  }, [cart]);

  useEffect(() => {
    writeJson(WISHLIST_KEY, wishlist);
  }, [wishlist]);

  // Auto-hide toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const showToast = useCallback((message: string) => {
    setToast({ id: Date.now(), message });
  }, []);

  const addToCart = useCallback(
    (product: Product, quantity = 1) => {
      setCart((prev) => {
        const existing = prev.find((item) => item.slug === product.slug);
        if (existing) {
          return prev.map((item) =>
            item.slug === product.slug
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        }
        return [...prev, { ...product, quantity }];
      });
      showToast("Added to cart");
    },
    [showToast]
  );

  const removeFromCart = useCallback(
    (slug: string) => {
      setCart((prev) => prev.filter((item) => item.slug !== slug));
      showToast("Removed from cart");
    },
    [showToast]
  );

  const updateQuantity = useCallback(
    (slug: string, quantity: number) => {
      if (quantity <= 0) {
        setCart((prev) => prev.filter((item) => item.slug !== slug));
        return;
      }
      setCart((prev) =>
        prev.map((item) => (item.slug === slug ? { ...item, quantity } : item))
      );
    },
    []
  );

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const toggleWishlist = useCallback(
    (slug: string) => {
      setWishlist((prev) => {
        const exists = prev.includes(slug);
        if (exists) {
          showToast("Removed from wishlist");
          return prev.filter((s) => s !== slug);
        }
        showToast("Added to wishlist");
        return [...prev, slug];
      });
    },
    [showToast]
  );

  const isWishlisted = useCallback(
    (slug: string) => wishlist.includes(slug),
    [wishlist]
  );

  const openQuickView = useCallback((product: Product) => {
    setQuickView(product);
  }, []);

  const closeQuickView = useCallback(() => {
    setQuickView(null);
  }, []);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const value: StoreContextValue = {
    cart,
    wishlist,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    toggleWishlist,
    isWishlisted,
    cartCount,
    cartTotal,
    quickView,
    openQuickView,
    closeQuickView,
    toast,
    showToast,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useCart() {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return ctx;
}
