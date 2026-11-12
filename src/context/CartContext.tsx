"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { Measurements, Product, StitchingOption } from "@/lib/products";
import {
  discountAmount,
  validateDiscountCode,
  type DiscountValidation,
} from "@/lib/discounts";

/**
 * What the customer chose on the product page. Every cart line keeps
 * its own choices, so the same piece in two sizes (or stitched to two
 * different sets of measurements) stays two separate lines.
 */
export interface CartSelection {
  /** How the piece is made. */
  stitching: StitchingOption;
  /** The ready-made size, for standard stitching. */
  size?: string;
  /** Sleeve lining, for standard stitching. */
  lining?: string;
  /** The customer's own measurements, for custom stitching. */
  measurements?: Measurements;
  /** Anything the customer asked us to add. */
  notes?: string;
}

/**
 * A cart line: the piece, the choices made for it and how many.
 *
 * `stitching` on a line is the way the customer chose (one option),
 * while `stitching` on a product is the list of ways it can be made.
 */
export interface CartItem extends Omit<Product, "stitching">, CartSelection {
  quantity: number;
}

/**
 * Stable key for a cart line — the same piece with different options is
 * a different line, so two customers can order the same dress in
 * different sizes without the lines merging.
 */
export function cartLineKey(
  item: Pick<
    CartItem,
    "slug" | "stitching" | "size" | "lining" | "notes" | "measurements"
  >
): string {
  const measurements = item.measurements
    ? [
        item.measurements.unit,
        item.measurements.bust,
        item.measurements.waist,
        item.measurements.hip,
        item.measurements.shoulder,
        item.measurements.sleeveLength,
        item.measurements.dressLength,
      ].join("/")
    : "";

  return [
    item.slug,
    item.stitching ?? "",
    item.size ?? "",
    item.lining ?? "",
    measurements,
    (item.notes ?? "").trim(),
  ].join("::");
}

/** The stitching we assume when a customer adds a piece without choosing. */
export function defaultSelection(product: Product): CartSelection {
  const stitching: StitchingOption = product.stitching.includes("standard")
    ? "standard"
    : (product.stitching[0] ?? "standard");

  return { stitching };
}

export interface ToastItem {
  id: number;
  message: string;
}

interface StoreContextValue {
  cart: CartItem[];
  wishlist: string[];
  /** Add a piece to the cart, keeping the choices made on the product page. */
  addToCart: (
    product: Product,
    selection?: Partial<CartSelection>,
    quantity?: number
  ) => void;
  removeFromCart: (lineKey: string) => void;
  updateQuantity: (lineKey: string, quantity: number) => void;
  clearCart: () => void;
  /** The discount code in the cart — "" when there is none. */
  discountCode: string;
  /** Check a code and keep it when it is valid. */
  applyDiscountCode: (code: string) => DiscountValidation;
  /** Take the discount code off the cart. */
  clearDiscountCode: () => void;
  /** Sum of the lines, before the discount. */
  subtotal: number;
  /** How much the discount code takes off. */
  discount: number;
  /** What the customer pays — subtotal minus the discount. */
  total: number;
  toggleWishlist: (slug: string) => void;
  isWishlisted: (slug: string) => boolean;
  cartCount: number;
  cartTotal: number;
  /** Is the cart drawer open? */
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  quickView: Product | null;
  openQuickView: (product: Product) => void;
  closeQuickView: () => void;
  toast: ToastItem | null;
  showToast: (message: string) => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

/* ------------------------------------------------------------------ *
 * Saved state
 *
 * The cart, the wishlist and the discount code live in the browser, so
 * they are still there after a reload. They are read through
 * `useSyncExternalStore`: the server always sends the empty version and
 * the browser fills it in after the page is painted, which keeps the
 * first render identical on both sides.
 * ------------------------------------------------------------------ */

const CART_KEY = "ppd_cart";
const WISHLIST_KEY = "ppd_wishlist";
const DISCOUNT_KEY = "ppd_cart_discount";

type Listener = () => void;

interface PersistentStore<T> {
  subscribe: (listener: Listener) => () => void;
  getSnapshot: () => T;
  getServerSnapshot: () => T;
  write: (value: T) => void;
}

/** A value kept in localStorage, shared by everyone on the page. */
function createPersistentStore<T>(key: string, fallback: T): PersistentStore<T> {
  const listeners = new Set<Listener>();
  let cachedRaw: string | null = null;
  let cachedValue: T = fallback;

  const read = (): T => {
    if (typeof window === "undefined") return fallback;

    let raw: string | null = null;
    try {
      raw = window.localStorage.getItem(key);
    } catch {
      return fallback;
    }

    // The same string means the same value — keep the old object so the
    // snapshot stays stable between renders.
    if (raw === cachedRaw) return cachedValue;

    cachedRaw = raw;
    try {
      cachedValue = raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      cachedValue = fallback;
    }

    return cachedValue;
  };

  return {
    subscribe(listener: Listener) {
      listeners.add(listener);

      // Another tab writing to the same key should update this one too.
      const onStorage = (event: StorageEvent) => {
        if (event.key === key) listener();
      };
      window.addEventListener("storage", onStorage);

      return () => {
        listeners.delete(listener);
        window.removeEventListener("storage", onStorage);
      };
    },
    getSnapshot: read,
    getServerSnapshot: () => fallback,
    write(value: T) {
      const raw = JSON.stringify(value);
      cachedRaw = raw;
      cachedValue = value;

      try {
        window.localStorage.setItem(key, raw);
      } catch {
        // The browser refused to store it — the cart still works for this visit.
      }

      for (const listener of listeners) listener();
    },
  };
}

const cartStore = createPersistentStore<CartItem[]>(CART_KEY, []);
const wishlistStore = createPersistentStore<string[]>(WISHLIST_KEY, []);
const discountStore = createPersistentStore<string>(DISCOUNT_KEY, "");

export function CartProvider({ children }: { children: ReactNode }) {
  const cart = useSyncExternalStore(
    cartStore.subscribe,
    cartStore.getSnapshot,
    cartStore.getServerSnapshot
  );
  const wishlist = useSyncExternalStore(
    wishlistStore.subscribe,
    wishlistStore.getSnapshot,
    wishlistStore.getServerSnapshot
  );
  const discountCode = useSyncExternalStore(
    discountStore.subscribe,
    discountStore.getSnapshot,
    discountStore.getServerSnapshot
  );

  const [quickView, setQuickView] = useState<Product | null>(null);
  const [toast, setToast] = useState<ToastItem | null>(null);
  const [isCartOpen, setCartOpen] = useState(false);

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
    (
      product: Product,
      selection?: Partial<CartSelection>,
      quantity = 1
    ) => {
      const chosen: CartSelection = { ...defaultSelection(product), ...selection };
      const lineKey = cartLineKey({ ...product, ...chosen });

      const current = cartStore.getSnapshot();
      const existing = current.find((item) => cartLineKey(item) === lineKey);

      const next = existing
        ? current.map((item) =>
            cartLineKey(item) === lineKey
              ? { ...item, quantity: item.quantity + quantity }
              : item
          )
        : [...current, { ...product, ...chosen, quantity }];

      cartStore.write(next);
      showToast("Added to cart");
    },
    [showToast]
  );

  const removeFromCart = useCallback(
    (lineKey: string) => {
      cartStore.write(
        cartStore.getSnapshot().filter((item) => cartLineKey(item) !== lineKey)
      );
      showToast("Removed from cart");
    },
    [showToast]
  );

  const updateQuantity = useCallback((lineKey: string, quantity: number) => {
    const current = cartStore.getSnapshot();

    if (quantity <= 0) {
      cartStore.write(current.filter((item) => cartLineKey(item) !== lineKey));
      return;
    }

    cartStore.write(
      current.map((item) =>
        cartLineKey(item) === lineKey ? { ...item, quantity } : item
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    cartStore.write([]);
  }, []);

  const applyDiscountCode = useCallback(
    (code: string) => {
      const validation = validateDiscountCode(code);
      if (validation.valid) {
        discountStore.write(validation.code);
        showToast(`${validation.code} applied`);
      }
      return validation;
    },
    [showToast]
  );

  const clearDiscountCode = useCallback(() => {
    discountStore.write("");
  }, []);

  const toggleWishlist = useCallback(
    (slug: string) => {
      const current = wishlistStore.getSnapshot();
      const exists = current.includes(slug);

      wishlistStore.write(
        exists ? current.filter((s) => s !== slug) : [...current, slug]
      );
      showToast(exists ? "Removed from wishlist" : "Added to wishlist");
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

  const openCart = useCallback(() => setCartOpen(true), []);
  const closeCart = useCallback(() => setCartOpen(false), []);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const subtotal = cartTotal;
  const discount = useMemo(
    () => discountAmount(subtotal, discountCode),
    [subtotal, discountCode]
  );
  const total = Math.max(0, subtotal - discount);

  const value: StoreContextValue = {
    cart,
    wishlist,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    discountCode,
    applyDiscountCode,
    clearDiscountCode,
    subtotal,
    discount,
    total,
    toggleWishlist,
    isWishlisted,
    cartCount,
    cartTotal,
    isCartOpen,
    openCart,
    closeCart,
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
