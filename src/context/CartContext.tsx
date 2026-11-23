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
import {
  measurementFields,
  standardSizes,
  validateMeasurements,
  type MeasurementKey,
  type MeasurementUnit,
  type Measurements,
  type Product,
  type StitchingOption,
} from "@/lib/products";
import { multiBuyDiscount } from "@/lib/offers";
import { MAX_QUANTITY_PER_LINE } from "@/lib/pricing";

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

/**
 * Can this selection actually be ordered? A ready-made piece needs a size and
 * a made-to-measure piece needs every measurement. Cards and wishlist buttons
 * add a piece in one click, so this check keeps a half-chosen piece out of the
 * cart — checkout would otherwise refuse it with no way to put it right.
 */
export function selectionComplete(
  product: Product,
  selection: CartSelection
): boolean {
  if (product.availability === "out_of_stock") return false;
  if (!product.stitching.includes(selection.stitching)) return false;

  if (selection.stitching === "standard") {
    return Boolean(selection.size && standardSizes.includes(selection.size));
  }

  if (selection.stitching === "custom") {
    if (!selection.measurements) return false;
    const values = Object.fromEntries(
      measurementFields.map((field) => [
        field.key,
        String(selection.measurements?.[field.key as MeasurementKey] ?? ""),
      ])
    ) as Record<MeasurementKey, string>;
    const unit: MeasurementUnit = selection.measurements.unit ?? "in";
    return validateMeasurements(values, unit).valid;
  }

  return true;
}

export interface ToastItem {
  id: number;
  message: string;
  /** An optional link shown beside the message, e.g. "View cart". */
  action?: { label: string; href: string };
}

interface StoreContextValue {
  cart: CartItem[];
  /**
   * The single line bought with "Buy now". It is kept beside the cart, never
   * in it, so a Buy now order cannot pick up anything else the customer has
   * saved for later.
   */
  buyNow: CartItem | null;
  /** Start a Buy now order with exactly one piece and its chosen options. */
  setBuyNow: (
    product: Product,
    selection?: Partial<CartSelection>,
    quantity?: number
  ) => void;
  /** Change the quantity of the Buy now line. */
  updateBuyNowQuantity: (quantity: number) => void;
  /** Discard the Buy now order. */
  clearBuyNow: () => void;
  wishlist: string[];
  /** Add a piece to the cart, keeping the choices made on the product page. */
  addToCart: (
    product: Product,
    selection?: Partial<CartSelection>,
    quantity?: number
  ) => void;
  removeFromCart: (lineKey: string) => void;
  updateQuantity: (lineKey: string, quantity: number) => void;
  /** Change the choices on a saved line, keeping its place in the cart. */
  updateCartLineSelection: (
    lineKey: string,
    selection: Partial<CartSelection>
  ) => void;
  clearCart: () => void;
  /** Sum of the lines, before the multi-buy discount. */
  subtotal: number;
  /** What the automatic multi-buy offer takes off. */
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
  showToast: (message: string, action?: ToastItem["action"]) => void;
  dismissToast: () => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

/* ------------------------------------------------------------------ *
 * Saved state
 *
 * The cart and the wishlist live in the browser, so they are still there
 * after a reload. They are read through `useSyncExternalStore`: the server
 * always sends the empty version and the browser fills it in after the page
 * is painted, which keeps the first render identical on both sides.
 * ------------------------------------------------------------------ */

const CART_KEY = "ppd_cart";
const WISHLIST_KEY = "ppd_wishlist";
/** The one-line Buy now order. Kept separately so it survives a refresh. */
const BUY_NOW_KEY = "ppd_buy_now";

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
const buyNowStore = createPersistentStore<CartItem | null>(BUY_NOW_KEY, null);

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
  const buyNow = useSyncExternalStore(
    buyNowStore.subscribe,
    buyNowStore.getSnapshot,
    buyNowStore.getServerSnapshot
  );

  const [quickView, setQuickView] = useState<Product | null>(null);
  const [toast, setToast] = useState<ToastItem | null>(null);
  const [isCartOpen, setCartOpen] = useState(false);

  // Auto-hide toast. A toast with a link stays long enough to be clicked.
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), toast.action ? 5000 : 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const showToast = useCallback(
    (message: string, action?: ToastItem["action"]) => {
      setToast({ id: Date.now(), message, action });
    },
    []
  );

  const dismissToast = useCallback(() => {
    setToast(null);
  }, []);

  /**
   * Start a one-piece order. This deliberately does not touch the cart: a
   * Buy now order is only ever the piece the customer chose right here.
   */
  const setBuyNow = useCallback(
    (
      product: Product,
      selection?: Partial<CartSelection>,
      quantity = 1
    ) => {
      const chosen: CartSelection = { ...defaultSelection(product), ...selection };
      buyNowStore.write({ ...product, ...chosen, quantity });
    },
    []
  );

  const updateBuyNowQuantity = useCallback((quantity: number) => {
    const current = buyNowStore.getSnapshot();
    if (!current) return;

    if (quantity <= 0) {
      buyNowStore.write(null);
      return;
    }

    buyNowStore.write({
      ...current,
      quantity: Math.min(MAX_QUANTITY_PER_LINE, quantity),
    });
  }, []);

  const clearBuyNow = useCallback(() => {
    buyNowStore.write(null);
  }, []);

  const addToCart = useCallback(
    (
      product: Product,
      selection?: Partial<CartSelection>,
      quantity = 1
    ) => {
      const chosen: CartSelection = { ...defaultSelection(product), ...selection };

      // A one-click add from a card or the wishlist has no size yet. Open the
      // quick view so the customer can choose one instead of saving a line
      // that checkout would have to reject.
      if (!selectionComplete(product, chosen)) {
        setQuickView(product);
        showToast("Choose your options to add this piece.");
        return;
      }

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
      // Adding to the cart starts the cart flow, so an earlier Buy now line
      // must not later take over a normal cart checkout.
      buyNowStore.write(null);
      showToast("Added to cart", { label: "View cart", href: "/cart" });
    },
    [setQuickView, showToast]
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

  /**
   * Repair a saved line's choices. Changing the choices changes the line key,
   * so the old line is replaced and an identical line already in the cart is
   * merged with it rather than left as a duplicate.
   */
  const updateCartLineSelection = useCallback(
    (lineKey: string, selection: Partial<CartSelection>) => {
      const current = cartStore.getSnapshot();
      const line = current.find((item) => cartLineKey(item) === lineKey);
      if (!line) return;

      const { quantity, ...choices } = line;
      const updated: CartItem = { ...choices, ...selection, quantity };
      const nextKey = cartLineKey(updated);
      const remaining = current.filter((item) => cartLineKey(item) !== lineKey);

      if (nextKey === lineKey) {
        cartStore.write(current.map((item) => (cartLineKey(item) === lineKey ? updated : item)));
        return;
      }

      const existing = remaining.find((item) => cartLineKey(item) === nextKey);
      cartStore.write(
        existing
          ? remaining.map((item) =>
              cartLineKey(item) === nextKey
                ? {
                    ...item,
                    quantity: Math.min(MAX_QUANTITY_PER_LINE, item.quantity + quantity),
                  }
                : item
            )
          : [...remaining, updated]
      );
    },
    []
  );

  const clearCart = useCallback(() => {
    cartStore.write([]);
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
    () => multiBuyDiscount(subtotal, cartCount),
    [subtotal, cartCount]
  );
  const total = Math.max(0, subtotal - discount);

  const value: StoreContextValue = {
    cart,
    buyNow,
    setBuyNow,
    updateBuyNowQuantity,
    clearBuyNow,
    wishlist,
    addToCart,
    removeFromCart,
    updateQuantity,
    updateCartLineSelection,
    clearCart,
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
    dismissToast,
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
